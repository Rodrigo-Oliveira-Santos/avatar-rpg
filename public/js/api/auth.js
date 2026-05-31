/**
 * Auth API
 */

// BYPASS TEMPORÁRIO: imports do client comentados (reverter: descomentar e apagar esta linha)
// import { post, get } from './client.js';

const USERS_REGISTRY_KEY = 'avatar_rpg_users_registry';

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

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function readUserRegistry() {
  try {
    const stored = localStorage.getItem(USERS_REGISTRY_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeUserRegistry(registry) {
  localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
}

function ensureUserRegistry() {
  const existingRegistry = readUserRegistry();
  const registry = { ...existingRegistry };
  let changed = false;

  Object.entries(TEST_PROFILES).forEach(([username, profile]) => {
    if (!registry[username]) {
      registry[username] = {
        role: profile.role,
        created_at: new Date().toISOString(),
      };
      changed = true;
      return;
    }

    const role = ['player', 'gm', 'admin'].includes(registry[username]?.role) ? registry[username].role : profile.role;
    const createdAt = registry[username]?.created_at || new Date().toISOString();
    if (registry[username].role !== role || registry[username].created_at !== createdAt) {
      registry[username] = { ...registry[username], role, created_at: createdAt };
      changed = true;
    }
  });

  if (changed) {
    writeUserRegistry(registry);
  }

  return registry;
}

function resolveUser(username) {
  const key = normalizeUsername(username);
  const registry = ensureUserRegistry();
  const profile = TEST_PROFILES[key] || { id: `user-${key}`, username: key, role: 'player' };

  if (!registry[key]) {
    registry[key] = {
      role: profile.role,
      created_at: new Date().toISOString(),
    };
    writeUserRegistry(registry);
  }

  return {
    ...profile,
    username: key,
    role: registry[key]?.role || profile.role,
  };
}

/**
 * BYPASS TEMPORÁRIO: Login mock sem chamar backend
 * Reverter: descomentar função original no final do ficheiro e apagar esta
 */
export function login(username) {
  const user = resolveUser(username);
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
    const sessionUser = JSON.parse(stored);
    const user = resolveUser(sessionUser?.username);
    localStorage.setItem('avatar_rpg_user', JSON.stringify(user));
    return Promise.resolve(user);
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
