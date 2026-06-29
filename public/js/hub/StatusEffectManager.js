/**
 * StatusEffectManager — GM-only modal to attach/remove status effects on
 * a player's character. Effects are visual tags (no auto-tick): the GM
 * keeps mechanical bookkeeping manually at the table.
 *
 * Persistence path:
 *   1. Read the latest character snapshot (Supabase if enabled,
 *      localStorage otherwise).
 *   2. Mutate the `status_effects` array.
 *   3. Save back through the same backend.
 *   4. Emit a window event so the Hub re-renders the affected card.
 *
 * Custom effects: GM can add a free-form effect (name + polarity). It is
 * stored alongside built-ins as `{ id, name, type, icon, custom: true }`.
 */

import { createElement, on } from '../utils/dom.js';
import { toast } from '../utils/toast.js';
import { isSupabaseEnabled } from '../api/config.js';
import {
  loadCharacter as loadFromSupabase,
  updateStatusEffects as updateStatusEffectsOnSupabase,
} from '../api/supabase-characters.js';
import {
  STATUS_EFFECTS,
  normalizeStatusEffect,
  serializeStatusEffect,
} from '../utils/statusEffects.js';
import { log } from '../admin/LogService.js';

export const STATUS_EFFECTS_UPDATED_EVENT = 'status-effects:updated';

const CHARACTER_STORAGE_PREFIX = 'avatar_rpg_character_';

function localKey(username) {
  return `${CHARACTER_STORAGE_PREFIX}${username}`;
}

