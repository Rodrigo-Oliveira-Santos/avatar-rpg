/**
 * Items API
 */

import { get, post } from './client.js';

/**
 * Get all available items
 * @returns {Promise<object[]>}
 */
export function listAll() {
  return get('/api/items');
}

/**
 * Get items available in the shop
 * @returns {Promise<object[]>}
 */
export function getShopItems() {
  return get('/api/items/shop');
}

/**
 * Purchase an item from the shop
 * @param {string} itemId - Item ID
 * @param {string} characterId - Buyer character ID
 * @returns {Promise<object>}
 */
export function purchase(itemId, characterId) {
  return post('/api/shop/purchase', { itemId, characterId });
}

/**
 * Import items from JSON (GM only)
 * @param {object} payload - Import payload { items: [...] }
 * @returns {Promise<object>}
 */
export function importItems(payload) {
  return post('/api/gm/import', { type: 'items', ...payload });
}
