/**
 * Encounters API
 *
 * Persistence + Realtime façade for the turn-based combat system. Backed
 * by Supabase when enabled; falls back to localStorage so the UI keeps
 * working offline (without realtime updates).
 *
 * Combat vocabulary (post 2026-06-30 rename) — UI strings reflect this,
 * but internal column names are unchanged to avoid a schema migration:
 *   - "Turno" (UI)  = full round   → internal `current_round`
 *   - "Vez"   (UI)  = single combatant slot → internal `current_turn_index`
 *
 * Schema:
 *   - `encounters` (id, name, status, current_round, current_turn_index, …)
 *   - `encounter_combatants` (id, encounter_id, kind, ref_id, name,
 *                             initiative, initiative_mod, turn_order,
 *                             has_acted, …)
 *
 * The frontend treats only ONE active encounter at a time (the singleton
 * shown in the Hub overlay). `getActive()` returns it (or `null` if none).
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';

const LOCAL_KEY = 'avatar_rpg_encounter';

// ── Local fallback ───────────────────────────────────────────
function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(encounter) {
  if (encounter === null) {
    localStorage.removeItem(LOCAL_KEY);
    return;
  }
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(encounter));
  } catch (err) {
    console.warn('[encounters] localStorage write failed', err);
  }
}

function localId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Auth-ish gate ───────────────────────────────────────────
function currentSessionUser() {
  try {
    return JSON.parse(localStorage.getItem('avatar_rpg_user') || 'null') || null;
  } catch { return null; }
}

function assertGm() {
  const role = currentSessionUser()?.role;
  if (role !== 'gm' && role !== 'admin') {
    throw new Error('Apenas GM/Admin podem alterar o encontro.');
  }
}

// ── Public API ───────────────────────────────────────────────

/**
 * Return the active encounter (status='active') with its combatants
 * pre-loaded under `.combatants`, or null if none exists.
 */
export async function getActive() {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('encounters')
        .select('*, combatants:encounter_combatants(*)')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      data.combatants = sortCombatants(data.combatants || []);
      return data;
    } catch (err) {
      console.warn('[encounters.getActive] Supabase fetch failed', err);
    }
  }
  const local = readLocal();
  if (!local || local.status !== 'active') return null;
  return { ...local, combatants: sortCombatants(local.combatants || []) };
}

/**
 * Create a new encounter in `active` status with the given combatants.
 * Each combatant: { kind, ref_id, name, initiative, initiative_mod }.
 * Turn order is assigned by sorting initiative DESC (ties broken by
 * insertion order).
 */
export async function start({ name, combatants }) {
  assertGm();
  const ordered = sortAndIndexCombatants(combatants || []);
  const user = currentSessionUser();
  const now = new Date().toISOString();

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      // 1. Close any previously active encounter so we keep a single source of truth.
      await client.from('encounters').update({ status: 'ended', ended_at: now }).eq('status', 'active');

      // 2. Insert the new encounter.
      const { data: enc, error: encErr } = await client
        .from('encounters')
        .insert({
          name: name || 'Combate',
          status: 'active',
          current_round: 1,
          current_turn_index: 0,
          started_at: now,
          created_by: user?.id || null,
        })
        .select('*')
        .single();
      if (encErr) throw encErr;

      // 3. Insert combatants.
      if (ordered.length > 0) {
        const rows = ordered.map((c) => ({
          encounter_id: enc.id,
          kind: c.kind,
          ref_id: c.ref_id || null,
          name: c.name,
          initiative: c.initiative,
          initiative_mod: c.initiative_mod || 0,
          turn_order: c.turn_order,
          has_acted: false,
        }));
        const { error: cErr } = await client.from('encounter_combatants').insert(rows);
        if (cErr) throw cErr;
      }
      return getActive();
    } catch (err) {
      console.warn('[encounters.start] Supabase failed, falling back to localStorage', err);
    }
  }

  const encounter = {
    id: localId(),
    name: name || 'Combate',
    status: 'active',
    current_round: 1,
    current_turn_index: 0,
    started_at: now,
    ended_at: null,
    combatants: ordered.map((c) => ({ ...c, id: localId(), has_acted: false })),
  };
  writeLocal(encounter);
  return encounter;
}

/**
 * Advance the turn pointer (i.e. pass to the next combatant's "vez").
 * GM-only entry point — for the player-side "Fim da minha vez" use
 * {@link endOwnTurn}.
 */
export async function advanceTurn(encounterId) {
  assertGm();
  return _advanceTurnUnchecked(encounterId);
}

/**
 * Same as `advanceTurn` but callable by a player when they own the
 * currently-active combatant. Validates that the username matches the
 * combatant whose vez is ending, then advances.
 */
