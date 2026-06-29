/**
 * GMControlPage — central GM dashboard.
 *
 * Goal: a single screen the GM keeps open during a session, with
 * compact cards for every player and every monster currently relevant.
 * Each card surfaces:
 *   - HP read-out + quick adjust buttons (−5 / −1 / +1 / +5 / SET)
 *   - Active skills as clickable chips (logs a "uses skill" entry; future
 *     iteration will resolve targets + apply effects)
 *   - Shortcut actions: ⚡ Efeitos, 💰 Gold, ⭐ XP, 🎁 Loot, 📝 Notas (GM-side)
 *   - For monsters: list of attacks (clickable to log)
 *
 * The EncounterPanel from `combat/` is reused at the top so the GM never
 * loses the turn-order context.
 *
 * Persistence:
 *   - Monsters' HP writes through the existing `api/monsters.update` flow.
 *   - Players' HP doesn't have a dedicated column yet — for now we toast
 *     the change and rely on the GM telling the player to update their
 *     sheet. Adding `hp_current` to characters is a future iteration.
 *   - Gold/XP write through `api/supabase-characters.saveCharacter` (full
 *     row). There's a known race with the player's AutoSave — accepted
 *     for this iteration.
 */

import { createElement, on, $ } from '../utils/dom.js';
import { toast, promptDialog, confirmDialog } from '../utils/toast.js';
import { EncounterPanel, ENCOUNTER_UPDATED_EVENT, BattleLauncher } from '../combat/index.js';
import { StatusEffectManager } from '../hub/StatusEffectManager.js';
import { getPlayersAsync } from '../hub/data.js';
import * as Monsters from '../api/monsters.js';
import { MONSTERS_UPDATED_EVENT } from '../monsters/index.js';
import { isSupabaseEnabled } from '../api/config.js';
import {
  loadCharacter as loadCharFromSupabase,
  saveCharacter as saveCharToSupabase,
  updateGmNotes,
  updateVitals,
} from '../api/supabase-characters.js';
import { NotesEditor } from '../character/NotesEditor.js';

export class GMControlPage {
  constructor(container, authManager) {
    this.container = container;
    this.authManager = authManager;
    this.encounter = null;
    this.players = [];
    this.monsters = [];
    this.statusEffectManager = new StatusEffectManager({ authManager });
    this._encounterPanel = null;
    this._notesOverlay = null;

    this._handlers = {
      encounter: (e) => { this.encounter = e.detail || null; this._renderCards(); },
      monsters: () => this.refresh(),
      status:   () => this.refresh(),
    };
    window.addEventListener(ENCOUNTER_UPDATED_EVENT, this._handlers.encounter);
    window.addEventListener(MONSTERS_UPDATED_EVENT, this._handlers.monsters);
    window.addEventListener('status-effects:updated', this._handlers.status);

    // Subscribe to character row changes so HP edits made on a player's
    // sheet show up in the dashboard without a manual refresh. Guarded
    // by a `_destroyed` flag so a teardown that lands before the
    // subscribe resolves still drops the channel cleanly.
    this._charsRealtimeUnsub = null;
    this._destroyed = false;
    import('../api/supabase-characters.js').then(({ subscribeToCharacters }) => {
      return subscribeToCharacters(() => { if (!this._destroyed) this.refresh(); });
    }).then((unsub) => {
      if (this._destroyed) { unsub?.(); return; }
      this._charsRealtimeUnsub = unsub;
    }).catch(() => {});

    this.render();
    this.refresh();
  }

  destroy() {
    this._destroyed = true;
    window.removeEventListener(ENCOUNTER_UPDATED_EVENT, this._handlers.encounter);
    window.removeEventListener(MONSTERS_UPDATED_EVENT, this._handlers.monsters);
    window.removeEventListener('status-effects:updated', this._handlers.status);
    if (typeof this._charsRealtimeUnsub === 'function') this._charsRealtimeUnsub();
    this._encounterPanel?.destroy?.();
    this.battleLauncher?.close?.();
    this.statusEffectManager?.close?.();
    this._notesOverlay?.remove?.();
  }

