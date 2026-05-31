/**
 * Import Validators
 * Client-side validation for skill-import-v1 and item-import-v1 schemas
 */

const VALID_ELEMENTS = ['fire', 'water', 'earth', 'air', 'none'];
const VALID_CATEGORIES = ['spirit', 'agility', 'precise', 'brute'];
const VALID_TIERS = [1, 2, 3, 4];
const VALID_POSITIONS = ['off', 'def', 'any', 'pass'];
const VALID_ITEM_TYPES = ['weapon', 'armor', 'accessory', 'consumable', 'potion', 'material', 'other'];
const VALID_RARITIES = ['common', 'rare', 'epic', 'legendary'];
const VALID_WEIGHT_CLASSES = ['light', 'medium', 'heavy'];
const ATTRIBUTE_KEYS = ['FOR', 'AGI', 'CHI', 'PER', 'RES', 'ESP'];

/**
 * Validate a single skill object against skill-import-v1 schema
 * @param {object} skill - Skill data
 * @param {number} index - Index for error messages
 * @returns {string[]} Array of error messages (empty = valid)
 */
export function validateSkill(skill, index = 0) {
  const errs = [];
  const prefix = `[${index}]`;

  if (!skill || typeof skill !== 'object') {
    return [`${prefix} Não é um objeto válido`];
  }

  if (!skill.name || typeof skill.name !== 'string') {
    errs.push(`${prefix} "name" é obrigatório`);
  }

  if (!VALID_ELEMENTS.includes(skill.element)) {
    errs.push(`${prefix} "element" inválido: "${skill.element}" (válidos: ${VALID_ELEMENTS.join(', ')})`);
  }

  if (!VALID_CATEGORIES.includes(skill.category)) {
    errs.push(`${prefix} "category" inválida: "${skill.category}" (válidos: ${VALID_CATEGORIES.join(', ')})`);
  }

  if (!VALID_TIERS.includes(skill.tier)) {
    errs.push(`${prefix} "tier" inválido: ${skill.tier} (válidos: 1-4)`);
  }

  if (skill.position && !VALID_POSITIONS.includes(skill.position)) {
    errs.push(`${prefix} "position" inválida: "${skill.position}" (válidos: ${VALID_POSITIONS.join(', ')})`);
  }

  if (skill.requirements && typeof skill.requirements === 'object') {
    Object.keys(skill.requirements).forEach(key => {
      if (!ATTRIBUTE_KEYS.includes(key)) {
        errs.push(`${prefix} requirement desconhecido: "${key}"`);
      }
    });
  }

  if (skill.attacks && !Array.isArray(skill.attacks)) {
    errs.push(`${prefix} "attacks" deve ser um array`);
  }

  return errs;
}

/**
 * Validate a single item object against item-import-v1 schema
 * @param {object} item - Item data
 * @param {number} index - Index for error messages
 * @returns {string[]} Array of error messages (empty = valid)
 */
export function validateItem(item, index = 0) {
  const errs = [];
  const prefix = `[${index}]`;

  if (!item || typeof item !== 'object') {
    return [`${prefix} Não é um objeto válido`];
  }

  if (!item.name || typeof item.name !== 'string') {
    errs.push(`${prefix} "name" é obrigatório`);
  }

  if (item.type && !VALID_ITEM_TYPES.includes(item.type)) {
    errs.push(`${prefix} "type" inválido: "${item.type}" (válidos: ${VALID_ITEM_TYPES.join(', ')})`);
  }

  if (item.rarity && !VALID_RARITIES.includes(item.rarity)) {
    errs.push(`${prefix} "rarity" inválida: "${item.rarity}" (válidos: ${VALID_RARITIES.join(', ')})`);
  }

  if (item.weight_class && !VALID_WEIGHT_CLASSES.includes(item.weight_class)) {
    errs.push(`${prefix} "weight_class" inválido: "${item.weight_class}" (válidos: ${VALID_WEIGHT_CLASSES.join(', ')})`);
  }

  if (item.price !== undefined && (typeof item.price !== 'number' || item.price < 0)) {
    errs.push(`${prefix} "price" deve ser um número >= 0`);
  }

  if (item.defense_bonus !== undefined && typeof item.defense_bonus !== 'number') {
    errs.push(`${prefix} "defense_bonus" deve ser um número`);
  }

  if (item.dodge_penalty !== undefined && typeof item.dodge_penalty !== 'number') {
    errs.push(`${prefix} "dodge_penalty" deve ser um número`);
  }

  if (item.attributes && typeof item.attributes === 'object') {
    Object.keys(item.attributes).forEach(key => {
      if (!ATTRIBUTE_KEYS.includes(key)) {
        errs.push(`${prefix} atributo desconhecido: "${key}"`);
      }
    });
  }

  return errs;
}

/**
 * Parse and validate a JSON import payload
 * Accepts: array of objects OR { "$schema": "...", "data": [...] }
 * @param {string} jsonString - Raw JSON string
 * @param {'skills'|'items'} type - What to validate
 * @returns {{ records: object[], errors: string[], valid: boolean }}
 */
export function parseAndValidate(jsonString, type) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { records: [], errors: [`JSON inválido: ${e.message}`], valid: false };
  }

  // Unwrap schema wrapper: { "$schema": "...", "data": [...] }
  let records;
  if (Array.isArray(parsed)) {
    records = parsed;
  } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.data)) {
    records = parsed.data;
  } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    // Single object → wrap in array
    records = [parsed];
  } else {
    return { records: [], errors: ['Formato inválido: esperado array ou objeto com "data"'], valid: false };
  }

  if (records.length === 0) {
    return { records: [], errors: ['Ficheiro vazio: nenhum registo encontrado'], valid: false };
  }

  if (records.length > 500) {
    return { records: [], errors: [`Demasiados registos: ${records.length} (máximo: 500)`], valid: false };
  }

  const validator = type === 'skills' ? validateSkill : validateItem;
  const errors = [];

  records.forEach((record, idx) => {
    const recordErrors = validator(record, idx);
    errors.push(...recordErrors);
  });

  return {
    records,
    errors,
    valid: errors.length === 0,
  };
}
