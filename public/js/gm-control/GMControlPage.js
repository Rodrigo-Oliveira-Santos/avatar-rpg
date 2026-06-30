/**
 * GMControlPage — central GM dashboard.
 *
 * Goal: a single screen the GM keeps open during a session, with
 * compact cards for every player and every monster currently relevant.
 *
 * **Player card surfaces:**
 *   - Clickable name + 👤 button → read-only character sheet (CharacterModal)
 *   - HP / Chi / Espírito with quick adjust buttons (−5 / −1 / +1 / +5 / SET)
 *     persisted via `api/supabase-characters.updateVitals` (targeted column
 *     write — sidesteps races with the player's AutoSave)
 *   - Active skills as clickable chips (logs a "uses skill" entry)
 *   - Shortcut actions:
 *       ⚡ Efeitos        → StatusEffectManager
 *       💰 Ouro / ⭐ XP   → numeric delta on the character row
 *       🌳 Skills        → PlayerSkillsModal (delegated skill-tree editing)
 *       🎒 Inventário    → PlayerInventoryModal (equip / unequip / use)
 *       🛒 Comprar       → PlayerShopModal (buy-on-behalf with player wallet)
 *       📝 Notas         → gm_notes editor (targeted column write)
 *
 * **Monster card surfaces:**
 *   - HP +/-, attack chips, ⚰ Cemitério button
 *
 * **Header toolbar:**
 *   - 💰 Recompensas em Grupo → GroupRewards modal (reused from Hub)
 *   - 🎁 Entregar Loot       → LootDelivery modal (reused from Hub)
 *   - ⚔ Iniciar batalha      → BattleLauncher
 *
 * The EncounterPanel from `combat/` is reused at the top so the GM never
 * loses the turn-order context.
 *
 * Cross-user reads/writes go through `api/gm-characters.js` (the helper
 * that wraps Supabase + localStorage with the right fallback).
 */

