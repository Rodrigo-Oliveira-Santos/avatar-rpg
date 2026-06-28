/**
 * Skills API
 *
 * When Supabase is enabled, fetches skills from the `skills` table. Otherwise
 * returns empty lists — the app already falls back to localStorage-imported
 * skills (`skills/data.js`).
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';

function rowToSkill(row) {
  return {
    id: row.id,
    name: row.name,
    element: row.element,
    category: row.category,
    tier: row.tier,
    description: row.description,
    position: row.position,
    requirements: row.requirements || {},
    prerequisites: row.prerequisites || [],
    attacks: row.attacks || [],
    passive_effect: row.passive_effect || null,
  };
}

export async function listAll() {
  if (!isSupabaseEnabled()) return [];
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.from('skills').select('*');
    if (error) throw error;
    return (data || []).map(rowToSkill);
  } catch (err) {
    console.warn('[skills.listAll] Supabase fetch failed', err);
    return [];
  }
}

export async function getSkills(element) {
  if (!isSupabaseEnabled()) return [];
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('skills')
      .select('*')
      .eq('element', element);
    if (error) throw error;
    return (data || []).map(rowToSkill);
  } catch (err) {
    console.warn('[skills.getSkills] Supabase fetch failed', err);
    return [];
  }
}

/**
 * Bulk-import a list of skills (GM action). Uses upsert on (element, name).
 */
export async function importSkills(payload) {
  if (!isSupabaseEnabled()) return { imported: 0 };
  const skills = Array.isArray(payload?.skills) ? payload.skills : [];
  if (!skills.length) return { imported: 0 };
  try {
    const client = await getSupabaseClient();
    const rows = skills.map((s) => ({
      name: s.name,
      element: s.element,
      category: s.category,
      tier: s.tier,
      description: s.description ?? null,
      position: s.position ?? 'any',
      requirements: s.requirements ?? {},
      prerequisites: s.prerequisites ?? [],
      attacks: s.attacks ?? [],
      passive_effect: s.passive_effect ?? null,
    }));
    const { error, count } = await client
      .from('skills')
      .upsert(rows, { onConflict: 'element,name', count: 'exact' });
    if (error) throw error;
    return { imported: count ?? rows.length };
  } catch (err) {
    console.warn('[skills.importSkills] Supabase upsert failed', err);
    return { imported: 0, error: err.message };
  }
}
