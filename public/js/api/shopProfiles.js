/**
 * Shop Profiles API
 *
 * A "profile" is a named bundle of items the GM can activate to set
 * `items.in_shop = true` for that list (and clear everything else).
 * Useful for swapping the storefront between regional / arc-themed
 * inventories without ticking every checkbox individually.
 *
 * Storage: `shop_profiles` table (Supabase). When Supabase is disabled
 * the entire module degrades gracefully (returns empty lists / no-ops).
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';

function currentUser() {
  try { return JSON.parse(localStorage.getItem('avatar_rpg_user') || 'null') || null; }
  catch { return null; }
}

function assertGm() {
  const role = currentUser()?.role;
  if (role !== 'gm' && role !== 'admin') {
    throw new Error('Apenas GM/Admin podem gerir perfis de loja.');
  }
}

export async function list() {
  if (!isSupabaseEnabled()) return [];
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.from('shop_profiles').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[shopProfiles.list]', err);
    return [];
  }
}

export async function create({ name, description, item_ids }) {
  assertGm();
  if (!isSupabaseEnabled()) throw new Error('Supabase desligado.');
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('shop_profiles')
    .insert({
      name: String(name || '').trim() || 'Perfil sem nome',
      description: description || null,
      item_ids: Array.isArray(item_ids) ? item_ids : [],
      created_by: currentUser()?.id || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function update(id, patch) {
  assertGm();
  if (!isSupabaseEnabled()) throw new Error('Supabase desligado.');
  const client = await getSupabaseClient();
  const cleaned = {};
  if ('name' in patch) cleaned.name = String(patch.name || '').trim() || 'Perfil sem nome';
  if ('description' in patch) cleaned.description = patch.description || null;
  if ('item_ids' in patch) cleaned.item_ids = Array.isArray(patch.item_ids) ? patch.item_ids : [];
  const { data, error } = await client
    .from('shop_profiles')
    .update(cleaned)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function remove(id) {
  assertGm();
  if (!isSupabaseEnabled()) throw new Error('Supabase desligado.');
  const client = await getSupabaseClient();
  const { error } = await client.from('shop_profiles').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Activate a profile: sets `items.in_shop` to true for the profile's
 * ids and false for every other item. Best-effort two-step (Supabase
 * REST doesn't expose transactions for cross-row updates).
 */
export async function apply(profileId) {
  assertGm();
  if (!isSupabaseEnabled()) throw new Error('Supabase desligado.');
  const client = await getSupabaseClient();
  const { data: profile, error: profErr } = await client
    .from('shop_profiles').select('item_ids').eq('id', profileId).single();
  if (profErr) throw profErr;
  const ids = Array.isArray(profile?.item_ids) ? profile.item_ids : [];

  // Step 1: clear in_shop everywhere.
  const { error: clearErr } = await client.from('items').update({ in_shop: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  if (clearErr) throw clearErr;
  // Step 2: set true for the ones in the profile.
  if (ids.length > 0) {
    const { error: setErr } = await client.from('items').update({ in_shop: true }).in('id', ids);
    if (setErr) throw setErr;
  }
}

/**
 * Snapshot the current shop selection (every item with `in_shop=true`)
 * into a new profile. Returns the created row.
 */
export async function snapshotCurrent(name, description) {
  assertGm();
  if (!isSupabaseEnabled()) throw new Error('Supabase desligado.');
  const client = await getSupabaseClient();
  const { data: items, error } = await client.from('items').select('id').eq('in_shop', true);
  if (error) throw error;
  const ids = (items || []).map((i) => i.id);
  return create({ name, description, item_ids: ids });
}