import { createElement, on, $ } from '../utils/dom.js';
import { toast, promptDialog, confirmDialog } from '../utils/toast.js';
import { EncounterPanel, ENCOUNTER_UPDATED_EVENT, BattleLauncher } from '../combat/index.js';
import { StatusEffectManager } from '../hub/StatusEffectManager.js';
import { GroupRewards } from '../hub/GroupRewards.js';
import { LootDelivery } from '../hub/LootDelivery.js';
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
import { Character } from '../character/Character.js';
import { loadPlayerCharacter, savePlayerCharacter } from '../api/gm-characters.js';
import { mountSkillUseGrid } from '../skills/index.js';
import { PlayerShopModal } from './PlayerShopModal.js';
import { PlayerInventoryModal } from './PlayerInventoryModal.js';
import { PlayerSkillsModal } from './PlayerSkillsModal.js';
import { CharacterModal } from '../hub/CharacterModal.js';

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
    this._groupRewardsOverlay?.remove?.();
    this._lootOverlay?.remove?.();
    this._playerShopModal?.close?.();
    this._playerInventoryModal?.close?.();
    this._playerSkillsModal?.close?.();
    this._characterModal?.close?.();
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

    const headerActions = createElement('div', { class: 'gm-control-header-actions' });

    const groupBtn = createElement('button', {
      type: 'button',
      class: 'btn',
      textContent: '💰 Recompensas em Grupo',
    });
    on(groupBtn, 'click', () => this._openGroupRewards());
    headerActions.appendChild(groupBtn);

    const lootBtn = createElement('button', {
      type: 'button',
      class: 'btn',
      textContent: '🎁 Entregar Loot',
    });
    on(lootBtn, 'click', () => this._openLootDelivery());
    headerActions.appendChild(lootBtn);

    const battleBtn = createElement('button', {
      type: 'button',
      class: 'btn btn-primary',
      textContent: '⚔ Iniciar batalha',
    });
    on(battleBtn, 'click', () => {
      if (!this.battleLauncher) this.battleLauncher = new BattleLauncher({ authManager: this.authManager });
      this.battleLauncher.open();
    });
    headerActions.appendChild(battleBtn);

    header.appendChild(headerActions);
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
    card.appendChild(this._playerCardHeader(player));

    // Vitals — HP, CP (Chi) and SP (Spirit) get the same +/- controls.
    card.appendChild(this._vitalsBlock(player));

    // Skill use grid — compact cards the GM can click to fire a skill
    // on the player's behalf. Sits BETWEEN vitals and effects so the
    // GM can see chi/HP, fire a skill, then check what effects landed.
    // The full skill tree (read/write) is still one click away via
    // the 🌳 Skills action button below.
    const skillsBlock = this._renderPlayerSkillsBlock(player);
    if (skillsBlock) card.appendChild(skillsBlock);

    // Status effects — chips coloured by polarity (green=buff, red=debuff).
    // Hover shows the description on each chip; clicking the row opens a
    // detail popup with the full catalog entry (description + duration +
    // damage/tick info) so the GM has full context in one place.
    const effectsBlock = this._effectsBlock(player);
    if (effectsBlock) card.appendChild(effectsBlock);

    const actions = createElement('div', { class: 'gm-card-actions' });
    actions.append(
      this._actionButton('⚡ Efeitos', () => this.statusEffectManager.openFor(player)),
      this._actionButton('💰 Ouro', () => this._promptDelta('Ouro', (n) => this._adjustPlayerField(player, 'ouro', n))),
      this._actionButton('⭐ XP', () => this._promptDelta('XP', (n) => this._adjustPlayerField(player, 'identidade.xp_atual', n))),
      this._actionButton('🌳 Skills', () => this._openPlayerSkills(player)),
      this._actionButton('🎒 Inventário', () => this._openPlayerInventory(player)),
      this._actionButton('🛒 Comprar', () => this._openPlayerShop(player)),
      this._actionButton('📝 Notas', () => this._openGmNotes(player)),
    );
    card.appendChild(actions);
    return card;
  }

  /**
   * Build the per-player "active skills" block on the GM Control card.
   * Returns null when the player has no active skills (caller skips
   * appending so the card doesn't show an empty row).
   *
   * The block is a SkillUseGrid in compact mode. Each card surfaces
   * chi cost / restore, current chi via the projected `player.chi`,
   * disables itself when chi is insufficient and fires the same
   * `_usePlayerSkill` flow we use for the legacy chip click.
   */
  _renderPlayerSkillsBlock(player) {
    const charSkills = player.habilidades || {};
    const activeIds = Object.keys(charSkills).filter((id) => charSkills[id]?.active);
    if (activeIds.length === 0) return null;

    const defs = window.__SKILL_DEFINITIONS__;
    const resolved = activeIds.map((id) => defs?.get?.(id)).filter(Boolean);
    if (resolved.length === 0) return null;

    const block = createElement('div', { class: 'gm-skills-block' });
    block.appendChild(createElement('div', {
      class: 'gm-skills-block-label',
      textContent: '🌳 Habilidades activas',
    }));

    const gridHost = createElement('div');
    block.appendChild(gridHost);

    // Build a minimal "character-like" facade so SkillUseGrid can read
    // chi / uses / mastery without actually owning a Character instance
    // for every player on screen. No subscribe — the grid re-renders
    // when the whole GM Control card is rebuilt (after a use action,
    // status update, etc.).
    const charLike = {
      getData: () => ({
        skill_uses: player.skill_uses || {},
        cp_current: player.chi,
        stats_derived: { maxCP: player.chiMax },
      }),
      getMasteryLevel: (skillId) => {
        const uses = Number(player.skill_uses?.[skillId]) || 0;
        if (uses >= 150) return 3;
        if (uses >= 50) return 2;
        if (uses >= 15) return 1;
        return 0;
      },
      subscribe: () => () => {},
    };

    mountSkillUseGrid({
      container: gridHost,
      skills: resolved,
      character: charLike,
      compact: true,
      onUse: (skill) => this._usePlayerSkill(player, skill.id, skill),
      emptyMessage: 'Sem habilidades activas.',
    });

    return block;
  }

  /**
   * Render a compact row of status-effect chips below the vitals block.
   * Returns null when the player has no effects so the caller can skip
   * the appendChild without leaving an empty row in the DOM.
   *
   * Each chip:
   *   - icon + name
   *   - tinted background (green = buff, red = debuff) via existing
   *     `.player-buff` styles
   *   - `title` tooltip with the description (+ duration/damage when
   *     present) on hover
   *
   * The chips' container is clickable: it opens a centered modal listing
   * every effect with its full description, polarity, remaining duration
   * and damage_per_turn so the GM has the complete picture in one place.
   */
  _effectsBlock(player) {
    const buffs = Array.isArray(player.buffs) ? player.buffs : [];
    const debuffs = Array.isArray(player.debuffs) ? player.debuffs : [];
    const all = [...buffs, ...debuffs];
    if (all.length === 0) return null;

    const wrap = createElement('div', {
      class: 'gm-effects',
      title: 'Clica para ver descrições completas',
    });

    all.forEach((effect) => {
      const chip = createElement('span', { class: `player-buff ${effect.type === 'positive' ? 'positive' : 'negative'}` });
      if (effect.icon) {
        chip.appendChild(createElement('span', { class: 'player-buff-icon', textContent: effect.icon }));
      }
      chip.appendChild(createElement('span', { class: 'player-buff-name', textContent: effect.name || effect.id }));
      chip.title = this._effectTooltip(effect);
      wrap.appendChild(chip);
    });

    on(wrap, 'click', () => this._openEffectsDetail(player, all));
    return wrap;
  }

  /**
   * Build a one-line tooltip for a status effect. Combines description +
   * duration + damage_per_turn so a quick hover on the chip surfaces
   * everything the GM needs without opening the detail modal.
   */
  _effectTooltip(effect) {
    const parts = [];
    if (effect.description) parts.push(effect.description);
    const meta = [];
    if (Number.isFinite(effect.duration_turns)) meta.push(`${effect.duration_turns} vez${effect.duration_turns === 1 ? '' : 'es'}`);
    if (effect.damage_per_turn) meta.push(`${effect.damage_per_turn}/vez`);
    if (effect.tick_when) meta.push(`tick: ${effect.tick_when === 'start' ? 'início' : 'fim'} da vez`);
    if (meta.length) parts.push(meta.join(' · '));
    return parts.join('\n');
  }

  /**
   * Centered modal listing every effect on the player with full detail.
   * Read-only: the GM can still edit via the dedicated "⚡ Efeitos"
   * shortcut (StatusEffectManager) in the action row below.
   */
  _openEffectsDetail(player, effects) {
    const overlay = createElement('div', { class: 'modal-overlay' });
    const box = createElement('div', { class: 'modal-box gm-effects-modal' });
    box.appendChild(createElement('h2', {
      class: 'modal-title',
      textContent: `Efeitos — ${player.name || player.username}`,
    }));

    const list = createElement('ul', { class: 'gm-effects-list' });
    effects.forEach((effect) => {
      const li = createElement('li', { class: `gm-effects-item ${effect.type === 'positive' ? 'positive' : 'negative'}` });

      const head = createElement('div', { class: 'gm-effects-item-head' });
      head.appendChild(createElement('span', {
        class: 'gm-effects-item-icon',
        textContent: effect.icon || '•',
      }));
      head.appendChild(createElement('strong', {
        class: 'gm-effects-item-name',
        textContent: effect.name || effect.id,
      }));
      head.appendChild(createElement('span', {
        class: `gm-effects-item-tag ${effect.type === 'positive' ? 'positive' : 'negative'}`,
        textContent: effect.type === 'positive' ? 'Buff' : 'Debuff',
      }));
      li.appendChild(head);

      if (effect.description) {
        li.appendChild(createElement('p', { class: 'gm-effects-item-desc', textContent: effect.description }));
      }

      const meta = [];
      if (Number.isFinite(effect.duration_turns)) meta.push(`⏱ ${effect.duration_turns} vez${effect.duration_turns === 1 ? '' : 'es'} restante${effect.duration_turns === 1 ? '' : 's'}`);
      else if (effect.duration_turns === null || effect.duration_turns === undefined) meta.push('⏱ Até ser removido');
      if (effect.damage_per_turn) {
        const isHeal = String(effect.damage_per_turn).startsWith('-');
        meta.push(`${isHeal ? '💚' : '💥'} ${effect.damage_per_turn}/vez`);
      }
      if (effect.tick_when) meta.push(`🕒 Tick: ${effect.tick_when === 'start' ? 'início' : 'fim'} da vez`);
      if (effect.attribute_mod && Object.keys(effect.attribute_mod).length) {
        const mods = Object.entries(effect.attribute_mod)
          .map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`)
          .join(', ');
        meta.push(`📊 ${mods}`);
      }
      if (meta.length) {
        li.appendChild(createElement('p', { class: 'gm-effects-item-meta', textContent: meta.join(' · ') }));
      }
      list.appendChild(li);
    });
    box.appendChild(list);

    const actions = createElement('div', { class: 'modal-actions' });
    const close = createElement('button', { type: 'button', class: 'modal-btn modal-btn-confirm', textContent: 'Fechar' });
    on(close, 'click', () => overlay.remove());
    actions.appendChild(close);
    box.appendChild(actions);

    overlay.appendChild(box);
    on(overlay, 'click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
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

  /**
   * Like `_cardHeader` but for players — the name becomes a clickable
   * link and an extra 👤 button opens the read-only character sheet
   * modal (same one used by the Hub when clicking a player card).
   */
  _playerCardHeader(player) {
    const head = createElement('header', { class: 'gm-card-head' });
    const wrap = createElement('div', { class: 'gm-card-name-wrap' });

    const nameBtn = createElement('button', {
      type: 'button',
      class: 'gm-card-name-btn',
      textContent: player.name,
      title: 'Abrir ficha completa',
    });
    on(nameBtn, 'click', () => this._openCharacterSheet(player));
    wrap.appendChild(nameBtn);
    wrap.appendChild(createElement('span', {
      class: 'gm-card-sub',
      textContent: `Nv. ${player.level}`,
    }));
    head.appendChild(wrap);

    const sheetBtn = createElement('button', {
      type: 'button',
      class: 'btn btn-icon gm-card-sheet-btn',
      title: 'Abrir ficha completa',
      textContent: '👤',
    });
    on(sheetBtn, 'click', () => this._openCharacterSheet(player));
    head.appendChild(sheetBtn);

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
   *
   * Offline mode writes the same column straight into the target's
   * localStorage character (avatar_rpg_character_<username>) so the
   * change survives reloads even without a Supabase backend.
   */
  async _adjustPlayerVital(player, column, delta, currentKey, maxKey) {
    const next = Math.max(0, Math.min(player[maxKey], player[currentKey] + delta));
    player[currentKey] = next;
    const verb = column === 'hp_current' ? 'HP' : column === 'cp_current' ? 'Chi' : 'Espírito';
    try {
      if (isSupabaseEnabled()) {
        await updateVitals(player.username, { [column]: next });
      } else {
        this._patchLocalCharacter(player.username, { [column]: next });
      }
      toast(`${player.name}: ${delta > 0 ? '+' : ''}${delta} ${verb} → ${next}`, delta < 0 ? 'warning' : 'success');
    } catch (err) {
      toast(`Falha: ${err.message}`, 'error');
    }
    this._renderCards();
  }

  async _setPlayerVital(player, column, value, currentKey, maxKey) {
    const next = Math.max(0, Math.min(player[maxKey], Math.floor(value)));
    player[currentKey] = next;
    const verb = column === 'hp_current' ? 'HP' : column === 'cp_current' ? 'Chi' : 'Espírito';
    try {
      if (isSupabaseEnabled()) {
        await updateVitals(player.username, { [column]: next });
      } else {
        this._patchLocalCharacter(player.username, { [column]: next });
      }
      toast(`${player.name}: ${verb} = ${next}`, 'info');
    } catch (err) {
      toast(`Falha: ${err.message}`, 'error');
    }
    this._renderCards();
  }

  /**
   * Targeted localStorage patch on the target player's character entry.
   * Used by the offline branches of _adjustPlayerVital / _setPlayerVital
   * / _adjustPlayerField. Merges shallow keys; for nested paths use
   * `_patchLocalCharacterPath`.
   */
  _patchLocalCharacter(username, patch) {
    if (typeof localStorage === 'undefined') return;
    const key = `avatar_rpg_character_${username}`;
    let data;
    try { data = JSON.parse(localStorage.getItem(key) || 'null') || {}; }
    catch { data = {}; }
    Object.assign(data, patch);
    localStorage.setItem(key, JSON.stringify(data));
  }

  /** Same as _patchLocalCharacter but applies an additive delta on a dotted path (e.g. "identidade.xp_atual"). */
  _patchLocalCharacterPath(username, path, delta) {
    if (typeof localStorage === 'undefined') return null;
    const key = `avatar_rpg_character_${username}`;
    let data;
    try { data = JSON.parse(localStorage.getItem(key) || 'null') || {}; }
    catch { data = {}; }
    const parts = path.split('.');
    let target = data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]] || typeof target[parts[i]] !== 'object') target[parts[i]] = {};
      target = target[parts[i]];
    }
    const last = parts[parts.length - 1];
    const newValue = (Number(target[last]) || 0) + delta;
    target[last] = newValue;
    localStorage.setItem(key, JSON.stringify(data));
    return newValue;
  }

  /**
   * Add `delta` to a (possibly nested) field on the player's character.
   * Writes via `saveCharacter` (full row) when Supabase is on; falls
   * back to a localStorage patch otherwise so the GM can still grant
   * gold / XP in offline mode.
   *
   * Race with the player's AutoSave is acknowledged — see file header.
   */
  async _adjustPlayerField(player, path, delta) {
    try {
      if (isSupabaseEnabled()) {
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
      } else {
        const newValue = this._patchLocalCharacterPath(player.username, path, delta);
        if (newValue === null) {
          toast('Sem armazenamento local disponível.', 'warning');
          return;
        }
      }
      toast(`${player.name}: ${path} ${delta > 0 ? '+' : ''}${delta}`, delta > 0 ? 'success' : 'warning');
      this._renderCards();
    } catch (err) {
      toast(`Falha: ${err.message}`, 'error');
    }
  }

  /**
   * GM-side "click a skill chip to log that the player used it".
   *
   * Loads the player's full character (Supabase first, localStorage
   * fallback), wraps it in a Character instance so `useSkill` can run
   * the same chi cost/restore + use-counter logic the player's own
   * SkillTree uses, then persists via `savePlayerCharacter` (writes
   * Supabase + mirrors to localStorage). A full-row save races with
   * the player's AutoSave, but the GM action is intentional and
   * low-frequency so the small window is acceptable.
   *
   * Refreshes the cards after success so the new chi value + use count
   * are visible immediately.
   */
  async _usePlayerSkill(player, skillId, skillDef) {
    if (!player?.username || !skillId) return;
    const name = skillDef?.name || skillId;

    let raw = null;
    try {
      raw = await loadPlayerCharacter(player.username);
    } catch (err) {
      toast(`Falha a carregar ficha: ${err.message}`, 'error');
      return;
    }
    if (!raw) {
      toast(`Sem ficha de ${player.name || player.username}.`, 'warning');
      return;
    }

    // The skill definition lives in __SKILL_DEFINITIONS__ (already
    // warmed up at construction); fall back to a stub so the call still
    // increments the use counter even when the definition isn't cached
    // (e.g. a custom skill imported only on the player's session).
    const skill = skillDef || { id: skillId, chi_cost: 0, chi_restore: 0 };

    const character = new Character();
    character.load(raw);
    const result = character.useSkill(skill);

    try {
      await savePlayerCharacter(player.username, character.serialize());
    } catch (err) {
      toast(`Falha a gravar: ${err.message}`, 'error');
      return;
    }

    const lines = [`⚡ ${player.name || player.username} usou ${name}`];
    const deltaBits = [];
    if (result.chiCost > 0) deltaBits.push(`−${result.chiCost} chi`);
    if (result.chiRestore > 0) deltaBits.push(`+${result.chiRestore} chi`);
    if (deltaBits.length) {
      const newChi = result.newChi != null ? ` → ${result.newChi}` : '';
      lines.push(`${deltaBits.join(' · ')}${newChi}`);
    }
    lines.push(`${result.uses} usos · M${result.mastery}`);
    if (result.insufficientChi) lines.push('⚠ chi insuficiente');
    const level = result.insufficientChi ? 'warning' : (result.mastery > result.masteryBefore ? 'success' : 'info');
    toast(lines.join('\n'), level);

    await this.refresh();
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

  // ── Group rewards / loot / per-player shop ─────────────────

  /**
   * Open a modal hosting the GroupRewards picker. Reuses the same
   * component used by the Hub page, so logic for divvying gold/XP/coins
   * across the selected players is shared. Updates persist via the
   * Supabase-aware `gm-characters` helper (see GroupRewards refactor).
   */
  _openGroupRewards() {
    this._groupRewardsOverlay?.remove?.();

    const overlay = createElement('div', { class: 'modal-overlay' });
    const box = createElement('div', {
      class: 'modal-box',
      style: 'max-width: 640px; max-height: 85vh; overflow-y: auto;',
    });
    box.appendChild(createElement('h2', {
      class: 'modal-title',
      textContent: '💰 Recompensas em Grupo',
    }));

    const host = createElement('div');
    box.appendChild(host);

    const actions = createElement('div', { class: 'modal-actions' });
    const close = createElement('button', {
      type: 'button',
      class: 'modal-btn modal-btn-cancel',
      textContent: 'Fechar',
    });
    actions.appendChild(close);
    box.appendChild(actions);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    this._groupRewardsOverlay = overlay;

    const groupRewards = new GroupRewards(host, this.authManager);
    groupRewards.render();
    // Refresh dashboard once rewards are distributed so changed gold/XP
    // show up immediately on the player cards.
    on(host, 'group-rewards:updated', () => this.refresh());

    on(close, 'click', () => { overlay.remove(); this._groupRewardsOverlay = null; });
    on(overlay, 'click', (e) => {
      if (e.target === overlay) { overlay.remove(); this._groupRewardsOverlay = null; }
    });
  }

  /**
   * Open a modal hosting the LootDelivery picker so the GM can hand an
   * item directly to a specific player from the control dashboard.
   */
  _openLootDelivery() {
    this._lootOverlay?.remove?.();

    const overlay = createElement('div', { class: 'modal-overlay' });
    const box = createElement('div', {
      class: 'modal-box',
      style: 'max-width: 640px; max-height: 85vh; overflow-y: auto;',
    });
    box.appendChild(createElement('h2', {
      class: 'modal-title',
      textContent: '🎁 Entregar Loot',
    }));

    const host = createElement('div');
    box.appendChild(host);

    const actions = createElement('div', { class: 'modal-actions' });
    const close = createElement('button', {
      type: 'button',
      class: 'modal-btn modal-btn-cancel',
      textContent: 'Fechar',
    });
    actions.appendChild(close);
    box.appendChild(actions);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    this._lootOverlay = overlay;

    const loot = new LootDelivery(host, this.authManager);
    loot.render();

    on(close, 'click', () => { overlay.remove(); this._lootOverlay = null; });
    on(overlay, 'click', (e) => {
      if (e.target === overlay) { overlay.remove(); this._lootOverlay = null; }
    });
  }

  /**
   * Open the per-player shop modal so the GM can make the targeted player
   * buy an item (paid with the player's own gold / nation coins).
   */
  async _openPlayerShop(player) {
    if (!this._playerShopModal) {
      this._playerShopModal = new PlayerShopModal({ authManager: this.authManager });
    }
    await this._playerShopModal.open(player);
    // Refresh after the modal closes so vitals/gold reflect changes.
    // (We refresh immediately too — the modal mutates the character and
    // saves; subsequent refresh will load the updated row.)
    setTimeout(() => this.refresh(), 100);
  }

  /**
   * Open the per-player inventory modal so the GM can equip / unequip /
   * consume items on the targeted player's behalf. The modal wraps the
   * loaded character in a throwaway `Character` instance to reuse the
   * existing equip/unequip helpers, then writes back via
   * `gm-characters.savePlayerCharacter`.
   */
  async _openPlayerInventory(player) {
    if (!this._playerInventoryModal) {
      this._playerInventoryModal = new PlayerInventoryModal({
        authManager: this.authManager,
        onChanged: () => this.refresh(),
      });
    }
    await this._playerInventoryModal.open(player);
  }

  /**
   * Open the per-player skill-tree modal so the GM can unlock /
   * activate habilities on the targeted player's behalf. Reuses the
   * regular `SkillTree` UI bound to a wrapped Character instance.
   */
  async _openPlayerSkills(player) {
    if (!this._playerSkillsModal) {
      this._playerSkillsModal = new PlayerSkillsModal({
        authManager: this.authManager,
        onChanged: () => this.refresh(),
      });
    }
    await this._playerSkillsModal.open(player);
  }

  /**
   * Open the read-only `CharacterModal` for the targeted player. Reuses
   * the same modal the Hub page already shows when a GM clicks a player
   * card, with the same Supabase-first → localStorage fallback so seeded
   * profiles that only live in the DB still resolve.
   */
  async _openCharacterSheet(player) {
    const username = player?.username || player?.id;
    if (!username) {
      toast('Ficha completa indisponível para este jogador.', 'warning');
      return;
    }

    let characterData = null;
    try {
      if (isSupabaseEnabled()) {
        characterData = await loadCharFromSupabase(username);
      }
    } catch (err) {
      console.warn('[GMControlPage._openCharacterSheet] Supabase fetch failed', err);
    }

    if (!characterData && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`avatar_rpg_character_${username}`);
      if (raw) {
        try { characterData = JSON.parse(raw); } catch {}
      }
    }

    if (!characterData) {
      toast('Ficha completa indisponível para este jogador.', 'warning');
      return;
    }

    if (!this._characterModal) this._characterModal = new CharacterModal();
    this._characterModal.show(characterData, username);
  }
}
