/**
 * Items Data Loader
 * Loads items from API
 */

import { listAll } from '../api/items.js';

/**
 * Load all available items from API
 * @returns {Promise<object[]>} Array of items
 */
export async function loadItems() {
  try {
    const items = await listAll();
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.warn('[Items] Failed to load from API:', err.message);
    return [];
  }
}
