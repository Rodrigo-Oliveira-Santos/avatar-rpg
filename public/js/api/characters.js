/**
 * Characters API
 */

import { get, post, put, del } from './client.js';

/**
 * List current user's characters
 * @returns {Promise<object[]>}
 */
export function list() {
  return get('/api/characters');
}

/**
 * Create a new character
 * @param {object} data - Character data
 * @returns {Promise<object>}
 */
export function create(data) {
  return post('/api/characters', data);
}

/**
 * Get a character by ID
 * @param {string} id
 * @returns {Promise<object>}
 */
export function getById(id) {
  return get(`/api/characters/${id}`);
}

/**
 * Update a character
 * @param {string} id
 * @param {object} data - Character data
 * @returns {Promise<object>}
 */
export function update(id, data) {
  return put(`/api/characters/${id}`, data);
}

/**
 * Delete a character
 * @param {string} id
 * @returns {Promise<null>}
 */
export function remove(id) {
  return del(`/api/characters/${id}`);
}

/**
 * Get all characters (GM only)
 * @returns {Promise<object[]>}
 */
export function listAll() {
  return get('/api/characters/all');
}
