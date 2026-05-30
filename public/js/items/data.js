/**
 * Items Data Loader
 * Loads items from API or falls back to local mock data
 */

import { listAll } from '../api/items.js';
import { MOCK_ITEMS } from './mock-data.js';

/**
 * Load all available items from API or mock
 * @returns {Promise<object[]>} Array of items
 */
export async function loadItems() {
  try {
    const items = await listAll();
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
  } catch (err) {
    console.warn('[Items] API unavailable:', err.message);
  }

  // Fallback to mock data
  return MOCK_ITEMS;
}
