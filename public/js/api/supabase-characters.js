/**
 * Character persistence backed by Supabase.
 *
 * Only used when `useSupabase` is enabled. Failures bubble up so the
 * caller can fall back to localStorage without losing data.
 */

import { getSupabaseClient } from './supabase-client.js';
import { characterToRow, rowToCharacter } from './character-mapper.js';

/**
 * Resolve `username → users.id`.
 *
 * By default this is **read-only**: returns null when the user doesn't
 * exist. Pass `{ createIfMissing: true }` for the rare path that legit
 * needs to bootstrap (first login). Without this guard, every GM action
 * targeting a stale player name (e.g. mock fallback usernames like
 * `kael` / `yuki`) would silently insert a roleless ghost user row.
 */
async function resolveUserId(username, { createIfMissing = false } = {}) {
  if (!username) throw new Error('Sem username');
  const client = await getSupabaseClient();

  const { data: existing, error: lookupErr } = await client
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (lookupErr) throw lookupErr;
  if (existing?.id) return existing.id;
  if (!createIfMissing) return null;

  const { data: created, error: insertErr } = await client
    .from('users')
    .insert({ username })
    .select('id')
    .single();
  if (insertErr) throw insertErr;
  return created.id;
}

export async function loadCharacter(username) {
  const client = await getSupabaseClient();
  const userId = await resolveUserId(username);
  if (!userId) return null;
  const { data, error } = await client
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToCharacter(data) : null;
}

export async function saveCharacter(username, character, opts = {}) {
  const client = await getSupabaseClient();
  // Create-if-missing here is intentional: this is the first-login
  // bootstrap path. Every other writer below is read-only and bails if
  // the user doesn't exist (avoids creating phantom users from typos /
  // stale hub mocks).
  const userId = await resolveUserId(username, { createIfMissing: true });
  const row = characterToRow(userId, character, opts);

  const { data: existing } = await client
    .from('characters')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await client
      .from('characters')
      .update(row)
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data: created, error } = await client
    .from('characters')
    .insert(row)
    .select('id')
    .single();
  if (error) throw error;
  return created.id;
}

/**
 * Targeted write of just the `status_effects` column. Used by the GM
 * StatusEffectManager so the update doesn't race the target player's
 * AutoSave (which writes everything *except* this column).
 */
export async function updateStatusEffects(username, statusEffects) {
  const client = await getSupabaseClient();
  const userId = await resolveUserId(username);
  if (!userId) throw new Error(`Sem ficha para ${username}.`);
  const payload = Array.isArray(statusEffects) ? statusEffects : [];

  const { error } = await client
    .from('characters')
    .update({ status_effects: payload })
    .eq('user_id', userId);
  if (error) throw error;
}

/**
 * Targeted write of just the `gm_notes` column. Used by the GM Notes
 * editor so the update doesn't race the target player's AutoSave (which
 * is configured to skip this column).
 */
export async function updateGmNotes(username, notes) {
  const client = await getSupabaseClient();
  const userId = await resolveUserId(username);
  if (!userId) throw new Error(`Sem ficha para ${username}.`);
  const payload = Array.isArray(notes) ? notes : [];

  const { error } = await client
    .from('characters')
    .update({ gm_notes: payload })
    .eq('user_id', userId);
  if (error) throw error;
}

/**
 * Targeted write of the player's current vitals (hp/cp/sp). Used by both
 * the player's own sheet and the GM Control panel — the dedicated columns
 * sidestep the full-row AutoSave race.
 */
export async function updateVitals(username, patch) {
  const client = await getSupabaseClient();
  const userId = await resolveUserId(username);
  if (!userId) throw new Error(`Sem ficha para ${username}.`);
  const cleaned = {};
  if (Number.isFinite(patch.hp_current)) cleaned.hp_current = patch.hp_current;
  if (Number.isFinite(patch.cp_current)) cleaned.cp_current = patch.cp_current;
  if (Number.isFinite(patch.sp_current)) cleaned.sp_current = patch.sp_current;
  if (Object.keys(cleaned).length === 0) return;

  const { error } = await client
    .from('characters')
    .update(cleaned)
    .eq('user_id', userId);
  if (error) throw error;
}

/**
 * Realtime subscription on the `characters` table. Fires `callback(row)`
 * for every change (insert/update). Returns a cleanup function.
 * Falls back to a no-op when Supabase isn't enabled.
 */
export async function subscribeToCharacters(callback) {
  const { isSupabaseEnabled } = await import('./config.js');
  if (!isSupabaseEnabled()) return () => {};
  const client = await getSupabaseClient();
  const channel = client
    .channel('characters-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, (payload) => {
      try { callback(payload?.new || payload?.old || null, payload); }
      catch (err) { console.warn('[supabase.subscribeToCharacters]', err); }
    })
    .subscribe();
  return () => { client.removeChannel(channel); };
}
