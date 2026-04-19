/**
 * Skill Data Loader
 * Loads skills from API (/api/skills/:element)
 */

import { getSkills } from '../api/skills.js';

/**
 * Load skills for a specific element
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
    return { skills: Array.isArray(skills) ? skills : [] };
  } catch (err) {
    console.warn(`[Skills] Failed to load ${element} from API:`, err.message);
    return { skills: [], error: err.message };
  }
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