export async function endOwnTurn(encounterId, username) {
  const current = await getActive();
  if (!current || current.id !== encounterId) return null;
  const total = current.combatants.length;
  if (total === 0) return current;
  const idx = current.current_turn_index % total;
  const active = current.combatants[idx];
  if (!active || active.kind !== 'character') {
    throw new Error('Não é a vez de um jogador.');
  }
  if (String(active.name || '').trim().toLowerCase() !== String(username || '').trim().toLowerCase()) {
    throw new Error('Só o jogador na vez actual pode encerrá-la.');
  }
  return _advanceTurnUnchecked(encounterId);
}

async function _advanceTurnUnchecked(encounterId) {
  const current = await getActive();
  if (!current || current.id !== encounterId) return null;

  const total = current.combatants.length;
  if (total === 0) return current;

  const leavingIdx = current.current_turn_index % total;
  const leaving = current.combatants[leavingIdx];
  const nextIdx = (leavingIdx + 1) % total;
  const nextRound = nextIdx === 0 ? current.current_round + 1 : current.current_round;

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      if (leaving) {
        await client.from('encounter_combatants').update({ has_acted: true }).eq('id', leaving.id);
      }
      if (nextIdx === 0) {
        await client.from('encounter_combatants').update({ has_acted: false }).eq('encounter_id', current.id);
      }
      await client
        .from('encounters')
        .update({ current_turn_index: nextIdx, current_round: nextRound })
        .eq('id', current.id);
      return getActive();
    } catch (err) {
      console.warn('[encounters._advanceTurnUnchecked] Supabase failed, falling back', err);
    }
  }

  if (leaving) leaving.has_acted = true;
  if (nextIdx === 0) current.combatants.forEach((c) => { c.has_acted = false; });
  current.current_turn_index = nextIdx;
  current.current_round = nextRound;
  writeLocal(current);
  return current;
}

/**
 * Player-side action: mark the player's current combatant as ready to end
 * their vez. The GM still has to confirm by clicking "Próxima vez"
 * (this just sets `has_acted = true` for visibility).
 */
export async function markActed(combatantId) {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      await client.from('encounter_combatants').update({ has_acted: true }).eq('id', combatantId);
      return getActive();
    } catch (err) {
      console.warn('[encounters.markActed] Supabase failed', err);
    }
  }
  const current = readLocal();
  if (!current) return null;
  const c = current.combatants.find((x) => x.id === combatantId);
  if (c) c.has_acted = true;
  writeLocal(current);
  return current;
}

/** End the encounter (status='ended'). */
export async function end(encounterId) {
  assertGm();
  const now = new Date().toISOString();
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      await client.from('encounters').update({ status: 'ended', ended_at: now }).eq('id', encounterId);
      return null;
    } catch (err) {
      console.warn('[encounters.end] Supabase failed', err);
    }
  }
  writeLocal(null);
  return null;
}

/**
 * Patch a combatant (HP not stored here; just initiative/turn flags).
 */
export async function updateCombatant(combatantId, patch) {
  assertGm();
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      await client.from('encounter_combatants').update(patch).eq('id', combatantId);
      return getActive();
    } catch (err) {
      console.warn('[encounters.updateCombatant] Supabase failed', err);
    }
  }
  const current = readLocal();
  if (!current) return null;
  const c = current.combatants.find((x) => x.id === combatantId);
  if (c) Object.assign(c, patch);
  writeLocal(current);
  return current;
}

/**
 * Subscribe to realtime changes on encounters + combatants. The callback
 * is fired with `getActive()` whenever a relevant row changes. Returns a
 * cleanup function. Falls back to a 3s poll when Supabase is off.
 */
export function subscribe(callback) {
  if (isSupabaseEnabled()) {
    let cancelled = false;
    let channel = null;
    const fire = async () => {
      if (cancelled) return;
      try { callback(await getActive()); } catch (err) { console.warn('[encounters.subscribe]', err); }
    };
    (async () => {
      const client = await getSupabaseClient();
      channel = client
        .channel('encounters-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'encounters' }, fire)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'encounter_combatants' }, fire)
        .subscribe();
    })().catch((err) => console.warn('[encounters.subscribe] init', err));
    return () => {
      cancelled = true;
      if (channel) {
        getSupabaseClient().then((client) => client.removeChannel(channel)).catch(() => {});
      }
    };
  }
  // Poll-only fallback (when Supabase is disabled there's no shared state
  // across browsers anyway — we still fire so the same window stays fresh).
  const interval = setInterval(() => {
    callback(readLocal());
  }, 3000);
  return () => clearInterval(interval);
}

// ── Helpers ──────────────────────────────────────────────────

function sortCombatants(list) {
  return [...list].sort((a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0));
}

function sortAndIndexCombatants(list) {
  return [...list]
    .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))
    .map((c, idx) => ({ ...c, turn_order: idx }));
}
