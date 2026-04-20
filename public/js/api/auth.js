/**
 * Auth API
 */

import { post, get } from './client.js';

/**
 * BYPASS TEMPORÁRIO: Login só com username (reverter: restaurar versão original abaixo)
 * @param {string} username
 * @returns {Promise<{token: string, user: object}>}
 */
export function login(username) {
  return post('/api/auth/login', { username });
}

/* BYPASS TEMPORÁRIO: função original comentada (reverter: descomentar e apagar a de cima)
export function login(username, password) {
  return post('/api/auth/login', { username, password });
}
*/

/**
 * Logout current user
 */
export function logout() {
  return post('/api/auth/logout', {});
}

/**
 * Get current authenticated user
 * @returns {Promise<{id: string, username: string, role: string}>}
 */
export function getMe() {
  return get('/api/auth/me');
}