  // ── Lifecycle ──────────────────────────────────────────────

  async refresh() {
    const [hubPlayers, monsters] = await Promise.all([
      getPlayersAsync({ includeUnsaved: false }).catch(() => []),
      Monsters.list().catch(() => []),
    ]);
    // Enrich each player with the full character payload so we can read
    // active skills / current Gold / etc. Falls back to the hub snapshot
    // when Supabase is unavailable.
    const enriched = await Promise.all(hubPlayers.map(async (hp) => {
      if (!isSupabaseEnabled()) return { ...hp, habilidades: {} };
      try {
        const ch = await loadCharFromSupabase(hp.username);
        return ch ? {
          ...hp,
          habilidades: ch.habilidades || {},
          ouro: ch.ouro,
          xp_atual: ch.identidade?.xp_atual,
          element: ch.identidade?.elemento || hp.element,
          non_bender_path: ch.non_bender_path || null,
        } : { ...hp, habilidades: {} };
      } catch { return { ...hp, habilidades: {} }; }
    }));
    this.players = enriched;
    this.monsters = monsters.filter((m) => !m.is_dead && (m.is_staged || this._isFighting(m.id)));
    // Pre-warm the skill name cache for each player's element so the
    // chips show readable names rather than raw ids.
    this._warmSkillDefinitions();
    this._renderCards();
  }

  /**
   * Load the canonical skill JSON for every element the dashboard cares
   * about, populating `window.__SKILL_DEFINITIONS__` so the chip labels
   * can resolve ids to friendly names. Idempotent + best-effort.
   */
  async _warmSkillDefinitions() {
    const needed = new Set();
    this.players.forEach((p) => {
      const el = (p.element || 'none').toLowerCase();
      if (el === 'none') {
        needed.add(`none:${p.non_bender_path || 'chiblocker'}`);
        needed.add(`none:weapons`);
      } else {
        needed.add(el);
      }
    });
    if (needed.size === 0) return;
    try {
      const { loadSkills } = await import('../skills/data.js');
      window.__SKILL_DEFINITIONS__ ||= new Map();
      const cache = window.__SKILL_DEFINITIONS__;
      const tasks = [...needed].map(async (key) => {
        const [element, path] = key.split(':');
        const res = await loadSkills(element, { nonBenderPath: path || null });
        (res?.skills || []).forEach((s) => { if (s?.id) cache.set(s.id, s); });
      });
      await Promise.allSettled(tasks);
      // Trigger a re-render now that names are available.
      this._renderCards();
    } catch (err) {
      console.warn('[GMControlPage._warmSkillDefinitions]', err);
    }
  }

  _isFighting(monsterId) {
    return !!this.encounter?.combatants?.some((c) => c.kind === 'monster' && c.ref_id === monsterId);
  }

  render() {
    if (!this.authManager?.hasRole?.('gm')) {
      this.container.innerHTML = '<p class="hub-empty">Apenas GM/Admin podem aceder.</p>';
      return;
    }
    this.container.innerHTML = '';

    // Header with the "Iniciar batalha" launcher.
    const header = createElement('div', { class: 'gm-control-header' });
    header.appendChild(createElement('h2', { textContent: 'Controlo do GM' }));
    const battleBtn = createElement('button', {
      type: 'button',
      class: 'btn btn-primary',
      textContent: '⚔ Iniciar batalha',
    });
    on(battleBtn, 'click', () => {
      if (!this.battleLauncher) this.battleLauncher = new BattleLauncher({ authManager: this.authManager });
      this.battleLauncher.open();
    });
    header.appendChild(battleBtn);
    this.container.appendChild(header);

    // Sticky encounter panel up top.
    const stickyHost = createElement('div', { class: 'gm-encounter-sticky' });
    this.container.appendChild(stickyHost);
    this._encounterPanel = new EncounterPanel({
      host: stickyHost,
      authManager: this.authManager,
      getCurrentUsername: () => this.authManager?.getUser?.()?.username || null,
    });

    // Grid host (cards rendered by `_renderCards`).
    this.gridHost = createElement('div', { class: 'gm-grid' });
    this.container.appendChild(this.gridHost);
  }

