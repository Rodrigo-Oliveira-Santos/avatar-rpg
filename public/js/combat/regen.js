/**
 * Periodic combat regen (currently: chi for player and monster combatants).
 *
 * Fires at the START of every Nth round of the active encounter
 * (`REGEN_EVERY_N_ROUNDS = 2`) — i.e. rounds 3, 5, 7, … — adding
 * `REGEN_CHI_AMOUNT = 20` chi to every combatant, capped at their
 * `cp_max`. The hook lives in `EncounterPanel` (both GM "Próxima vez →"
 * and player "Fim da minha vez" paths).
 *
 * Monsters opt in by setting `cp_max` on their row (added 2026-06-30
 * via migration `20260630000000_monsters_chi.sql`). Monsters that don't
 * have a chi pool (cp_max is null / 0) are silently skipped so legacy
 * data keeps working.
 */

import { isSupabaseEnabled } from '../api/config.js';
import {
  loadCharacter as loadCharFromSupabase,
  updateVitals as updateCharVitals,
} from '../api/supabase-characters.js';
import * as Monsters from '../api/monsters.js';
import { toast } from '../utils/toast.js';

export const REGEN_CHI_AMOUNT = 20;
export const REGEN_EVERY_N_ROUNDS = 2;

/**
 * Whether a round transition triggers chi regen.
 * Fires on the START of rounds 3, 5, 7, … (every 2 rounds since round 1).
 */
export function isChiRegenDue(prevRound, newRound) {
  const prev = Number(prevRound);
  const next = Number(newRound);
  if (!Number.isFinite(prev) || !Number.isFinite(next)) return false;
  if (next <= prev) return false;
  if (next <= 1) return false;
  return (next - 1) % REGEN_EVERY_N_ROUNDS === 0;
}

/**
 * Apply chi regen to every eligible combatant in the encounter.
 * Returns `{ players, monsters }` with the counts that actually had chi
 * added (those already at max don't show up).
 */
export async function applyChiRegen(encounter) {
  if (!encounter || !Array.isArray(encounter.combatants)) {
    return { players: 0, monsters: 0 };
  }

  const charNames = encounter.combatants
    .filter((c) => c.kind === 'character' && typeof c.name === 'string' && c.name.trim())
    .map((c) => c.name.trim());

  const monsterIds = encounter.combatants
    .filter((c) => c.kind === 'monster' && c.ref_id)
    .map((c) => c.ref_id);

  let playersUpdated = 0;
  for (const username of charNames) {
    try {
      const ok = isSupabaseEnabled()
        ? await applyChiRegenSupabase(username)
        : applyChiRegenLocal(username);
      if (ok) playersUpdated++;
    } catch (err) {
      console.warn('[regen] chi regen failed for', username, err);
    }
  }

  let monstersUpdated = 0;
  if (monsterIds.length > 0) {
    try {
      monstersUpdated = await applyChiRegenMonsters(monsterIds);
    } catch (err) {
      console.warn('[regen] monster chi regen failed', err);
    }
  }

  if (playersUpdated > 0 || monstersUpdated > 0) {
    const parts = [];
    if (playersUpdated > 0) parts.push(`${playersUpdated} jogador${playersUpdated === 1 ? '' : 'es'}`);
    if (monstersUpdated > 0) parts.push(`${monstersUpdated} monstro${monstersUpdated === 1 ? '' : 's'}`);
    toast(
      `Regeneração de chi (+${REGEN_CHI_AMOUNT}) aplicada a ${parts.join(' e ')}.`,
      'success'
    );
  }
  return { players: playersUpdated, monsters: monstersUpdated };
}

// ── Internals ──────────────────────────────────────────────

async function applyChiRegenSupabase(username) {
  const char = await loadCharFromSupabase(username);
  if (!char) return false;
  const max = computeChiMax(char);
  if (max <= 0) return false;
  const cur = Number.isFinite(char.cp_current) ? char.cp_current : max;
  const next = clamp(cur + REGEN_CHI_AMOUNT, 0, max);
  if (next === cur) return false;
  await updateCharVitals(username, { cp_current: next });
  return true;
}

function applyChiRegenLocal(username) {
  try {
    const key = `avatar_rpg_character_${username}`;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const max = computeChiMax(data);
    if (max <= 0) return false;
    const cur = Number.isFinite(data.cp_current) ? data.cp_current : max;
    const next = clamp(cur + REGEN_CHI_AMOUNT, 0, max);
    if (next === cur) return false;
    data.cp_current = next;
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Bump `cp_current` (capped at `cp_max`) for every monster whose id is
 * in `monsterIds` and that has a chi pool defined. Monsters with
 * `cp_max == null` are silently skipped.
 *
 * @param {string[]} monsterIds
 * @returns {Promise<number>} number of monsters actually mutated.
 */
async function applyChiRegenMonsters(monsterIds) {
  const idSet = new Set(monsterIds.filter(Boolean));
  if (idSet.size === 0) return 0;

  // Pull the full monster list once and filter — keeps it simple
  // regardless of the storage backend.
  const all = await Monsters.list();
  const targets = all.filter((m) => idSet.has(m.id)
    && Number.isFinite(m.cp_max) && m.cp_max > 0);

  let updated = 0;
  for (const monster of targets) {
    const cur = Number.isFinite(monster.cp_current) ? monster.cp_current : monster.cp_max;
    const next = clamp(cur + REGEN_CHI_AMOUNT, 0, monster.cp_max);
    if (next === cur) continue;
    try {
      await Monsters.tickPatch(monster.id, { cp_current: next });
      updated++;
    } catch (err) {
      console.warn('[regen] monster chi tickPatch failed', monster.id, err);
    }
  }
  return updated;
}

function computeChiMax(char) {
  // Mirrors character/stats.js: 6 + (nivel × 5) + (CHI × 4).
  const lvl = Number(char?.identidade?.nivel) || 1;
  const chiAttr = Number(char?.atributos?.CHI) || 8;
  return 6 + lvl * 5 + chiAttr * 4;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
