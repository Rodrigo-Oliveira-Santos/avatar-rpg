/**
 * PlayerSkillsModal — GM-side skill-tree editor for a single player.
 *
 * Loads the player's character via the Supabase-first `gm-characters`
 * helper, wraps it in a throwaway `Character` instance, and mounts the
 * regular `SkillTree` UI inside a modal so the GM can unlock / activate
 * habilities on the player's behalf. Mutations to the wrapped Character
 * are persisted back through `savePlayerCharacter` on each `notify()`
 * pulse (debounced) — the player will see the changes after their next
 * realtime tick or sheet refresh.
 *
 * Element resolution:
 *   - Benders → the player's element JSON (fire, water, …).
 *   - Sem Dobra → the SkillTree's own preview tabs let the GM browse
 *     either chiblocker or weapons trees before committing.
 */

import { createElement, on } from '../utils/dom.js';
import { toast } from '../utils/toast.js';
import { Character } from '../character/index.js';
import { SkillTree } from '../skills/index.js';
import { loadPlayerCharacter, savePlayerCharacter } from '../api/gm-characters.js';

const DEBOUNCE_MS = 400;

export class PlayerSkillsModal {
  constructor({ authManager, onChanged } = {}) {
    this.authManager = authManager;
    this.onChanged = typeof onChanged === 'function' ? onChanged : null;
    this.overlay = null;
    this.player = null;
    /** @type {Character|null} */
    this.tempCharacter = null;
    /** @type {SkillTree|null} */
    this.skillTree = null;
    this._unsubscribe = null;
    this._saveTimer = null;
    this._pendingSave = false;
  }

  async open(player) {
    if (!player?.username) {
      toast('Sem jogador selecionado.', 'warning');
      return;
    }
    // Tear down any previous session before starting a new one — otherwise
    // re-opening the modal on a different player would leak the previous
    // Character subscription, save timer and pending-save flag.
    this.close();
    this.player = player;

    let raw = null;
    try {
      raw = await loadPlayerCharacter(player.username);
    } catch (err) {
      toast(`Falha a carregar ficha: ${err.message}`, 'error');
      return;
    }
    if (!raw) {
      toast(`Sem ficha para ${player.name || player.username}.`, 'warning');
      return;
    }

    this.tempCharacter = new Character();
    this.tempCharacter.load(raw);

    this.render();
  }

  close() {
    // Flush any pending save.
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
      if (this._pendingSave) this._flushSave();
    }
    if (typeof this._unsubscribe === 'function') {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    this.skillTree = null;
    this.tempCharacter = null;
    this.overlay?.remove?.();
    this.overlay = null;
    this.player = null;
  }

  /**
   * Subscribe to Character mutations and persist them — debounced so a
   * single unlock (which triggers several `notify()` calls due to
   * recalculateAll) doesn't fan out into several network writes.
   */
  _subscribePersistence() {
    if (!this.tempCharacter) return;
    this._unsubscribe = this.tempCharacter.subscribe(() => {
      this._pendingSave = true;
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => this._flushSave(), DEBOUNCE_MS);
    });
  }

  async _flushSave() {
    this._saveTimer = null;
    if (!this._pendingSave || !this.tempCharacter || !this.player) return;
    this._pendingSave = false;
    try {
      await savePlayerCharacter(this.player.username, this.tempCharacter.serialize());
      this.onChanged?.(this.player);
    } catch (err) {
      console.warn('[PlayerSkillsModal._flushSave]', err);
      toast(`Falha a gravar: ${err.message}`, 'error');
    }
  }

  render() {
    this.overlay?.remove?.();

    const element = (this.tempCharacter?.getData?.()?.identidade?.elemento || 'none').toLowerCase();

    const overlay = createElement('div', { class: 'modal-overlay' });
    const box = createElement('div', {
      class: 'modal-box',
      style: 'max-width: min(1100px, 96vw); max-height: 92vh; display: flex; flex-direction: column;',
    });

    box.appendChild(createElement('h2', {
      class: 'modal-title',
      textContent: `🌳 Skills — ${this.player?.name || this.player?.username} (${this._elementLabel(element)})`,
    }));

    const treeHost = createElement('div', {
      style: 'flex: 1 1 auto; overflow-y: auto; padding-right: 4px;',
    });
    box.appendChild(treeHost);

    const actions = createElement('div', { class: 'modal-actions' });
    const close = createElement('button', {
      type: 'button',
      class: 'modal-btn modal-btn-cancel',
      textContent: 'Fechar',
    });
    on(close, 'click', () => this.close());
    actions.appendChild(close);
    box.appendChild(actions);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    on(overlay, 'click', (e) => { if (e.target === overlay) this.close(); });
    this.overlay = overlay;

    // Subscribe before mounting the tree so the very first notify (from
    // canvas init / recalculations) doesn't slip through.
    this._subscribePersistence();

    // Mount the SkillTree — same component the player uses on their own
    // page. It reads/writes through the wrapped Character, which our
    // subscriber persists.
    this.skillTree = new SkillTree(element, this.tempCharacter, treeHost);
    // For Sem Dobra, notify so the picker prompts (dismissable). For
    // benders this is a no-op.
    setTimeout(() => this.skillTree?.notifyShown?.(), 50);
  }

  _elementLabel(element) {
    return ({
      fire: 'Fogo', water: 'Água', earth: 'Terra', air: 'Ar', none: 'Sem Dobra',
    })[element] || element;
  }
}