  _renderCards() {
    if (!this.gridHost) return;
    this.gridHost.innerHTML = '';

    if (this.players.length === 0 && this.monsters.length === 0) {
      this.gridHost.appendChild(createElement('p', {
        class: 'hub-empty',
        textContent: 'Sem jogadores nem monstros relevantes. Coloca monstros a "Selecionados para batalha" para os veres aqui.',
      }));
      return;
    }

    this.players.forEach((p) => this.gridHost.appendChild(this._renderPlayerCard(p)));
    this.monsters.forEach((m) => this.gridHost.appendChild(this._renderMonsterCard(m)));
  }

  // ── Player card ────────────────────────────────────────────

  _renderPlayerCard(player) {
    const card = createElement('article', { class: 'gm-card kind-player' });
    card.style.position = 'relative';
    this._mountOrderBadge(card, 'character', player.username);
    card.appendChild(this._cardHeader(player.name, `Nv. ${player.level}`));

    // Vitals — HP, CP (Chi) and SP (Spirit) get the same +/- controls.
    card.appendChild(this._vitalsBlock(player));

    const skillsRow = createElement('div', { class: 'gm-skills' });
    const charSkills = player.habilidades || {};
    const activeSkills = Object.keys(charSkills).filter((id) => charSkills[id]?.active);
    if (activeSkills.length === 0) {
      skillsRow.appendChild(createElement('span', { class: 'gm-empty-row', textContent: 'Sem habilidades ativas registadas.' }));
    } else {
      activeSkills.forEach((id) => {
        const def = window.__SKILL_DEFINITIONS__?.get?.(id);
        const chip = createElement('button', {
          type: 'button',
          class: 'gm-skill-chip',
          textContent: def?.name || id,
          title: def?.description || id,
        });
        on(chip, 'click', () => toast(`${player.name} usou: ${def?.name || id}`, 'info'));
        skillsRow.appendChild(chip);
      });
    }
    card.appendChild(skillsRow);

    const actions = createElement('div', { class: 'gm-card-actions' });
    actions.append(
      this._actionButton('⚡ Efeitos', () => this.statusEffectManager.openFor(player)),
      this._actionButton('💰 Ouro', () => this._promptDelta('Ouro', (n) => this._adjustPlayerField(player, 'ouro', n))),
      this._actionButton('⭐ XP', () => this._promptDelta('XP', (n) => this._adjustPlayerField(player, 'identidade.xp_atual', n))),
      this._actionButton('📝 Notas', () => this._openGmNotes(player)),
    );
    card.appendChild(actions);
    return card;
  }

  /**
   * Render the 3 vitals (HP/CP/SP) with adjust controls. Reads current
   * values from the hub-projection (which now prefers hp_current /
   * cp_current / sp_current columns) and writes back via updateVitals.
   */
  _vitalsBlock(player) {
    const wrap = createElement('div', { class: 'gm-vitals' });
    wrap.appendChild(this._hpBlock({
      label: 'HP',
      kind: 'hp',
      colour: 'hp',
      current: player.hp,
      max: player.hpMax,
      onAdjust: (delta) => this._adjustPlayerVital(player, 'hp_current', delta, 'hp', 'hpMax'),
      onSet:    (value) => this._setPlayerVital(player, 'hp_current', value, 'hp', 'hpMax'),
    }));
    wrap.appendChild(this._hpBlock({
      label: 'Chi',
      kind: 'cp',
      colour: 'cp',
      current: player.chi,
      max: player.chiMax,
      onAdjust: (delta) => this._adjustPlayerVital(player, 'cp_current', delta, 'chi', 'chiMax'),
      onSet:    (value) => this._setPlayerVital(player, 'cp_current', value, 'chi', 'chiMax'),
    }));
    wrap.appendChild(this._hpBlock({
      label: 'Espírito',
      kind: 'sp',
      colour: 'sp',
      current: player.espiritu,
      max: player.espirituMax,
      onAdjust: (delta) => this._adjustPlayerVital(player, 'sp_current', delta, 'espiritu', 'espirituMax'),
      onSet:    (value) => this._setPlayerVital(player, 'sp_current', value, 'espiritu', 'espirituMax'),
    }));
    return wrap;
  }

