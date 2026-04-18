/**
 * Skill Data Loader
 * Loads skill JSON files from data/skills/
 */

const SKILL_PATHS = {
  fire: '/data/skills/fire.json',
  water: '/data/skills/water.json',
  earth: '/data/skills/earth.json',
  air: '/data/skills/air.json',
  none: '/data/skills/none.json',
};

/**
 * Load skills for a specific element
 * @param {string} element - Element name
 * @returns {Promise<object>} Skill data
 */
export async function loadSkills(element) {
  const path = SKILL_PATHS[element];
  if (!path) {
    throw new Error(`Unknown element: ${element}`);
  }

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`[Skills] Failed to load ${element}:`, err);
    return { skills: [], error: err.message };
  }
}

/**
 * Load all skills for all elements
 * @returns {Promise<object>} All skill data
 */
export async function loadAllSkills() {
  const results = {};

  for (const [element, path] of Object.entries(SKILL_PATHS)) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        results[element] = await response.json();
      } else {
        console.warn(`[Skills] No data for ${element}`);
        results[element] = { skills: [] };
      }
    } catch (err) {
      console.warn(`[Skills] Error loading ${element}:`, err);
      results[element] = { skills: [], error: err.message };
    }
  }

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
