/**
 * Auth API
 */

// BYPASS TEMPORÁRIO: imports do client comentados (reverter: descomentar e apagar esta linha)
// import { post, get } from './client.js';

/**
 * Test profiles for local development
 * Each has a preset role and element
 */
const TEST_PROFILES = {
  admin: { id: 'user-admin', username: 'admin', role: 'admin' },
  gm: { id: 'user-gm', username: 'gm', role: 'gm' },
  zuko: { id: 'user-zuko', username: 'zuko', role: 'player' },
  katara: { id: 'user-katara', username: 'katara', role: 'player' },
  toph: { id: 'user-toph', username: 'toph', role: 'player' },
  aang: { id: 'user-aang', username: 'aang', role: 'player' },
  sokka: { id: 'user-sokka', username: 'sokka', role: 'player' },
};

/**
 * BYPASS TEMPORÁRIO: Login mock sem chamar backend
 * Reverter: descomentar função original no final do ficheiro e apagar esta
 */
export function login(username) {
  const key = username.toLowerCase();
  const profile = TEST_PROFILES[key];
  const user = profile || { id: `user-${key}`, username, role: 'player' };
  localStorage.setItem('avatar_rpg_user', JSON.stringify(user));
  return Promise.resolve({ token: 'bypass-token', user });
}

/**
 * BYPASS TEMPORÁRIO: Logout mock sem chamar backend
 * Reverter: descomentar função original no final do ficheiro e apagar esta
 */
export function logout() {
  localStorage.removeItem('avatar_rpg_user');
  return Promise.resolve();
}

/**
 * BYPASS TEMPORÁRIO: getMe mock sem chamar backend
 * Reverter: descomentar função original no final do ficheiro e apagar esta
 */
export function getMe() {
  const stored = localStorage.getItem('avatar_rpg_user');
  if (stored) {
    return Promise.resolve(JSON.parse(stored));
  }
  return Promise.reject(new Error('Sem sessão'));
}

/* BYPASS TEMPORÁRIO: funções originais comentadas (reverter: descomentar tudo abaixo, apagar as funções mock acima, e descomentar o import do client.js)

import { post, get } from './client.js';

export function login(username) {
  return post('/api/auth/login', { username });
}

export function logout() {
  return post('/api/auth/logout', {});
}

export function getMe() {
  return get('/api/auth/me');
}

*/