  // ── Monster card ───────────────────────────────────────────

  _renderMonsterCard(monster) {
    const card = createElement('article', { class: 'gm-card kind-monster' });
    card.style.position = 'relative';
    this._mountOrderBadge(card, 'monster', monster.id);
    card.appendChild(this._cardHeader(monster.name, `Nv. ${monster.level}`));

    card.appendChild(this._hpBlock({
      label: 'HP',
      kind: 'hp',
      current: monster.hp_current,
      max: monster.hp_max,
      onAdjust: (delta) => this._adjustMonsterHp(monster, delta),
      onSet: (value) => this._setMonsterHp(monster, value),
    }));

    if (Array.isArray(monster.attacks) && monster.attacks.length) {
      const row = createElement('div', { class: 'gm-skills' });
      monster.attacks.forEach((atk) => {
        const chip = createElement('button', {
          type: 'button',
          class: 'gm-skill-chip monster',
          textContent: atk.name || 'Ataque',
          title: [atk.damage, atk.range, atk.effect].filter(Boolean).join(' · '),
        });
        on(chip, 'click', () => toast(`${monster.name}: ${atk.name} (${atk.damage || '?'})`, 'info'));
        row.appendChild(chip);
      });
      card.appendChild(row);
    }

    const actions = createElement('div', { class: 'gm-card-actions' });
    actions.append(
      this._actionButton('⚰ Cemitério', async () => {
        await Monsters.setDead(monster.id, true);
        toast(`${monster.name} foi para o cemitério.`, 'warning');
        this.refresh();
      }),
    );
    card.appendChild(actions);
    return card;
  }

  // ── UI helpers ─────────────────────────────────────────────

  /**
   * Add the floating "#N" badge to a card if the entity has a slot in
   * the active encounter. For players, match by lowercased username
   * (the combatant `name` is the username). For monsters, match by
   * `ref_id`.
   */
  _mountOrderBadge(card, kind, id) {
    const enc = this.encounter;
    if (!enc?.combatants?.length) return;
    const norm = (s) => String(s || '').trim().toLowerCase();
    let idx = -1;
    if (kind === 'character') {
      idx = enc.combatants.findIndex((c) => c.kind === 'character' && norm(c.name) === norm(id));
    } else {
      idx = enc.combatants.findIndex((c) => c.kind === 'monster' && c.ref_id === id);
    }
    if (idx < 0) return;
    const c = enc.combatants[idx];
    const order = (c.turn_order ?? idx) + 1;
    const badge = createElement('div', {
      class: 'player-card-initiative gm-card-initiative',
      textContent: `#${order}`,
      title: `Posição #${order} (iniciativa ${c.initiative})`,
    });
    if (idx === enc.current_turn_index) badge.classList.add('on-turn');
    card.appendChild(badge);
  }

  _cardHeader(name, sub) {
    const head = createElement('header', { class: 'gm-card-head' });
    const wrap = createElement('div', { class: 'gm-card-name-wrap' });
    wrap.appendChild(createElement('h3', { textContent: name }));
    wrap.appendChild(createElement('span', { class: 'gm-card-sub', textContent: sub }));
    head.appendChild(wrap);
    return head;
  }

