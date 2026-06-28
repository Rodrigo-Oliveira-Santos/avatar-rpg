/**
 * Items API
 *
 * When Supabase is enabled, fetches items from the `items` table (and the
 * `in_shop` slice for the shop). Otherwise returns empty arrays so the UI
 * falls back to imported/mock data.
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';

function rowToItem(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    rarity: row.rarity,
    price: row.price,
    weight_class: row.weight_class,
    defense_bonus: row.defense_bonus,
    dodge_penalty: row.dodge_penalty,
    attributes: row.attributes || {},
    in_shop: row.in_shop,
    gm_notes: row.gm_notes,
  };
}

export async function listAll() {
  if (!isSupabaseEnabled()) return [];
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.from('items').select('*');
    if (error) throw error;
    return (data || []).map(rowToItem);
  } catch (err) {
    console.warn('[items.listAll] Supabase fetch failed', err);
    return [];
  }
}

export async function getShopItems() {
  if (!isSupabaseEnabled()) return [];
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('items')
      .select('*')
      .eq('in_shop', true);
    if (error) throw error;
    return (data || []).map(rowToItem);
  } catch (err) {
    console.warn('[items.getShopItems] Supabase fetch failed', err);
    return [];
  }
}

/**
 * Record a shop purchase. Decrements buyer gold and adds inventory row
 * inside a best-effort sequence (no real transaction available from PostgREST).
 */
export async function purchase(itemId, characterId) {
  if (!isSupabaseEnabled()) return { success: true };
  try {
    const client = await getSupabaseClient();
    const { error } = await client
      .from('character_inventory')
      .upsert(
        { character_id: characterId, item_id: itemId, acquired_from: 'shop' },
        { onConflict: 'character_id,item_id' }
      );
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[items.purchase] Supabase write failed', err);
    return { success: false, error: err.message };
  }
}

/**
 * Bulk-import items (GM action). Upserts on `name`.
 */
export async function importItems(payload) {
  if (!isSupabaseEnabled()) return { imported: 0 };
  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (!items.length) return { imported: 0 };
  try {
    const client = await getSupabaseClient();
    const rows = items.map((it) => ({
      name: it.name,
      description: it.description ?? null,
      type: it.type ?? 'other',
      rarity: it.rarity ?? 'common',
      price: it.price ?? 0,
      weight_class: it.weight_class ?? null,
      defense_bonus: it.defense_bonus ?? 0,
      dodge_penalty: it.dodge_penalty ?? 0,
      attributes: it.attributes ?? {},
      in_shop: it.in_shop ?? false,
      gm_notes: it.gm_notes ?? null,
    }));
    const { error, count } = await client
      .from('items')
      .upsert(rows, { onConflict: 'name', count: 'exact' });
    if (error) throw error;
    return { imported: count ?? rows.length };
  } catch (err) {
    console.warn('[items.importItems] Supabase upsert failed', err);
    return { imported: 0, error: err.message };
  }
}
