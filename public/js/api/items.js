/**
 * Items API
 *
 * When Supabase is enabled, fetches items from the `items` table (and the
 * `in_shop` slice for the shop). Otherwise reads from / writes to the
 * GM-imported store in `localStorage` (key: `avatar_rpg_imported_items`)
 * so the management UI keeps working offline. Mocks defined in
 * `shop/data.js` are read-only — the manager auto-copies them into the
 * imported store on first edit (see ShopManager).
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';
import {
  getImportedItems,
  saveImportedItems,
  setImportedItems,
} from '../import/storage.js';

/** Custom event dispatched after any local mutation so the UI can refresh. */
export const ITEMS_UPDATED_EVENT = 'shop:items:updated';

function emitItemsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ITEMS_UPDATED_EVENT));
  }
}

function makeLocalId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

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

/**
 * Create a single item (GM management UI). Returns the new item.
 *
 * Offline (Supabase off): persists to `avatar_rpg_imported_items` with a
 * generated `local-…` id so the manager can immediately edit it without
 * a round-trip to the server.
 */
export async function createItem(input) {
  if (!isSupabaseEnabled()) {
    const newItem = {
      id: input.id || makeLocalId(),
      name: String(input.name || '').trim(),
      description: input.description || null,
      type: input.type || 'other',
      rarity: input.rarity || 'common',
      price: Number(input.price) || 0,
      weight_class: input.weight_class || null,
      defense_bonus: Number(input.defense_bonus) || 0,
      dodge_penalty: Number(input.dodge_penalty) || 0,
      attributes: input.attributes || {},
      // Match the player view filter (`in_shop !== false`): undefined
      // is treated as visible-by-default, so promoting a mock keeps it
      // visible instead of accidentally hiding it.
      in_shop: input.in_shop !== false,
      gm_notes: input.gm_notes || null,
      // Preserve free-form fields the import schema accepts but the DB
      // columns above don't have a slot for (modifiers, damage, effect,
      // scrollType, etc.). Lets "Promover" round-trip a mock item without
      // losing flavour data.
      ...(input.modifiers !== undefined && { modifiers: input.modifiers }),
      ...(input.damage !== undefined && { damage: input.damage }),
      ...(input.effect !== undefined && { effect: input.effect }),
      ...(input.element !== undefined && { element: input.element }),
      ...(input.nationPrice !== undefined && { nationPrice: input.nationPrice }),
      ...(input.scrollType !== undefined && { scrollType: input.scrollType }),
      ...(input.scrollValue !== undefined && { scrollValue: input.scrollValue }),
    };
    const list = getImportedItems();
    // Dedupe by name — promoting a mock twice would otherwise create
    // ghosts that the player view would have to filter out.
    const existingIdx = list.findIndex((i) => i.name === newItem.name);
    if (existingIdx >= 0) list[existingIdx] = { ...list[existingIdx], ...newItem };
    else list.push(newItem);
    setImportedItems(list);
    emitItemsUpdated();
    return newItem;
  }
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('items')
    .insert({
      name: input.name,
      description: input.description || null,
      type: input.type || 'other',
      rarity: input.rarity || 'common',
      price: Number(input.price) || 0,
      weight_class: input.weight_class || null,
      defense_bonus: Number(input.defense_bonus) || 0,
      dodge_penalty: Number(input.dodge_penalty) || 0,
      attributes: input.attributes || {},
      // Same visible-by-default semantic as the offline path above.
      in_shop: input.in_shop !== false,
      gm_notes: input.gm_notes || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToItem(data);
}

/**
 * Patch a single item by id (GM management UI). Returns the updated item.
 *
 * Offline path mirrors `createItem`: finds the row in
 * `avatar_rpg_imported_items` and rewrites it. Throws when the id isn't
 * known locally (e.g. a mock item that the manager forgot to promote).
 */
export async function updateItem(id, patch) {
  if (!isSupabaseEnabled()) {
    const list = getImportedItems();
    const idx = list.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error('Item não encontrado no armazenamento local.');
    const allowed = ['name','description','type','rarity','price','weight_class',
                     'defense_bonus','dodge_penalty','attributes','in_shop','gm_notes',
                     'modifiers','damage','effect','element','nationPrice','scrollType','scrollValue'];
    const cleaned = {};
    allowed.forEach((k) => { if (k in patch) cleaned[k] = patch[k]; });
    list[idx] = { ...list[idx], ...cleaned };
    setImportedItems(list);
    emitItemsUpdated();
    return list[idx];
  }
  const client = await getSupabaseClient();
  const cleaned = {};
  ['name','description','type','rarity','price','weight_class','defense_bonus','dodge_penalty','attributes','in_shop','gm_notes']
    .forEach((k) => { if (k in patch) cleaned[k] = patch[k]; });
  const { data, error } = await client
    .from('items')
    .update(cleaned)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToItem(data);
}

/** Delete an item by id (cascades into character_inventory). */
export async function deleteItem(id) {
  if (!isSupabaseEnabled()) {
    const list = getImportedItems();
    const next = list.filter((i) => i.id !== id);
    if (next.length === list.length) {
      throw new Error('Item não encontrado no armazenamento local.');
    }
    setImportedItems(next);
    emitItemsUpdated();
    return;
  }
  const client = await getSupabaseClient();
  const { error } = await client.from('items').delete().eq('id', id);
  if (error) throw error;
}
