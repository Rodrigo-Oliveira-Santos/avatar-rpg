/**
 * Monsters API
 *
 * Persistence façade for the GM monster catalogue.
 *
 * Resolution order (mirrors the rest of `api/`):
 *   1. Supabase REST when `useSupabase` is enabled.
 *   2. `localStorage` fallback so the page keeps working offline / pre-Auth.
 *
 * Storage key for the local fallback: `avatar_rpg_monsters`. Holds an array
 * of monsters in the same shape we read from Supabase (snake_case for the
 * columns + JSONB payloads as plain JS objects).
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';

const LOCAL_KEY = 'avatar_rpg_monsters';

// ── Local fallback ───────────────────────────────────────────
function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(monsters) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(monsters));
  } catch (err) {
    console.warn('[monsters] localStorage write failed', err);
  }
}

function makeLocalId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Resolve the logged-in user's role from `localStorage.avatar_rpg_user`.
 * Returns null if there's no session. Used by the API guards below so a
 * non-GM call from devtools fails fast instead of silently bouncing on
 * the RLS layer (which is permissive in local dev).
 */
function currentRole() {
  try {
    return JSON.parse(localStorage.getItem('avatar_rpg_user') || 'null')?.role || null;
  } catch {
    return null;
  }
}

function assertGm() {
  const role = currentRole();
  if (role !== 'gm' && role !== 'admin') {
    throw new Error('Apenas GM/Admin podem alterar monstros.');
  }
}

// ── Public API ───────────────────────────────────────────────

/**
 * List every monster in the catalogue (GM view).
 *
 * @returns {Promise<object[]>}
 */
export async function list() {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('monsters')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[monsters.list] Supabase fetch failed, using local fallback', err);
    }
  }
  return readLocal();
}

/**
 * List only the monsters currently staged for the next battle (`is_staged`).
 * Excludes dead ones.
 *
 * @returns {Promise<object[]>}
 */
export async function listStaged() {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('monsters')
        .select('*')
        .eq('is_staged', true)
        .eq('is_dead', false)
        .order('updated_at', { ascending: true });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[monsters.listStaged] Supabase fetch failed, using local fallback', err);
    }
  }
  return readLocal().filter((m) => m.is_staged === true && !m.is_dead);
}

/** Alias kept for back-compat with old call sites. */
export const listInPlay = listStaged;

/**
 * Insert a new monster. Returns the persisted row (with id assigned).
 *
 * @param {object} input
 * @returns {Promise<object>}
 */
export async function create(input) {
  assertGm();
  const payload = sanitize(input);
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('monsters')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[monsters.create] Supabase insert failed, kept local copy', err);
    }
  }
  const monsters = readLocal();
  const row = {
    ...payload,
    id: makeLocalId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  monsters.unshift(row);
  writeLocal(monsters);
  return row;
}

/**
 * Patch a monster by id. Fields not present in `patch` are left untouched.
 *
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object>}
 */
/**
 * Tick-only patch on a monster row. Mirrors `update(id, patch)` but
 * SKIPS the GM gate so that a player ending their own turn can apply
 * the monster's `damage_per_turn` + decrement `duration_turns` without
 * tripping the role check.
 *
 * Only the fields needed during a tick are accepted (`hp_current`,
 * `status_effects`); attempting to pass anything else is ignored.
 */
export async function tickPatch(id, patch) {
  const cleaned = {};
  if (Number.isFinite(patch.hp_current)) cleaned.hp_current = patch.hp_current;
  if (Array.isArray(patch.status_effects)) cleaned.status_effects = patch.status_effects;
  if (Object.keys(cleaned).length === 0) return null;

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('monsters')
        .update(cleaned)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[monsters.tickPatch] Supabase update failed, using local fallback', err);
    }
  }
  const monsters = readLocal();
  const idx = monsters.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  monsters[idx] = { ...monsters[idx], ...cleaned, updated_at: new Date().toISOString() };
  writeLocal(monsters);
  return monsters[idx];
}

