/**
 * EncounterPanel — read-only overlay rendered inside the Hub.
 *
 * Subscribes to encounter changes (Supabase Realtime when available),
 * shows the initiative order, highlights the current "vez" (combatant
 * slot) and offers:
 *   - GM/Admin → "Próxima vez", "Terminar batalha"
 *   - Each player → "Fim da minha vez" on their own combatant row
 *
 * Combat vocabulary (post 2026-06-30 rename):
 *   - "Turno" (display)  = full round   (internal: `current_round`)
 *   - "Vez"   (display)  = single combatant slot (internal: `current_turn_index`)
 * Internal field names stay as-is to avoid a Supabase schema migration.
 *
 * Actual battle creation lives in `BattleLauncher.js` so this file stays
 * focused on display + minimal turn controls.
 */

import { createElement, on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import * as Encounters from '../api/encounters.js';
import { applyTickFor, applyAttackerEffects } from './statusTicks.js';
import { applyChiRegen, isChiRegenDue } from './regen.js';

export const ENCOUNTER_UPDATED_EVENT = 'encounters:updated';

export class EncounterPanel {
  constructor({ host, authManager, getCurrentUsername }) {
    this.host = host;
    this.authManager = authManager;
    this.getCurrentUsername = getCurrentUsername;
    this.encounter = null;
    this.root = createElement('section', { class: 'encounter-panel', hidden: true });
    this.host.appendChild(this.root);

    // Realtime subscription (or 3s poll fallback).
    this._unsub = Encounters.subscribe((enc) => {
      this.encounter = enc;
      this.render();
      window.dispatchEvent(new CustomEvent(ENCOUNTER_UPDATED_EVENT, { detail: enc }));
    });
    // Kick off initial fetch.
    Encounters.getActive().then((enc) => {
      this.encounter = enc;
      this.render();
      window.dispatchEvent(new CustomEvent(ENCOUNTER_UPDATED_EVENT, { detail: enc }));
    });
  }

  destroy() {
    if (typeof this._unsub === 'function') this._unsub();
    this.root.remove();
  }

  /** External API: refresh after non-realtime mutations (e.g. localStorage). */
  async refresh() {
    this.encounter = await Encounters.getActive();
    this.render();
    window.dispatchEvent(new CustomEvent(ENCOUNTER_UPDATED_EVENT, { detail: this.encounter }));
  }

  render() {
    const enc = this.encounter;
    // Expose the live encounter snapshot for non-combat code (e.g.
    // Character.recordSkillUse uses it to anchor cooldowns to the turn).
    if (typeof window !== 'undefined') {
      window.__ACTIVE_ENCOUNTER__ = enc && enc.status === 'active' ? enc : null;
    }
    this.root.innerHTML = '';
    if (!enc || enc.status !== 'active' || !enc.combatants?.length) {
      this.root.hidden = true;
      return;
    }
    this.root.hidden = false;

    const isGm = !!this.authManager?.hasRole?.('gm');
    const currentUser = this.getCurrentUsername?.();

    const header = createElement('header', { class: 'encounter-header' });
    header.appendChild(createElement('h2', { textContent: `⚔ ${enc.name}` }));
    header.appendChild(createElement('span', {
      class: 'encounter-round',
      textContent: `Turno ${enc.current_round}`,
    }));
    this.root.appendChild(header);

    const list = createElement('ol', { class: 'encounter-order' });
    enc.combatants.forEach((c, idx) => {
      const isActive = idx === enc.current_turn_index;
      const order = (c.turn_order ?? idx) + 1;
      const li = createElement('li', { class: `encounter-combatant ${isActive ? 'on-turn' : ''} ${c.has_acted ? 'acted' : ''} kind-${c.kind}` });
      // Big number = ordem na fila (#1, #2…). The raw d20 lives in the tooltip.
      const init = createElement('span', {
        class: 'encounter-init',
        textContent: `#${order}`,
        title: `Iniciativa ${c.initiative}`,
      });
      li.appendChild(init);
      li.appendChild(createElement('span', { class: 'encounter-name', textContent: c.name }));
      if (c.kind === 'monster') li.appendChild(createElement('span', { class: 'encounter-tag', textContent: 'Monstro' }));

      // Player can self-end their turn when they're on it.
      const ownsCombatant = c.kind === 'character' && currentUser && c.name?.toLowerCase() === String(currentUser).toLowerCase();
      if (isActive) {
        if (ownsCombatant) {
          const endBtn = createElement('button', {
            type: 'button',
            class: 'encounter-end-mine',
            textContent: 'Fim da minha vez',
          });
          on(endBtn, 'click', () => this._handleEndOwnTurn(c));
          li.appendChild(endBtn);
        } else if (isGm) {
          const readyBtn = createElement('button', {
            type: 'button',
            class: 'encounter-end-mine',
            textContent: c.has_acted ? '✓ Pronto' : 'Marcar como pronto',
          });
          on(readyBtn, 'click', async () => {
            await Encounters.markActed(c.id);
            this.refresh();
          });
          li.appendChild(readyBtn);
        }
      }
      list.appendChild(li);
    });
    this.root.appendChild(list);

    if (isGm) {
      const controls = createElement('div', { class: 'encounter-gm-controls' });
      const nextBtn = createElement('button', { type: 'button', class: 'btn btn-primary', textContent: 'Próxima vez →' });
      on(nextBtn, 'click', () => this._handleAdvance());
      const endBtn = createElement('button', { type: 'button', class: 'btn btn-danger', textContent: 'Terminar batalha' });
      on(endBtn, 'click', () => this._handleEnd());
      controls.append(nextBtn, endBtn);
      this.root.appendChild(controls);
    }
  }

  // ── GM actions ──────────────────────────────────────────

  async _handleAdvance() {
    const enc = this.encounter;
    if (!enc) return;
    const prevRound = enc.current_round;
    const leaving = enc.combatants[enc.current_turn_index];
    const nextIdx = (enc.current_turn_index + 1) % enc.combatants.length;
    const arriving = enc.combatants[nextIdx];
    const nextRound = nextIdx === 0 ? prevRound + 1 : prevRound;

    if (leaving) await applyTickFor(leaving, 'end', enc);
    await Encounters.advanceTurn(enc.id);
    if (isChiRegenDue(prevRound, nextRound)) {
      await applyChiRegen({ ...enc, current_round: nextRound });
    }
    if (arriving) await applyTickFor(arriving, 'start', enc);

    this.refresh();
  }

  /**
   * Player-side end-of-vez. Runs the same tick lifecycle as the GM's
   * "Próxima vez →" but using the player-callable `endOwnTurn` API.
   */
  async _handleEndOwnTurn(combatant) {
    const enc = this.encounter;
    if (!enc) return;
    const username = this.getCurrentUsername?.();
    if (!username) return;
    const prevRound = enc.current_round;
    const nextIdx = (enc.current_turn_index + 1) % enc.combatants.length;
    const arriving = enc.combatants[nextIdx];
    const nextRound = nextIdx === 0 ? prevRound + 1 : prevRound;

    try {
      await applyTickFor(combatant, 'end', enc);
      await Encounters.endOwnTurn(enc.id, username);
      if (isChiRegenDue(prevRound, nextRound)) {
        await applyChiRegen({ ...enc, current_round: nextRound });
      }
      if (arriving) await applyTickFor(arriving, 'start', enc);
      toast('Vez terminada.', 'success');
    } catch (err) {
      toast(err.message || 'Falha a terminar a vez.', 'error');
    }
    this.refresh();
  }

  async _handleEnd() {
    const ok = await confirmDialog('Terminar a batalha em curso? Os efeitos com duração ficam congelados.');
    if (!ok) return;
    await Encounters.end(this.encounter.id);
    this.refresh();
    toast('Batalha terminada.', 'success');
  }
}
