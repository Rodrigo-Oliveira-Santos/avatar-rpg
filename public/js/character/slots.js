/**
 * Sub-Skill Slot System
 * Manages available slots for activating sub-skills within unlocked skills
 */

import { GAME } from '../utils/constants.js';

function normalizeSkillDefinitions(skillDefinitions = []) {
  if (Array.isArray(skillDefinitions)) {
    return skillDefinitions.reduce((lookup, skill) => {
      if (skill?.id) lookup[skill.id] = skill;
      return lookup;
    }, {});
  }

  return skillDefinitions || {};
}

function getSubSkillCost(subSkill) {
  const cost = Number(subSkill?.cost);
  return Number.isFinite(cost) && cost > 0 ? cost : 1;
}

function getUsedSlotsForSkill(skillState = {}, skillDefinition = null) {
  const activeSubSkills = Array.isArray(skillState.activeSubSkills)
    ? skillState.activeSubSkills
    : [];

  if (!activeSubSkills.length) return 0;

  // Use stored costs if available (set when activating sub-skills)
  const storedCosts = skillState.subSkillCosts || {};

  if (!skillDefinition?.sub_skills?.length) {
    // Fall back to stored costs, default 1
    return activeSubSkills.reduce((sum, id) => sum + (storedCosts[id] || 1), 0);
  }

  const subSkillLookup = skillDefinition.sub_skills.reduce((lookup, subSkill) => {
    if (subSkill?.id) lookup[subSkill.id] = subSkill;
    return lookup;
  }, {});

  return activeSubSkills.reduce((sum, subSkillId) => {
    return sum + getSubSkillCost(subSkillLookup[subSkillId]);
  }, 0);
}

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
 * @param {array|object} skillDefinitions - Optional skill definitions for cost-aware slot usage
 * @returns {object} { total, used, available }
 */
export function getAvailableSlots(character, skillDefinitions = []) {
  const level = character.identidade?.nivel || 1;
  // Scrolls only affect per-skill caps, not global pool
  const total = calculateBaseSlots(level);
  const skillLookup = normalizeSkillDefinitions(skillDefinitions);

  // Count used slots
  const habilidades = character.habilidades || {};
  const used = Object.entries(habilidades).reduce((sum, [skillId, skillState]) => {
    return sum + getUsedSlotsForSkill(skillState, skillLookup[skillId]);
  }, 0);

  return {
    total,
    used,
    available: total - used,
  };
}
