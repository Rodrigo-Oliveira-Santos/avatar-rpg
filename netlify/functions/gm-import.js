/**
 * POST /api/gm/import
 * Bulk import skills or items from JSON (GM only)
 *
 * Body: { type: 'skills' | 'items', data: [...] }
 *
 * Skill schema (skill-import-v1):
 * { element, category, tier, name, description, requirements, prerequisites, position, attacks, passive_effect }
 *
 * Item schema (item-import-v1):
 * { name, description, type, rarity, price, weight_class, defense_bonus, dodge_penalty, attributes, in_shop }
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, serverError } from './lib/response.js';
import { requireGM } from './lib/auth.js';

const VALID_ELEMENTS = ['fire', 'water', 'earth', 'air', 'none'];
const VALID_CATEGORIES = ['spirit', 'agility', 'precise', 'brute'];
const VALID_ITEM_TYPES = ['weapon', 'armor', 'accessory', 'consumable', 'other'];
const VALID_RARITIES = ['common', 'rare', 'epic', 'legendary'];

function validateSkill(skill) {
  const errs = [];
  if (!skill.name) errs.push('name required');
  if (!VALID_ELEMENTS.includes(skill.element)) errs.push(`invalid element: ${skill.element}`);
  if (!VALID_CATEGORIES.includes(skill.category)) errs.push(`invalid category: ${skill.category}`);
  if (![1, 2, 3, 4].includes(skill.tier)) errs.push(`invalid tier: ${skill.tier}`);
  return errs;
}

function validateItem(item) {
  const errs = [];
  if (!item.name) errs.push('name required');
  if (item.type && !VALID_ITEM_TYPES.includes(item.type)) errs.push(`invalid type: ${item.type}`);
  if (item.rarity && !VALID_RARITIES.includes(item.rarity)) errs.push(`invalid rarity: ${item.rarity}`);
  return errs;
}

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'POST') return error('Método não permitido', 405);

  const { error_response } = await requireGM(event);
  if (error_response) return error_response;

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error('JSON inválido');
  }

  const { type, data: records } = body;
  if (!type || !Array.isArray(records)) return error('type e data[] são obrigatórios');
  if (records.length === 0) return error('data não pode estar vazio');
  if (records.length > 500) return error('Máximo de 500 registos por importação');

  try {
    if (type === 'skills') {
      const validationErrors = [];
      records.forEach((skill, idx) => {
        const errs = validateSkill(skill);
        if (errs.length) validationErrors.push(`[${idx}] ${errs.join(', ')}`);
      });
      if (validationErrors.length) return error(`Erros de validação:\n${validationErrors.join('\n')}`);

      const { data, error: dbErr } = await supabase
        .from('skills')
        .upsert(records, { onConflict: 'element,name' })
        .select();

      if (dbErr) throw dbErr;
      return ok({ success: true, type, imported: data?.length ?? records.length });
    }

    if (type === 'items') {
      const validationErrors = [];
      records.forEach((item, idx) => {
        const errs = validateItem(item);
        if (errs.length) validationErrors.push(`[${idx}] ${errs.join(', ')}`);
      });
      if (validationErrors.length) return error(`Erros de validação:\n${validationErrors.join('\n')}`);

      const { data, error: dbErr } = await supabase
        .from('items')
        .upsert(records, { onConflict: 'name' })
        .select();

      if (dbErr) throw dbErr;
      return ok({ success: true, type, imported: data?.length ?? records.length });
    }

    return error(`Tipo inválido: ${type}. Use "skills" ou "items".`);
  } catch (err) {
    console.error('[gm-import]', err);
    return serverError();
  }
};
