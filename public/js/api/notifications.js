/**
 * Notifications API
 */

import { get, put } from './client.js';

/**
 * Get current user's notifications
 * @returns {Promise<object[]>}
 */
export function list() {
  return get('/api/notifications');
}

/**
 * Mark a notification as read
 * @param {string} id - Notification ID
 * @returns {Promise<object>}
 */
export function markRead(id) {
  return put(`/api/notifications/${id}`, { is_read: true });
}
