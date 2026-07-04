/**
 * Import Storage
 * Persists imported skills and items in localStorage
 */

const SKILLS_PREFIX = 'avatar_rpg_imported_skills_';
const ITEMS_KEY = 'avatar_rpg_imported_items';

/**
 * Save imported skills for an element
 * @param {string} element - Element name (fire, water, earth, air, none)
 * @param {object[]} skills - Array of skill objects
 */
export function saveImportedSkills(element, skills) {
  const key = `${SKILLS_PREFIX}${element}`;
  const existing = getImportedSkills(element);
  // Merge by name (upsert)
  const merged = [...existing];
  skills.forEach(skill => {
    const idx = merged.findIndex(s => s.name === skill.name);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], ...skill };
    } else {
      merged.push(skill);
    }
  });
  localStorage.setItem(key, JSON.stringify(merged));
  return merged.length;
}

/**
 * Get imported skills for an element
 * @param {string} element - Element name
 * @returns {object[]} Array of skill objects
 */
export function getImportedSkills(element) {
  const key = `${SKILLS_PREFIX}${element}`;
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

/**
 * Check if any imported skills exist for an element
 * @param {string} element - Element name
 * @returns {boolean}
 */
export function hasImportedSkills(element) {
  return getImportedSkills(element).length > 0;
}

/**
 * Save imported items (merges by name)
 * @param {object[]} items - Array of item objects
 * @returns {number} Total items after merge
 */
export function saveImportedItems(items) {
  const existing = getImportedItems();
  const merged = [...existing];
  items.forEach(item => {
    const idx = merged.findIndex(i => i.name === item.name);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], ...item };
    } else {
      merged.push(item);
    }
  });
  localStorage.setItem(ITEMS_KEY, JSON.stringify(merged));
  return merged.length;
}

/**
 * Replace the entire imported-items store. Used by the in-memory CRUD
 * path in `api/items.js` when Supabase is off.
 *
 * @param {object[]} items
 * @returns {number} total items after the write
 */
export function setImportedItems(items) {
  const safe = Array.isArray(items) ? items : [];
  localStorage.setItem(ITEMS_KEY, JSON.stringify(safe));
  return safe.length;
}

/**
 * Get all imported items
 * @returns {object[]} Array of item objects
 */
export function getImportedItems() {
  try {
    return JSON.parse(localStorage.getItem(ITEMS_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Check if any imported items exist
 * @returns {boolean}
 */
export function hasImportedItems() {
  return getImportedItems().length > 0;
}

/**
 * Clear imported data
 * @param {'skills'|'items'|'all'} type - What to clear
 * @param {string} [element] - Element to clear (only for skills)
 */
export function clearImported(type, element) {
  if (type === 'items' || type === 'all') {
    localStorage.removeItem(ITEMS_KEY);
  }
  if (type === 'skills' || type === 'all') {
    if (element) {
      localStorage.removeItem(`${SKILLS_PREFIX}${element}`);
    } else {
      ['fire', 'water', 'earth', 'air', 'none'].forEach(el => {
        localStorage.removeItem(`${SKILLS_PREFIX}${el}`);
      });
    }
  }
}

/**
 * Get import statistics
 * @returns {{ skills: object, items: number }}
 */
export function getImportStats() {
  const elements = ['fire', 'water', 'earth', 'air', 'none'];
  const skills = {};
  elements.forEach(el => {
    const count = getImportedSkills(el).length;
    if (count > 0) skills[el] = count;
  });
  return {
    skills,
    items: getImportedItems().length,
  };
}
