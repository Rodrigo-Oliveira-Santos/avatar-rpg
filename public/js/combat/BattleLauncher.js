/**
 * BattleLauncher — modal where the GM picks who participates in the new
 * encounter and rolls/types each combatant's initiative (using the
 * `promptRoll` dialog).
 *
 * Sources of combatants:
 *   - Players: pulled from Supabase `users where role='player'` joined
 *     with `characters(*)`. Falls back to the Hub's local snapshot.
 *   - Monsters: only those currently `in_play` (so the GM ticks them into
 *     "in play" via the Monsters page before launching).
 *
 * Output: passes the chosen combatants to `Encounters.start(...)`.
 */

import { createElement, on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import * as Encounters from '../api/encounters.js';
import { listStaged as listMonstersStaged } from '../api/monsters.js';
import { getPlayersAsync } from '../hub/data.js';
import { promptRoll } from './dice.js';

export class BattleLauncher {
  constructor({ authManager }) {
    this.authManager = authManager;
    this.overlay = null;
  }

  async open() {
    if (!this.authManager?.hasRole?.('gm')) {
      toast('Apenas GM/Admin podem iniciar batalhas.', 'warning');
      return;
    }
    if (await Encounters.getActive()) {
      const ok = await confirmDialog('Já existe uma batalha em curso. Iniciar uma nova vai terminá-la. Continuar?', {
        confirmText: 'Iniciar nova',
      });
      if (!ok) return;
    }

    this.close();
    const overlay = createElement('div', { class: 'modal-overlay battle-launcher-overlay' });
    const box = createElement('div', { class: 'modal-box battle-launcher-box' });

    box.appendChild(createElement('h2', { class: 'modal-title', textContent: 'Iniciar batalha' }));
    box.appendChild(createElement('p', { class: 'modal-helper', textContent: 'Escolhe quem participa. A iniciativa pode ser introduzida à mão ou rolada no site.' }));

    const nameRow = createElement('div', { class: 'form-row' });
    nameRow.appendChild(createElement('label', { class: 'form-label', textContent: 'Nome do encontro' }));
    const nameInput = createElement('input', { type: 'text', class: 'field-input', value: 'Combate' });
    nameRow.appendChild(nameInput);
    box.appendChild(nameRow);

    const list = createElement('div', { class: 'battle-launcher-list' });
    list.appendChild(createElement('p', { class: 'hub-empty', textContent: 'A carregar combatentes…' }));
    box.appendChild(list);

    const actions = createElement('div', { class: 'modal-actions' });
    const cancel = createElement('button', { type: 'button', class: 'modal-btn modal-btn-cancel', textContent: 'Cancelar' });
    const start = createElement('button', { type: 'button', class: 'modal-btn modal-btn-confirm', textContent: 'Começar' });
    start.disabled = true;
    actions.append(cancel, start);
    box.appendChild(actions);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    this.overlay = overlay;
    on(cancel, 'click', () => this.close());
    on(overlay, 'click', (e) => { if (e.target === overlay) this.close(); });

    // Build the candidates list (players + monsters in play).
    const [players, monsters] = await Promise.all([
      getPlayersAsync({ includeUnsaved: false }).catch(() => []),
      listMonstersStaged().catch(() => []),
    ]);

    const candidates = [
      ...players.map((p) => ({
        kind: 'character',
        ref_id: null,            // we look up by username at tick time
        name: p.username,        // username is the stable key
        display: p.name,
        defaultMod: estimateInitiativeMod(p),
        checked: true,
      })),
      ...monsters.map((m) => ({
        kind: 'monster',
        ref_id: m.id,
        name: m.name,
        display: m.name,
        defaultMod: estimateMonsterInitiativeMod(m),
        checked: true,
      })),
    ];

    list.innerHTML = '';
    if (candidates.length === 0) {
      list.appendChild(createElement('p', {
        class: 'hub-empty',
        textContent: 'Nenhum jogador nem monstro em jogo. Coloca monstros em jogo na tab "Monstros".',
      }));
      return;
    }

    candidates.forEach((cand) => {
      const row = createElement('label', { class: `battle-launcher-row kind-${cand.kind}` });
      const cb = createElement('input', { type: 'checkbox' });
      cb.checked = cand.checked;
      on(cb, 'change', () => { cand.checked = cb.checked; updateStartState(); });
      row.appendChild(cb);
      row.appendChild(createElement('span', { class: 'bl-name', textContent: cand.display }));
      row.appendChild(createElement('span', { class: 'bl-tag', textContent: cand.kind === 'monster' ? 'Monstro' : 'Jogador' }));
      row.appendChild(createElement('span', { class: 'bl-mod', textContent: `Mod ${cand.defaultMod >= 0 ? '+' : ''}${cand.defaultMod}` }));
      list.appendChild(row);
    });

    function updateStartState() {
      start.disabled = !candidates.some((c) => c.checked);
    }
    updateStartState();

    on(start, 'click', async () => {
      const chosen = candidates.filter((c) => c.checked);
      if (chosen.length === 0) return;
      start.disabled = true;
      start.textContent = 'A rolar iniciativas…';

      const initiated = [];
      for (const c of chosen) {
        const roll = await promptRoll({
          title: `Iniciativa — ${c.display}`,
          expression: `1d20${c.defaultMod >= 0 ? '+' : ''}${c.defaultMod}`,
          helper: 'Mete o valor que rolou na mesa (ou usa 🎲 para rolar no site).',
        });
        if (!roll) { start.disabled = false; start.textContent = 'Começar'; return; }
        initiated.push({
          kind: c.kind,
          ref_id: c.ref_id,
          name: c.name,
          initiative: roll.total,
          initiative_mod: c.defaultMod,
        });
      }

      try {
        await Encounters.start({ name: nameInput.value || 'Combate', combatants: initiated });
        toast('Batalha iniciada!', 'success');
        this.close();
      } catch (err) {
        console.warn('[BattleLauncher.start]', err);
        toast('Falha ao iniciar batalha.', 'error');
        start.disabled = false;
        start.textContent = 'Começar';
      }
    });
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Best-effort initiative modifier for a player. We don't (yet) carry an
 * explicit `initiative_mod` field on characters, so we use AGI as the
 * default — the GM can override the actual roll in the prompt.
 */
function estimateInitiativeMod(hubPlayer) {
  // hubPlayer only carries stats (HP, defense, dodge...). AGI is not in
  // the projection today, so fall back to 0 — the player can input the
  // total directly in the popup.
  return 0;
}

function estimateMonsterInitiativeMod(monster) {
  if (!monster) return 0;
  return Math.max(-5, Math.min(10, Math.round(((monster.attr_agi || 8) - 8) / 2)));
}
