/**
 * Shop Profiles API
 *
 * A "profile" is a named bundle of items the GM can activate to set
 * `in_shop = true` for that list (and clear everything else). Useful for
 * swapping the storefront between regional / arc-themed inventories
 * without ticking every checkbox individually.
 *
 * Storage:
 *   - Supabase mode → `shop_profiles` table.
 *   - Offline mode  → `avatar_rpg_shop_profiles` in `localStorage`. The
 *     `apply()` step iterates the imported/mock items in `data.js` and
 *     toggles `in_shop` via `items.updateItem` (which itself has an
 *     offline fallback, so the round-trip works end-to-end).
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';
import { getImportedItems, setImportedItems } from '../import/storage.js';
import { MOCK_SHOP_ITEMS } from '../shop/data.js';

const LOCAL_KEY = 'avatar_rpg_shop_profiles';

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

// ── Local helpers ────────────────────────────────────────────
function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(profiles) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.warn('[shopProfiles] localStorage write failed', err);
  }
}

function makeLocalId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function list() {
  if (!isSupabaseEnabled()) return readLocal();
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.from('shop_profiles').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[shopProfiles.list]', err);
    return readLocal();
  }
}

export async function create({ name, description, item_ids }) {
  assertGm();
  const payload = {
    name: String(name || '').trim() || 'Perfil sem nome',
    description: description || null,
    item_ids: Array.isArray(item_ids) ? item_ids : [],
  };

  if (!isSupabaseEnabled()) {
    const now = new Date().toISOString();
    const row = {
      id: makeLocalId(),
      ...payload,
      created_by: currentUser()?.id || null,
      created_at: now,
      updated_at: now,
    };
    const all = readLocal();
    all.unshift(row);
    writeLocal(all);
    return row;
  }

  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('shop_profiles')
    .insert({ ...payload, created_by: currentUser()?.id || null })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function update(id, patch) {
  assertGm();
  const cleaned = {};
  if ('name' in patch) cleaned.name = String(patch.name || '').trim() || 'Perfil sem nome';
  if ('description' in patch) cleaned.description = patch.description || null;
  if ('item_ids' in patch) cleaned.item_ids = Array.isArray(patch.item_ids) ? patch.item_ids : [];

  if (!isSupabaseEnabled()) {
    const all = readLocal();
    const idx = all.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Perfil não encontrado.');
    all[idx] = { ...all[idx], ...cleaned, updated_at: new Date().toISOString() };
    writeLocal(all);
    return all[idx];
  }

  const client = await getSupabaseClient();
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
  if (!isSupabaseEnabled()) {
    writeLocal(readLocal().filter((p) => p.id !== id));
    return;
  }
  const client = await getSupabaseClient();
  const { error } = await client.from('shop_profiles').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Activate a profile: sets `in_shop` to true for the profile's ids and
 * false for every other item. Best-effort two-step (Supabase REST doesn't
 * expose transactions for cross-row updates; localStorage mode just
 * rewrites the imported-items store in one shot).
 */
export async function apply(profileId) {
  assertGm();

  if (!isSupabaseEnabled()) {
    const profile = readLocal().find((p) => p.id === profileId);
    if (!profile) throw new Error('Perfil não encontrado.');
    const ids = new Set(Array.isArray(profile.item_ids) ? profile.item_ids : []);

    // Local universe = imported store ∪ mocks. The semantic of "apply"
    // is "only these items are visible to players", so on offline mode
    // we materialise every mock that isn't already in the imported
    // store and stamp `in_shop` on it. After this call, the imported
    // store is the single source of truth and nothing leaks through
    // the mock-fallback path.
    const imported = getImportedItems();
    const next = imported.map((i) => ({ ...i, in_shop: ids.has(i.id) }));
    const seenNames = new Set(imported.map((i) => i.name));

    MOCK_SHOP_ITEMS.forEach((mock) => {
      if (seenNames.has(mock.name)) return;
      next.push({ ...mock, in_shop: ids.has(mock.id) });
    });

    setImportedItems(next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shop:items:updated'));
    }
    return;
  }

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
 * Snapshot the current shop selection (every item with `in_shop !== false`)
 * into a new profile. Returns the created row.
 *
 * The `!== false` semantics match the player-side filter in
 * `shop/data.js::getShopItems` so the snapshot truly captures what
 * players are seeing right now (mocks default to undefined / visible).
 */
export async function snapshotCurrent(name, description) {
  assertGm();

  if (!isSupabaseEnabled()) {
    const imported = getImportedItems().filter((i) => i.in_shop !== false);
    const importedNames = new Set(imported.map((i) => i.name));
    const mocks = MOCK_SHOP_ITEMS.filter((m) => m.in_shop !== false && !importedNames.has(m.name));
    const ids = [...imported.map((i) => i.id), ...mocks.map((m) => m.id)];
    return create({ name, description, item_ids: ids });
  }

  const client = await getSupabaseClient();
  const { data: items, error } = await client.from('items').select('id').eq('in_shop', true);
  if (error) throw error;
  const ids = (items || []).map((i) => i.id);
  return create({ name, description, item_ids: ids });
}
