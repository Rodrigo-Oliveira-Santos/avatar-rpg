/**
 * Status-effect tick engine.
 *
 * Called by `EncounterPanel` when the encounter advances:
 *   - `applyTickFor(combatant, 'end', encounter)`  → on the combatant
 *     whose vez is ending.
 *   - `applyTickFor(combatant, 'start', encounter)` → on the combatant
 *     whose vez is starting.
 *
 * By default, status effects tick at the **END** of the affected
 * combatant's vez (i.e. after their actions). Effects that need to
 * fire *before* the target can act this round (stun / paralysis /
 * fear / frozen) override `tick_when: 'start'` in the catalog.
 *
 * Responsibilities per tick:
 *   1. For each `status_effects` entry on the combatant whose `tick_when`
 *      matches the current phase:
 *      - Roll/apply `damage_per_turn` (defaults to manual via `promptRoll`
 *        when expression is present; negative damage = heal).
 *      - Decrement `duration_turns`. Remove the entry when it hits 0.
 *   2. Persist the mutated `status_effects` back to the right store
 *      (characters table column `status_effects` or monsters JSONB).
 *   3. Persist HP changes for monsters (their HP lives in the row). For
 *      players we DON'T touch HP directly — players control their own HP
 *      via the character sheet, so we just toast the suggested change.
 *
 * Errors are non-fatal: a failed tick logs to console + toasts, but
 * the vez advance still proceeds.
 */

import { toast } from '../utils/toast.js';
import { promptRoll, rollExpression } from './dice.js';
import {
  normalizeStatusEffect,
  serializeStatusEffect,
} from '../utils/statusEffects.js';
import { isSupabaseEnabled } from '../api/config.js';
import { getSupabaseClient } from '../api/supabase-client.js';
import {
  loadCharacter as loadCharFromSupabase,
  updateStatusEffects as updateCharStatusEffects,
} from '../api/supabase-characters.js';
import * as Monsters from '../api/monsters.js';

/**
 * Public entry point. `phase` is 'start' or 'end' of the target's vez.
 */
export async function applyTickFor(combatant, phase, encounter) {
  if (!combatant) return;
  try {
    if (combatant.kind === 'monster') {
      await tickMonster(combatant, phase, encounter);
    } else if (combatant.kind === 'character') {
      await tickCharacter(combatant, phase, encounter);
    }
  } catch (err) {
    console.warn('[statusTicks] tick failed', err);
    toast(`Falha ao tickar efeitos de ${combatant.name}.`, 'warning');
  }
}

/**
 * Placeholder hook: attacker side-effects could be processed here (e.g.
 * abilities that auto-apply a status on hit). Today it's a no-op.
 */
export async function applyAttackerEffects(/* combatant, action, target */) {
  return null;
}

// ── Internals ──────────────────────────────────────────────

async function tickMonster(combatant, phase, encounter) {
  if (!combatant.ref_id) return;
  const monsters = await Monsters.list();
  const monster = monsters.find((m) => m.id === combatant.ref_id);
  if (!monster) return;

  const before = Array.isArray(monster.status_effects)
    ? monster.status_effects.map(normalizeStatusEffect).filter(Boolean)
    : [];
  const { kept, hpDelta } = await processEffects(before, phase, combatant, encounter);

  const patch = { status_effects: kept.map(serializeStatusEffect).filter(Boolean) };
  if (hpDelta !== 0) {
    patch.hp_current = Math.max(0, Math.min(monster.hp_max, monster.hp_current - hpDelta));
  }
  // Use the tick-only patch so this works even when the caller isn't GM
  // (player-driven `endOwnTurn` triggers monster ticks too).
  await Monsters.tickPatch(monster.id, patch);
  if (hpDelta !== 0) {
    const verb = hpDelta > 0 ? `sofreu ${hpDelta}` : `recuperou ${-hpDelta}`;
    toast(`${monster.name} ${verb} HP (ticks).`, hpDelta > 0 ? 'warning' : 'success');
  }
}

async function tickCharacter(combatant, phase, encounter) {
  if (!combatant.ref_id && !combatant.name) return;
  // Look up by user_id via ref_id when possible; fall back by character name.
  let character = null;
  if (isSupabaseEnabled() && combatant.name) {
    try {
      // Combatants store the username as `name` when added via the launcher.
      character = await loadCharFromSupabase(combatant.name);
    } catch (err) {
      console.warn('[statusTicks] character load failed', err);
    }
  }
  if (!character) return;

  const before = Array.isArray(character.status_effects)
    ? character.status_effects.map(normalizeStatusEffect).filter(Boolean)
    : [];
  const { kept, hpDelta } = await processEffects(before, phase, combatant, encounter);

  // Persist the new effects array via the targeted column update so it
  // never races the player's own AutoSave.
  try {
    await updateCharStatusEffects(combatant.name, kept.map(serializeStatusEffect).filter(Boolean));
  } catch (err) {
    console.warn('[statusTicks] failed to persist character effects', err);
  }

  if (hpDelta !== 0) {
    // Players control their own HP at the sheet, so we surface the change
    // as a toast instead of mutating their record from the GM/turn engine.
    const verb = hpDelta > 0 ? `−${hpDelta} HP` : `+${-hpDelta} HP`;
    toast(`${combatant.name}: ${verb} (efeitos).`, hpDelta > 0 ? 'warning' : 'success');
  }
}

/**
 * Iterate the effects array applying ticks. Returns the surviving entries
 * and the cumulative HP change (positive = damage taken, negative = heal).
 */
async function processEffects(effects, phase, combatant, encounter) {
  const kept = [];
  let hpDelta = 0;

  for (const effect of effects) {
    // Default tick timing is 'end' of the target's vez (post 2026-06-30).
    // Catalog overrides via `tick_when: 'start'` are still honoured.
    const when = effect.tick_when || 'end';
    if (when !== phase) {
      kept.push(effect);
      continue;
    }

    // Damage / heal expression (optional).
    if (effect.damage_per_turn) {
      const amount = await resolveTickAmount(effect, combatant);
      if (amount !== null) hpDelta += amount;
    }

    // Decrement duration (null means "until removed").
    if (effect.duration_turns == null) {
      kept.push(effect);
    } else {
      const next = effect.duration_turns - 1;
      if (next > 0) kept.push({ ...effect, duration_turns: next });
      else toast(`${combatant.name}: efeito ${effect.name} expirou.`, 'info');
    }
  }

  return { kept, hpDelta };
}

/**
 * Resolve the per-tick damage amount. Honours the global house rule:
 * default mode is manual entry; the popup has a toggle to roll on site.
 */
async function resolveTickAmount(effect, combatant) {
  const result = await promptRoll({
    title: `${effect.name} — ${combatant.name}`,
    expression: effect.damage_per_turn,
    helper: effect.damage_per_turn?.startsWith('-')
      ? 'Valor positivo curado, conforme expressão.'
      : 'Valor positivo de dano sofrido pelo alvo.',
  });
  if (!result) return null;
  // The expression syntax allows a leading "-" to indicate healing; if the
  // user types a manual value, treat positive as damage (matches the
  // helper text above). Negative manual values are treated as heal.
  if (effect.damage_per_turn?.startsWith('-')) return -Math.abs(result.total);
  return result.total;
}
