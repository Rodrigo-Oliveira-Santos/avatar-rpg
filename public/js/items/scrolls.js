/**
 * Scroll System
 * Apply scrolls to skills for permanent bonuses
 */

import { getImportedSkills } from '../import/storage.js';
import { log } from '../admin/LogService.js';

const ELEMENTS = ['fire', 'water', 'earth', 'air', 'none'];

function getCharacterData(character) {
  if (typeof character?.serialize === 'function') {
    return character.serialize();
  }

  return JSON.parse(JSON.stringify(character?.getData?.() || character?.data || {}));
}

function getStoredUsername() {
  try {
    return JSON.parse(localStorage.getItem('avatar_rpg_user') || 'null')?.username || 'unknown';
  } catch {
    return 'unknown';
  }
}

function normalizeQuantity(quantity = 1) {
  const parsed = Number.parseInt(quantity, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function consumeInventoryItem(data, itemId, quantity = 1) {
  const itemIndex = data.inventario?.findIndex(item => item.id === itemId);
  if (itemIndex == null || itemIndex === -1) return false;

  const item = data.inventario[itemIndex];
  const normalizedQuantity = normalizeQuantity(quantity);
  if (normalizeQuantity(item.quantity) <= normalizedQuantity) {
    data.inventario.splice(itemIndex, 1);
  } else {
    item.quantity = normalizeQuantity(item.quantity) - normalizedQuantity;
  }

  return true;
}

function formatSkillName(skillId = '') {
  return String(skillId)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getSkillDefinitions() {
  const definitions = new Map();

  // GM-imported overrides win over canonical when both define the same id.
  ELEMENTS.forEach(element => {
    getImportedSkills(element).forEach(skill => {
      if (skill?.id) definitions.set(skill.id, skill);
    });
  });

  // Canonical JSONs ship synchronously via a require-like fetch path is
  // unavailable in this static build; scrolls run in the browser where
  // the SkillTree has already populated `window.__SKILL_DEFINITIONS__`
  // (set by SkillTree on first load). If empty, the formatter fallback
  // takes over via getSkillName().
  const registry = (typeof window !== 'undefined' && window.__SKILL_DEFINITIONS__) || null;
  if (registry instanceof Map) {
    registry.forEach((skill, id) => {
      if (!definitions.has(id)) definitions.set(id, skill);
    });
  }

  return definitions;
}

function getSkillName(skillId, definitions) {
  return definitions.get(skillId)?.name || formatSkillName(skillId);
}

function getScrollValue(scrollItem) {
  const parsed = Number.parseInt(scrollItem?.scrollValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Apply a scroll to a skill
 * @param {object} character - Character instance
 * @param {object} scrollItem - The scroll item from inventory
 * @param {string} skillId - Target skill ID
 * @returns {{ success: boolean, message: string }}
 */
export function applyScroll(character, scrollItem, skillId) {
  if (!scrollItem || scrollItem.type !== 'scroll') {
    return { success: false, message: 'Este item não é um pergaminho válido.' };
  }

  const data = getCharacterData(character);
  const skillState = data.habilidades?.[skillId];
  if (!skillState?.active) {
    return { success: false, message: 'A habilidade alvo tem de estar ativa.' };
  }

  if (!Array.isArray(data.inventario) || !data.inventario.some(item => item.id === scrollItem.id)) {
    return { success: false, message: 'O pergaminho já não está no inventário.' };
  }

  const definitions = getSkillDefinitions();
  const skillName = getSkillName(skillId, definitions);
  let message = '';
  let logDetails = {
    scroll_id: scrollItem.id,
    scroll_name: scrollItem.name,
    scroll_type: scrollItem.scrollType,
    skill_id: skillId,
    skill_name: skillName,
  };

  switch (scrollItem.scrollType) {
    case 'slot_expand': {
      const scrollValue = getScrollValue(scrollItem);
      data.scrolls = data.scrolls || {};
      data.scrolls[skillId] = (data.scrolls[skillId] || 0) + scrollValue;
      logDetails = { ...logDetails, scroll_value: scrollValue, total_slots_bonus: data.scrolls[skillId] };
      message = `Aplicaste ${scrollItem.name} em "${skillName}" (+${scrollValue} slot${scrollValue === 1 ? '' : 's'}).`;
      break;
    }
    case 'mastery':
      if (skillState.mastered) {
        return { success: false, message: 'Esta habilidade já está Dominada.' };
      }
      skillState.mastered = true;
      logDetails = { ...logDetails, mastered: true };
      message = `"${skillName}" foi marcada como Dominada.`;
      break;
    default:
      return { success: false, message: 'Tipo de pergaminho desconhecido.' };
  }

  if (!consumeInventoryItem(data, scrollItem.id, 1)) {
    return { success: false, message: 'Não foi possível consumir o pergaminho.' };
  }

  character.load(data);
  log('scroll_used', logDetails, getStoredUsername());

  return { success: true, message };
}

/**
 * Get skills eligible for a scroll
 * @param {object} character - Character instance
 * @param {object} scrollItem - The scroll item
 * @returns {array} Array of { skillId, skillName } that can receive this scroll
 */
export function getEligibleSkills(character, scrollItem) {
  if (!scrollItem || scrollItem.type !== 'scroll') return [];

  const data = getCharacterData(character);
  const definitions = getSkillDefinitions();

  return Object.entries(data.habilidades || {})
    .filter(([, state]) => state?.active)
    .filter(([, state]) => scrollItem.scrollType !== 'mastery' || !state?.mastered)
    .map(([skillId]) => ({
      skillId,
      skillName: getSkillName(skillId, definitions),
    }))
    .sort((a, b) => a.skillName.localeCompare(b.skillName, 'pt'));
}