  _hpBlock({ label, kind, colour, current, max, onAdjust, onSet }) {
    const block = createElement('div', { class: `gm-vital gm-vital-${colour || 'hp'}` });
    const head = createElement('div', { class: 'gm-vital-head' });
    head.appendChild(createElement('span', { class: 'gm-vital-label', textContent: label || 'HP' }));
    head.appendChild(createElement('span', { class: 'gm-vital-text', textContent: `${current}/${max}` }));
    block.appendChild(head);

    const bar = createElement('div', { class: 'gm-vital-bar' });
    const fill = createElement('div', { class: 'gm-vital-fill' });
    const pct = max > 0 ? (current / max) * 100 : 0;
    fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    // Only HP changes colour at low health; CP/SP keep their accent colour.
    if (kind === 'hp') {
      if (pct <= 25) fill.style.background = 'linear-gradient(90deg, #a01010, #c02020)';
      else if (pct <= 50) fill.style.background = 'linear-gradient(90deg, #c07010, #e09020)';
    }
    bar.appendChild(fill);
    block.appendChild(bar);

    const buttons = createElement('div', { class: 'gm-hp-buttons' });
    [-5, -1, +1, +5].forEach((delta) => {
      const btn = createElement('button', {
        type: 'button',
        class: `gm-hp-btn ${delta > 0 ? 'plus' : 'minus'}`,
        textContent: delta > 0 ? `+${delta}` : `${delta}`,
      });
      on(btn, 'click', () => onAdjust(delta));
      buttons.appendChild(btn);
    });
    const setBtn = createElement('button', { type: 'button', class: 'gm-hp-btn set', textContent: 'SET' });
    on(setBtn, 'click', async () => {
      const raw = await promptDialog(`Novo ${label || 'HP'}`, { defaultValue: String(current), placeholder: String(max) });
      const n = Number(raw);
      if (Number.isFinite(n)) onSet(n);
    });
    buttons.appendChild(setBtn);
    block.appendChild(buttons);
    return block;
  }

  _actionButton(label, handler) {
    const btn = createElement('button', { type: 'button', class: 'gm-action-btn', textContent: label });
    on(btn, 'click', handler);
    return btn;
  }

  async _promptDelta(label, apply) {
    const raw = await promptDialog(`${label} a adicionar (negativo subtrai)`, { defaultValue: '0' });
    const n = Number(raw);
    if (Number.isFinite(n) && n !== 0) apply(n);
  }

  // ── Mutations ──────────────────────────────────────────────

  async _adjustMonsterHp(monster, delta) {
    const next = Math.max(0, Math.min(monster.hp_max, monster.hp_current + delta));
    monster.hp_current = next;
    try {
      await Monsters.update(monster.id, { hp_current: next });
      toast(`${monster.name}: ${delta > 0 ? '+' : ''}${delta} HP → ${next}`, 'info');
      if (next === 0) await this._promptOnMonsterDeath(monster);
      this._renderCards();
    } catch (err) {
      toast('Falha ao atualizar HP do monstro.', 'error');
    }
  }

  async _setMonsterHp(monster, value) {
    const next = Math.max(0, Math.min(monster.hp_max, Math.floor(value)));
    monster.hp_current = next;
    try {
      await Monsters.update(monster.id, { hp_current: next });
      if (next === 0) await this._promptOnMonsterDeath(monster);
      this._renderCards();
    } catch (err) {
      toast('Falha ao atualizar HP.', 'error');
    }
  }

  async _promptOnMonsterDeath(monster) {
    const ok = await confirmDialog(`${monster.name} caiu (HP=0). Mandar para o cemitério?`, {
      confirmText: 'Para o cemitério',
      cancelText: 'Manter em batalha',
    });
    if (!ok) return;
    await Monsters.setDead(monster.id, true);
    this.refresh();
  }

  /**
   * Adjust one of the vital pools (hp/cp/sp) for a player. `column` is the
   * Supabase column to patch, `currentKey`/`maxKey` are the projection
   * fields on the hub player object.
   */
  async _adjustPlayerVital(player, column, delta, currentKey, maxKey) {
    const next = Math.max(0, Math.min(player[maxKey], player[currentKey] + delta));
    player[currentKey] = next;
    try {
      if (isSupabaseEnabled()) {
        await updateVitals(player.username, { [column]: next });
        const verb = column === 'hp_current' ? 'HP' : column === 'cp_current' ? 'Chi' : 'Espírito';
        toast(`${player.name}: ${delta > 0 ? '+' : ''}${delta} ${verb} → ${next}`, delta < 0 ? 'warning' : 'success');
      } else {
        toast('Supabase desligado — alteração não persistiu.', 'warning');
      }
    } catch (err) {
      toast(`Falha: ${err.message}`, 'error');
    }
    this._renderCards();
  }

