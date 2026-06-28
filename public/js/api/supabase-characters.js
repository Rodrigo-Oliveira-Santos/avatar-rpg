/**
 * Character persistence backed by Supabase.
 *
 * Only used when `useSupabase` is enabled. Failures bubble up so the
 * caller can fall back to localStorage without losing data.
 */

import { getSupabaseClient } from './supabase-client.js';
import { characterToRow, rowToCharacter } from './character-mapper.js';

async function resolveUserId(username) {
  if (!username) throw new Error('Sem username');
  const client = await getSupabaseClient();

  const { data: existing, error: lookupErr } = await client
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (lookupErr) throw lookupErr;
  if (existing?.id) return existing.id;

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

  const { data, error } = await client
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToCharacter(data) : null;
}

export async function saveCharacter(username, character) {
  const client = await getSupabaseClient();
  const userId = await resolveUserId(username);
  const row = characterToRow(userId, character);

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
