/**
 * Skill Data Loader
 * Loads skills from API, imported data, or falls back to local mock data
 */

import { getSkills } from '../api/skills.js';
import { MOCK_SKILLS } from './mock-data.js';
import { getImportedSkills } from '../import/storage.js';

/**
 * Load skills for a specific element
 * Priority: API > imported (localStorage) > mock data
 * @param {string} element - Element name
 * @returns {Promise<object>} Skill data { skills: [...] }
 */
export async function loadSkills(element) {
  const validElements = ['fire', 'water', 'earth', 'air', 'none'];
  if (!validElements.includes(element)) {
    throw new Error(`Unknown element: ${element}`);
  }

  try {
    const skills = await getSkills(element);
    if (Array.isArray(skills) && skills.length > 0) {
      return { skills };
    }
  } catch (err) {
    console.warn(`[Skills] API unavailable for ${element}:`, err.message);
  }

  // Check for imported data in localStorage
  const imported = getImportedSkills(element);
  if (imported.length > 0) {
    return { skills: imported };
  }

  // Fallback to mock data
  const mockSkills = MOCK_SKILLS[element] || [];
  return { skills: mockSkills };
}

/**
 * Load all skills for all elements
 * @returns {Promise<object>} All skill data keyed by element
 */
export async function loadAllSkills() {
  const elements = ['fire', 'water', 'earth', 'air', 'none'];
  const results = {};

  await Promise.all(elements.map(async (element) => {
    try {
      results[element] = await loadSkills(element);
    } catch {
      results[element] = { skills: [] };
    }
  }));

  return results;
}

/**
 * Get skill by ID from loaded data
 * @param {string} element - Element name
 * @param {string} skillId - Skill identifier
 * @param {object} skillData - Loaded skill data
 * @returns {object|null} Skill object
 */
export function getSkillById(element, skillId, skillData) {
  const data = skillData?.[element]?.skills || [];
  return data.find(s => s.id === skillId) || null;
}
