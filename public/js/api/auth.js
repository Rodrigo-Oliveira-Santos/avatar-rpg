/**
 * Auth API
 *
 * Local username-only authentication (no password). When Supabase is enabled
 * we additionally upsert the user into the `users` table so role/elements
 * line up with the DB-backed flows; otherwise we keep state in localStorage.
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';

const USERS_REGISTRY_KEY = 'avatar_users_registry';
const LEGACY_REGISTRY_KEY = 'avatar_rpg_users_registry';

/**
 * Pre-defined test profiles. Mirrors `supabase/seed.sql` so behaviour is
 * consistent across persistence backends.
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
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    }
    // First-time-after-split migration: copy the legacy cross-app
    // registry into the new Avatar-only key so existing installs keep
    // their users without manual intervention. Idempotent — runs only
    // when the new key is still empty.
    const legacy = localStorage.getItem(LEGACY_REGISTRY_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy && typeof parsedLegacy === 'object' && !Array.isArray(parsedLegacy)) {
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(parsedLegacy));
        return parsedLegacy;
      }
    }
    return {};
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

function resolveUserFromLocal(username) {
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
 * Upsert the user row in Supabase and return the persisted profile.
 * If anything fails, callers should fall back to the local resolver.
 */
async function resolveUserFromSupabase(username) {
  const key = normalizeUsername(username);
  const defaultProfile = TEST_PROFILES[key] || { id: `user-${key}`, username: key, role: 'player' };
  const client = await getSupabaseClient();

  const { data: existing, error: lookupErr } = await client
    .from('users')
    .select('id, username, role')
    .eq('username', key)
    .maybeSingle();
  if (lookupErr) throw lookupErr;
  if (existing) return existing;

  const { data: created, error: insertErr } = await client
    .from('users')
    .insert({ username: key, role: defaultProfile.role })
    .select('id, username, role')
    .single();
  if (insertErr) throw insertErr;
  return created;
}

export async function login(username) {
  let user = resolveUserFromLocal(username);

  if (isSupabaseEnabled()) {
    try {
      const remote = await resolveUserFromSupabase(username);
      // Keep the remote role/id authoritative when available.
      user = { ...user, id: remote.id, role: remote.role || user.role };
    } catch (err) {
      console.warn('[auth.login] Supabase user upsert failed, using local profile', err);
    }
  }

  localStorage.setItem('avatar_rpg_user', JSON.stringify(user));
  return { token: 'local-session', user };
}

export async function logout() {
  localStorage.removeItem('avatar_rpg_user');
  return null;
}

export async function getMe() {
  const stored = localStorage.getItem('avatar_rpg_user');
  if (!stored) throw new Error('Sem sessão');

  const sessionUser = JSON.parse(stored);
  const user = resolveUserFromLocal(sessionUser?.username);

  if (isSupabaseEnabled()) {
    try {
      const remote = await resolveUserFromSupabase(sessionUser?.username);
      const merged = { ...user, id: remote.id, role: remote.role || user.role };
      localStorage.setItem('avatar_rpg_user', JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.warn('[auth.getMe] Supabase lookup failed, using local profile', err);
    }
  }

  localStorage.setItem('avatar_rpg_user', JSON.stringify(user));
  return user;
}
