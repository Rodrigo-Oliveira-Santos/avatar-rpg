/**
 * Sub-Skill Slot System
 * Manages available slots for activating sub-skills within unlocked skills
 */

import { GAME } from '../utils/constants.js';

/**
 * Calculate base sub-skill slots for a level
 * @param {number} level - Character level
 * @returns {number} Base slots
 */
export function calculateBaseSlots(level) {
  const bonusSlots = Math.floor((level - 1) / GAME.SUB_SKILL_SLOT_EVERY);
  return GAME.BASE_SUB_SKILL_SLOTS + bonusSlots;
}

/**
 * Calculate total slots including scroll bonuses
 * @param {number} level - Character level
 * @param {number} scrolls - Number of scrolls invested
 * @returns {number} Total slots
 */
export function calculateTotalSlots(level, scrolls = 0) {
  return calculateBaseSlots(level) + scrolls;
}

/**
 * Get slot progression table
 * @returns {array} Array of { level, slots }
 */
export function getSlotProgression() {
  const table = [];
  for (let level = 1; level <= GAME.MAX_LEVEL; level++) {
    table.push({
      level,
      slots: calculateBaseSlots(level),
    });
  }
  return table;
}

/**
 * Validate if sub-skill can be activated
 * @param {object} character - Character object
 * @param {string} skillId - Skill identifier
 * @returns {boolean} Can activate
 */
export function canActivateSubSkill(character, skillId) {
  const skillSlots = character.habilidades?.[skillId]?.activeSubSkills?.length || 0;
  const maxPerSkill = GAME.MAX_SUB_SKILLS_PER_SKILL;

  // Check if scrolls allow exceeding cap
  const scrollsForSkill = character.scrolls?.[skillId] || 0;
  const effectiveCap = maxPerSkill + scrollsForSkill;

  return skillSlots < effectiveCap;
}

/**
 * Get available slots info
 * @param {object} character - Character object
 * @returns {object} { total, used, available }
 */
export function getAvailableSlots(character) {
  const level = character.identidade?.nivel || 1;
  const scrolls = Object.values(character.scrolls || {}).reduce((a, b) => a + b, 0);
  const total = calculateTotalSlots(level, scrolls);

  // Count used slots
  const habilidades = character.habilidades || {};
  const used = Object.values(habilidades).reduce((sum, skill) => {
    return sum + (skill.activeSubSkills?.length || 0);
  }, 0);

  return {
    total,
    used,
    available: total - used,
  };
}