  async _setPlayerVital(player, column, value, currentKey, maxKey) {
    const next = Math.max(0, Math.min(player[maxKey], Math.floor(value)));
    player[currentKey] = next;
    try {
      if (isSupabaseEnabled()) {
        await updateVitals(player.username, { [column]: next });
        const verb = column === 'hp_current' ? 'HP' : column === 'cp_current' ? 'Chi' : 'Espírito';
        toast(`${player.name}: ${verb} = ${next}`, 'info');
      }
    } catch (err) {
      toast(`Falha: ${err.message}`, 'error');
    }
    this._renderCards();
  }

  async _adjustPlayerHp(player, delta) {
    return this._adjustPlayerVital(player, 'hp_current', delta, 'hp', 'hpMax');
  }
  async _setPlayerHp(player, value) {
    return this._setPlayerVital(player, 'hp_current', value, 'hp', 'hpMax');
  }

  /**
   * Add `delta` to a (possibly nested) field on the player's character.
   * Writes via `saveCharacter` (full row). Race with the player's
   * AutoSave is acknowledged — see file header.
   */
  async _adjustPlayerField(player, path, delta) {
    if (!isSupabaseEnabled()) {
      toast('Supabase desligado — sem persistência remota.', 'warning');
      return;
    }
    try {
      const char = await loadCharFromSupabase(player.username);
      if (!char) { toast(`Sem ficha de ${player.name}.`, 'warning'); return; }
      const parts = path.split('.');
      let target = char;
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] ??= {};
        target = target[parts[i]];
      }
      const last = parts[parts.length - 1];
      target[last] = (Number(target[last]) || 0) + delta;
      await saveCharToSupabase(player.username, char);
      toast(`${player.name}: ${path} ${delta > 0 ? '+' : ''}${delta}`, delta > 0 ? 'success' : 'warning');
    } catch (err) {
      toast(`Falha: ${err.message}`, 'error');
    }
  }

  async _openGmNotes(player) {
    this._notesOverlay?.remove?.();
    let char = null;
    try {
      if (isSupabaseEnabled()) char = await loadCharFromSupabase(player.username);
    } catch (err) {
      console.warn('[GMControlPage._openGmNotes]', err);
    }
    const initial = Array.isArray(char?.gm_notes) ? char.gm_notes : [];

    const overlay = createElement('div', { class: 'modal-overlay' });
    const box = createElement('div', { class: 'modal-box', style: 'max-width: 540px;' });
    box.appendChild(createElement('h2', { class: 'modal-title', textContent: `Notas do GM — ${player.name}` }));
    const notesHost = createElement('div');
    box.appendChild(notesHost);
    const actions = createElement('div', { class: 'modal-actions' });
    const close = createElement('button', { type: 'button', class: 'modal-btn modal-btn-cancel', textContent: 'Fechar' });
    actions.appendChild(close);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    this._notesOverlay = overlay;

    new NotesEditor({
      host: notesHost,
      title: null,
      placeholder: 'Nota privada do GM…',
      notes: initial,
      onChange: async (notes) => {
        if (!isSupabaseEnabled()) {
          toast('Supabase desligado — notas não gravadas no servidor.', 'warning');
          return;
        }
        try {
          await updateGmNotes(player.username, notes);
        } catch (err) {
          toast(`Falha ao gravar notas: ${err.message}`, 'error');
        }
      },
    });
    on(close, 'click', () => { overlay.remove(); this._notesOverlay = null; });
    on(overlay, 'click', (e) => { if (e.target === overlay) close.click(); });
  }
}