function readLocal(username) {
  try {
    const raw = localStorage.getItem(localKey(username));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getSessionUsername() {
  try {
    return JSON.parse(localStorage.getItem('avatar_rpg_user') || 'null')?.username || null;
  } catch {
    return null;
  }
}

async function loadTargetCharacter(username) {
  if (isSupabaseEnabled()) {
    try {
      const remote = await loadFromSupabase(username);
      if (remote) return remote;
    } catch (err) {
      console.warn('[StatusEffectManager] Supabase load failed, falling back', err);
    }
  }
  return readLocal(username);
}

/**
 * Persist the new status_effects array.
 *
 * Two write paths so the player's AutoSave can't race the GM update:
 *   • Supabase mode: targeted UPDATE on just the `status_effects` column
 *     (see `updateStatusEffects` in supabase-characters.js). AutoSave
 *     itself is configured to skip this column.
 *   • Offline mode: we patch the target's localStorage record. We only
 *     touch the *own* user's local cache when the GM is operating on
 *     their own card; otherwise we leave the player's local copy alone
 *     so a future re-login fetches the truth from Supabase.
 */
async function persistStatusEffects(username, effects) {
  if (isSupabaseEnabled()) {
    await updateStatusEffectsOnSupabase(username, effects);
    return;
  }
  // Offline path: only safe to write the local cache for the logged-in
  // user (otherwise we'd pollute another user's "saved" character if
  // somebody else later logs in on this browser).
  const sessionUser = getSessionUsername();
  if (sessionUser && sessionUser === username) {
    const cur = readLocal(username) || {};
    cur.status_effects = effects;
    try {
      localStorage.setItem(localKey(username), JSON.stringify(cur));
    } catch (err) {
      console.warn('[StatusEffectManager] localStorage write failed', err);
    }
  } else {
    throw new Error('Sem Supabase ligado, não é possível aplicar efeitos a outro jogador.');
  }
}

function ensureEffectsArray(character) {
  if (!Array.isArray(character.status_effects)) character.status_effects = [];
  return character.status_effects;
}

export class StatusEffectManager {
  constructor({ authManager } = {}) {
    this.authManager = authManager;
    this._overlay = null;
  }

  canManage() {
    return Boolean(this.authManager?.hasRole?.('gm'));
  }

  /**
   * Open the modal for the given hub player. Loads the latest character
   * snapshot so the GM doesn't operate on a stale view.
   */
  async openFor(player) {
    if (!this.canManage()) {
      toast('Apenas GM/Admin podem alterar efeitos.', 'warning');
      return;
    }
    const username = player?.username || player?.id;
    if (!username) return;

    const character = await loadTargetCharacter(username);
    if (!character) {
      toast(`Sem ficha para ${player?.name || username}. Pede ao jogador para entrar.`, 'warning');
      return;
    }
    this._render({ username, displayName: player?.name || username, character });
  }

  close() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  }

  // ── Internals ─────────────────────────────────────────────

  _render({ username, displayName, character }) {
    this.close();

    const overlay = createElement('div', { class: 'modal-overlay status-modal' });
    const modal = createElement('div', { class: 'modal-box status-modal-box' });

    const title = createElement('h2', { class: 'modal-title', textContent: `Efeitos — ${displayName}` });
    modal.appendChild(title);

    const helper = createElement('p', {
      class: 'modal-helper',
      textContent: 'Adiciona buffs/debuffs visuais ao jogador. O tracking de turnos fica por tua conta.',
    });
    modal.appendChild(helper);

    // Current effects list
    const currentSection = createElement('section', { class: 'status-section' });
    currentSection.appendChild(createElement('h3', { textContent: 'Efeitos atuais' }));
    const currentList = createElement('div', { class: 'status-current-list' });
    currentSection.appendChild(currentList);
    modal.appendChild(currentSection);

    // Add from catalog
    const catalogSection = createElement('section', { class: 'status-section' });
    catalogSection.appendChild(createElement('h3', { textContent: 'Adicionar do catálogo' }));
    const catalogGrid = createElement('div', { class: 'status-catalog-grid' });
    catalogSection.appendChild(catalogGrid);
    modal.appendChild(catalogSection);

    // Custom
    const customSection = createElement('section', { class: 'status-section' });
    customSection.appendChild(createElement('h3', { textContent: 'Efeito personalizado' }));
    const customForm = createElement('div', { class: 'status-custom-form' });
    const nameInput = createElement('input', {
      type: 'text',
      placeholder: 'Nome (ex.: Marcado pelo Espírito)',
      class: 'field-input',
    });
    const typeSelect = createElement('select', { class: 'field-input' });
    [
      { value: 'negative', label: 'Negativo (debuff)' },
      { value: 'positive', label: 'Positivo (buff)' },
    ].forEach((opt) => {
      const o = createElement('option', { value: opt.value, textContent: opt.label });
      typeSelect.appendChild(o);
    });
    const addCustomBtn = createElement('button', {
      type: 'button',
      class: 'modal-btn modal-btn-confirm',
      textContent: 'Adicionar',
    });
    // Close button lives on the SAME row as "Adicionar" (bottom inline
    // footer) — keeps the GM's hand near both controls and avoids the
    // awkward vertical stack that happens when each lives in its own row.
    const closeBtn = createElement('button', {
      type: 'button',
      class: 'modal-btn modal-btn-cancel',
      textContent: 'Fechar',
    });
    customForm.append(nameInput, typeSelect, addCustomBtn, closeBtn);
    customSection.appendChild(customForm);
    modal.appendChild(customSection);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this._overlay = overlay;

    const draft = ensureEffectsArray(character).map(normalizeStatusEffect).filter(Boolean);

    const renderCurrent = () => {
      currentList.innerHTML = '';
      if (draft.length === 0) {
        currentList.appendChild(createElement('p', {
          class: 'status-empty',
          textContent: 'Sem efeitos ativos.',
        }));
        return;
      }
      draft.forEach((effect, index) => {
        const chip = createElement('div', { class: `status-chip ${effect.type}` });
        chip.appendChild(createElement('span', { class: 'status-icon', textContent: effect.icon || '•' }));
        chip.appendChild(createElement('span', { class: 'status-name', textContent: effect.name }));
        // Show the remaining duration as part of the chip when set.
        if (effect.duration_turns != null) {
          chip.appendChild(createElement('span', {
            class: 'status-duration',
            textContent: `${effect.duration_turns}t`,
            title: 'Turnos restantes',
          }));
        }
        if (effect.description) chip.title = effect.description;
        const removeBtn = createElement('button', {
          type: 'button',
          class: 'status-chip-remove',
          textContent: '×',
          'aria-label': `Remover ${effect.name}`,
        });
        on(removeBtn, 'click', () => {
          draft.splice(index, 1);
          renderCurrent();
          renderCatalog();
        });
        chip.appendChild(removeBtn);
        currentList.appendChild(chip);
      });
    };

    const renderCatalog = () => {
      catalogGrid.innerHTML = '';
      STATUS_EFFECTS.forEach((effect) => {
        const alreadyPresent = draft.some((e) => e.id === effect.id);
        const card = createElement('button', {
          type: 'button',
          class: `status-catalog-card ${effect.type}`,
        });
        card.disabled = alreadyPresent;
        const details = [];
        if (effect.default_duration != null) details.push(`${effect.default_duration} turnos`);
        if (effect.damage_per_turn) details.push(`${effect.damage_per_turn}/turno`);
        if (effect.tick_when) details.push(`tick: ${effect.tick_when}`);
        card.title = `${effect.description}${details.length ? '\n' + details.join(' · ') : ''}`;
        card.appendChild(createElement('span', { class: 'status-icon', textContent: effect.icon }));
        card.appendChild(createElement('span', { class: 'status-name', textContent: effect.name }));
        on(card, 'click', () => {
          if (alreadyPresent) return;
          // Snapshot the catalog defaults onto the instance so the GM can
          // override per-application without mutating the catalog itself.
          draft.push({
            ...effect,
            custom: false,
            duration_turns: effect.default_duration ?? null,
            applied_at_turn: 0, // updated by EncounterManager on next tick if needed
          });
          renderCurrent();
          renderCatalog();
        });
        catalogGrid.appendChild(card);
      });
    };

    on(addCustomBtn, 'click', () => {
      const name = (nameInput.value || '').trim();
      if (!name) {
        toast('Indica um nome para o efeito.', 'warning');
        return;
      }
      const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      if (draft.some((e) => e.id === id)) {
        toast('Esse efeito já está aplicado.', 'info');
        return;
      }
      draft.push({
        id,
        name,
        type: typeSelect.value === 'positive' ? 'positive' : 'negative',
        icon: typeSelect.value === 'positive' ? '✨' : '•',
        custom: true,
      });
      nameInput.value = '';
      renderCurrent();
    });

    on(closeBtn, 'click', async () => {
      // Persist on close: serialise + targeted column write so we don't
      // touch any other field on the target's row.
      const serialised = draft.map(serializeStatusEffect).filter(Boolean);
      try {
        await persistStatusEffects(username, serialised);
        toast(`Efeitos atualizados para ${displayName}.`, 'success');
        log({ type: 'gm', message: `Status effects updated for ${username} (${serialised.length})` });
        window.dispatchEvent(new CustomEvent(STATUS_EFFECTS_UPDATED_EVENT, {
          detail: { username, count: serialised.length },
        }));
      } catch (err) {
        toast(err.message || 'Falha ao gravar efeitos.', 'error');
      }
      this.close();
    });

    on(overlay, 'click', (e) => {
      if (e.target === overlay) closeBtn.click();
    });

    renderCurrent();
    renderCatalog();
  }
}
