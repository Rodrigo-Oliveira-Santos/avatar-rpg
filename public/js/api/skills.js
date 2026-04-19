/**
 * Skills API
 */

import { get, post } from './client.js';

/**
 * Get all skills
 * @returns {Promise<object[]>}
 */
export function listAll() {
  return get('/api/skills');
}

/**
 * Get skills for a specific element
 * @param {string} element - Element name (fire, water, earth, air, none)
 * @returns {Promise<object[]>}
 */
export function getSkills(element) {
  return get(`/api/skills/${element}`);
}

/**
 * Import skills from JSON (GM only)
 * @param {object} payload - Import payload { element, skills: [...] }
 * @returns {Promise<object>}
 */
export function importSkills(payload) {
  return post('/api/gm/import', { type: 'skills', ...payload });
}