export async function update(id, patch) {
  assertGm();
  const cleaned = sanitize(patch, { partial: true });
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('monsters')
        .update(cleaned)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[monsters.update] Supabase update failed, using local fallback', err);
    }
  }
  const monsters = readLocal();
  const idx = monsters.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error('Monstro não encontrado.');
  monsters[idx] = { ...monsters[idx], ...cleaned, updated_at: new Date().toISOString() };
  writeLocal(monsters);
  return monsters[idx];
}

/**
 * Toggle / set the staging flag (selected for the next battle).
 */
export async function setStaged(id, flag) {
  return update(id, { is_staged: Boolean(flag) });
}

/** Alias kept for back-compat with old call sites. */
export const setInPlay = setStaged;

/** Mark/unmark as dead (sends to cemetery; can be restored later). */
export async function setDead(id, flag) {
  // Dying also leaves the staging list; reviving doesn't touch it so
  // the GM can revive straight into a battle if they want.
  const patch = { is_dead: Boolean(flag) };
  if (flag) patch.is_staged = false;
  return update(id, patch);
}

/**
 * Delete a monster by id.
 */
export async function remove(id) {
  assertGm();
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { error } = await client.from('monsters').delete().eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('[monsters.remove] Supabase delete failed, using local fallback', err);
    }
  }
  const monsters = readLocal().filter((m) => m.id !== id);
  writeLocal(monsters);
}

/**
 * Subscribe to realtime changes on the `monsters` table. The callback is
 * fired (no payload) on any INSERT/UPDATE/DELETE so the caller can
 * `refresh()` itself. Returns a cleanup function. Falls back to a no-op
 * when Supabase isn't enabled (the in-window CustomEvent already covers
 * single-tab usage).
 */
export async function subscribe(callback) {
  if (!isSupabaseEnabled()) return () => {};
  const client = await getSupabaseClient();
  const channel = client
    .channel('monsters-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'monsters' }, () => {
      try { callback(); } catch (err) { console.warn('[monsters.subscribe]', err); }
    })
    .subscribe();
  return () => { client.removeChannel(channel); };
}

/**
 * Coerce a UI-provided payload into the column/JSONB shape Supabase
 * expects. Strips unknown fields and applies sane defaults.
 *
 * @param {object} input
 * @param {object} [opts]
 * @param {boolean} [opts.partial] When true, missing fields are NOT
 *   defaulted (used by `update`).
 */
function sanitize(input, { partial = false } = {}) {
  const out = {};
  if ('name' in input) out.name = String(input.name || '').trim();
  if ('level' in input) out.level = clampInt(input.level, 1, 99, 1);
  if ('hp_max' in input) out.hp_max = clampInt(input.hp_max, 1, 100000, 10);
  if ('hp_current' in input) out.hp_current = clampInt(input.hp_current, 0, 100000, 10);
  if ('defense' in input) out.defense = clampInt(input.defense, 0, 999, 10);
  if ('dodge' in input) out.dodge = clampInt(input.dodge, 0, 999, 10);
  ['for', 'agi', 'chi', 'per', 'res', 'esp'].forEach((k) => {
    const key = `attr_${k}`;
    if (key in input) out[key] = clampInt(input[key], 0, 99, 8);
  });
  if ('attacks' in input) out.attacks = Array.isArray(input.attacks) ? input.attacks : [];
  if ('loot_table' in input) out.loot_table = Array.isArray(input.loot_table) ? input.loot_table : [];
  if ('status_effects' in input) out.status_effects = Array.isArray(input.status_effects) ? input.status_effects : [];
  if ('notes' in input) out.notes = input.notes || null;
  if ('is_staged' in input) out.is_staged = Boolean(input.is_staged);
  if ('is_dead'   in input) out.is_dead   = Boolean(input.is_dead);
  if ('created_by' in input) out.created_by = input.created_by || null;

  if (!partial) {
    if (!out.name) out.name = 'Monstro sem nome';
    if (out.hp_max === undefined) out.hp_max = 10;
    if (out.hp_current === undefined) out.hp_current = out.hp_max;
    if (out.attacks === undefined) out.attacks = [];
    if (out.loot_table === undefined) out.loot_table = [];
    if (out.status_effects === undefined) out.status_effects = [];
    if (out.is_staged === undefined) out.is_staged = false;
    if (out.is_dead === undefined) out.is_dead = false;
  }
  return out;
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
