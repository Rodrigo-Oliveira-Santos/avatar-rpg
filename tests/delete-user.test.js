/**
 * Tests for `deleteUser` in users-registry.
 *
 * Per-app accounts (post 2026-06-30): `deleteUser(username)` defaults
 * to app='avatar' and ONLY touches Avatar data. `app: 'all'` opts
 * into the cross-app cascade used by the landing admin.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupLocalStorage } from './helpers.js';

vi.mock('../public/js/api/config.js', () => ({
  getConfig: () => ({ useSupabase: false }),
  isSupabaseEnabled: () => false,
}));

vi.mock('../public/js/api/supabase-client.js', () => ({
  getSupabaseClient: () => Promise.reject(new Error('disabled')),
}));

import {
  STORAGE_KEY,
  APP_REGISTRY_KEYS,
  deleteUser,
  validateDeleteUser,
  getUsers,
  readRegistry,
  writeRegistry,
  readAppRegistry,
  writeAppRegistry,
} from '../public/js/games/lib/users-registry.js';

function seedRichLocalStorage() {
  // Per-app registries: same user appears in all three apps with
  // potentially-different roles (the whole point of the split).
  writeAppRegistry('avatar', {
    aang: { role: 'player', created_at: '2026-01-01' },
    admin: { role: 'admin', created_at: '2026-01-01' },
    katara: { role: 'player', created_at: '2026-01-01' },
  });
  writeAppRegistry('dnd', {
    aang: { role: 'player', created_at: '2026-01-01' },
    admin: { role: 'admin', created_at: '2026-01-01' },
    katara: { role: 'player', created_at: '2026-01-01' },
  });
  writeAppRegistry('mc', {
    aang: { role: 'player', created_at: '2026-01-01' },
    admin: { role: 'admin', created_at: '2026-01-01' },
    katara: { role: 'player', created_at: '2026-01-01' },
  });
  // Avatar character
  localStorage.setItem('avatar_rpg_character_aang', JSON.stringify({ identidade: { nome: 'Aang' } }));
  // D&D character + secondary characters-only registry
  localStorage.setItem('dnd_character_aang', JSON.stringify({ identity: { name: 'Aang' } }));
  localStorage.setItem('dnd_characters_registry', JSON.stringify({
    aang: { role: 'player' },
    katara: { role: 'player' },
  }));
  // MC builds: 2 by aang, 1 by katara
  localStorage.setItem('mc_builds', JSON.stringify([
    { id: 'b1', owner_username: 'aang', title: 'Castle' },
    { id: 'b2', owner_username: 'aang', title: 'Farm' },
    { id: 'b3', owner_username: 'katara', title: 'Igloo' },
  ]));
  // Reactions: aang reacted to b1 and b3; katara reacted to b1
  localStorage.setItem('mc_reactions', JSON.stringify({
    b1: { aang: 'like', katara: 'dislike' },
    b3: { aang: 'like' },
  }));
  // Aang's MC lists
  localStorage.setItem('mc_lists_aang', JSON.stringify([
    { id: 'list-1', name: 'Favs', build_ids: ['b1', 'b3'] },
  ]));
  // Sessions: aang logged into D&D and MC; admin into Avatar
  localStorage.setItem('avatar_rpg_user', JSON.stringify({ username: 'admin', role: 'admin' }));
  localStorage.setItem('dnd_user', JSON.stringify({ username: 'aang', role: 'player' }));
  localStorage.setItem('mc_user', JSON.stringify({ username: 'aang', role: 'player' }));
}

beforeEach(() => {
  setupLocalStorage();
});

describe('validateDeleteUser', () => {
  beforeEach(() => { getUsers(); });

  it('rejects empty username', () => {
    expect(validateDeleteUser({ username: '', actor: { username: 'admin' } }).allowed).toBe(false);
  });

  it('rejects self-delete', () => {
    const r = validateDeleteUser({ username: 'admin', actor: { username: 'admin' } });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/própria/i);
  });

  it('rejects last admin', () => {
    // default seed has exactly 1 admin
    const r = validateDeleteUser({ username: 'admin', actor: { username: 'someone' } });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/pelo menos 1 admin/);
  });

  it('allows deleting another admin if there are 2+ admins', () => {
    const reg = readRegistry();
    reg.admin2 = { role: 'admin', created_at: new Date().toISOString() };
    writeRegistry(reg);
    expect(validateDeleteUser({ username: 'admin2', actor: { username: 'admin' } }).allowed).toBe(true);
  });

  it('allows deleting a regular player', () => {
    expect(validateDeleteUser({ username: 'aang', actor: { username: 'admin' } }).allowed).toBe(true);
  });
});

describe('deleteUser — Avatar only (default scope)', () => {
  beforeEach(() => {
    seedRichLocalStorage();
  });

  it('removes only the Avatar registry entry', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    const avatarReg = readAppRegistry('avatar');
    expect(avatarReg.aang).toBeUndefined();
    expect(avatarReg.katara).toBeDefined();
    // D&D and MC registries untouched.
    expect(readAppRegistry('dnd').aang).toBeDefined();
    expect(readAppRegistry('mc').aang).toBeDefined();
  });

  it('removes the Avatar character but leaves the D&D character', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    expect(localStorage.getItem('avatar_rpg_character_aang')).toBeNull();
    expect(localStorage.getItem('dnd_character_aang')).not.toBeNull();
  });

  it('leaves MC builds + lists + reactions intact', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    const builds = JSON.parse(localStorage.getItem('mc_builds'));
    expect(builds.map((b) => b.id)).toEqual(['b1', 'b2', 'b3']);
    expect(localStorage.getItem('mc_lists_aang')).not.toBeNull();
  });

  it('only clears the Avatar session for the deleted user (Avatar session belongs to admin → untouched)', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    // Avatar session is admin's — untouched
    expect(JSON.parse(localStorage.getItem('avatar_rpg_user'))?.username).toBe('admin');
    // D&D / MC sessions stay because deleteUser was Avatar-scoped.
    expect(JSON.parse(localStorage.getItem('dnd_user'))?.username).toBe('aang');
    expect(JSON.parse(localStorage.getItem('mc_user'))?.username).toBe('aang');
  });

  it('returns a per-app summary with the Avatar slice populated', async () => {
    const res = await deleteUser('aang', { actor: { username: 'admin' } });
    expect(res.ok).toBe(true);
    expect(res.removed.avatar.registry).toBe(true);
    expect(res.removed.avatar.avatarCharacter).toBe(true);
    // Other apps not present in the summary because they weren't touched.
    expect(res.removed.dnd).toBeUndefined();
    expect(res.removed.mc).toBeUndefined();
  });

  it('refuses when validation fails (self-delete)', async () => {
    const res = await deleteUser('admin', { actor: { username: 'admin' } });
    expect(res.ok).toBe(false);
    expect(res.removed).toBeNull();
    expect(readAppRegistry('avatar').admin).toBeDefined();
  });

  it('refuses when target is the last admin in the Avatar registry', async () => {
    const res = await deleteUser('admin', { actor: { username: 'aang' } });
    expect(res.ok).toBe(false);
  });

  it('is safe to call for a user with no associated Avatar data', async () => {
    writeAppRegistry('avatar', {
      lonely: { role: 'player', created_at: '2026-01-01' },
      admin: { role: 'admin', created_at: '2026-01-01' },
    });
    const res = await deleteUser('lonely', { actor: { username: 'admin' } });
    expect(res.ok).toBe(true);
    expect(res.removed.avatar.registry).toBe(true);
    expect(res.removed.avatar.avatarCharacter).toBe(false);
  });
});

describe('deleteUser — explicit per-app scopes', () => {
  beforeEach(() => { seedRichLocalStorage(); });

  it('app: "dnd" removes D&D character + dnd registry only', async () => {
    const res = await deleteUser('aang', { actor: { username: 'admin' }, app: 'dnd' });
    expect(res.ok).toBe(true);
    expect(localStorage.getItem('dnd_character_aang')).toBeNull();
    expect(readAppRegistry('dnd').aang).toBeUndefined();
    // Other apps untouched.
    expect(localStorage.getItem('avatar_rpg_character_aang')).not.toBeNull();
    expect(readAppRegistry('avatar').aang).toBeDefined();
    expect(readAppRegistry('mc').aang).toBeDefined();
    // D&D session was aang → cleared.
    expect(localStorage.getItem('dnd_user')).toBeNull();
    // MC session was also aang → stays.
    expect(localStorage.getItem('mc_user')).not.toBeNull();
  });

  it('app: "mc" removes MC builds + reactions + lists + mc registry only', async () => {
    const res = await deleteUser('aang', { actor: { username: 'admin' }, app: 'mc' });
    expect(res.ok).toBe(true);
    const builds = JSON.parse(localStorage.getItem('mc_builds'));
    expect(builds.map((b) => b.id)).toEqual(['b3']);
    expect(localStorage.getItem('mc_lists_aang')).toBeNull();
    expect(readAppRegistry('mc').aang).toBeUndefined();
    // Avatar + D&D untouched.
    expect(readAppRegistry('avatar').aang).toBeDefined();
    expect(readAppRegistry('dnd').aang).toBeDefined();
    expect(localStorage.getItem('avatar_rpg_character_aang')).not.toBeNull();
    expect(localStorage.getItem('dnd_character_aang')).not.toBeNull();
  });
});

describe('deleteUser — cross-app cascade (app: "all")', () => {
  beforeEach(() => { seedRichLocalStorage(); });

  it('wipes every app slice in one call', async () => {
    const res = await deleteUser('aang', { actor: { username: 'admin' }, app: 'all' });
    expect(res.ok).toBe(true);

    // Registries
    expect(readAppRegistry('avatar').aang).toBeUndefined();
    expect(readAppRegistry('dnd').aang).toBeUndefined();
    expect(readAppRegistry('mc').aang).toBeUndefined();
    expect(readAppRegistry('avatar').katara).toBeDefined(); // others intact

    // Avatar / D&D characters
    expect(localStorage.getItem('avatar_rpg_character_aang')).toBeNull();
    expect(localStorage.getItem('dnd_character_aang')).toBeNull();

    // MC: own builds gone, others stay
    const builds = JSON.parse(localStorage.getItem('mc_builds'));
    expect(builds.map((b) => b.id)).toEqual(['b3']);
    expect(localStorage.getItem('mc_lists_aang')).toBeNull();

    // Sessions
    expect(localStorage.getItem('dnd_user')).toBeNull();
    expect(localStorage.getItem('mc_user')).toBeNull();
    expect(JSON.parse(localStorage.getItem('avatar_rpg_user'))?.username).toBe('admin');
  });

  it('returns a per-app summary with all three slices populated', async () => {
    const res = await deleteUser('aang', { actor: { username: 'admin' }, app: 'all' });
    expect(res.ok).toBe(true);
    expect(res.removed.avatar.registry).toBe(true);
    expect(res.removed.dnd.registry).toBe(true);
    expect(res.removed.mc.registry).toBe(true);
    expect(res.removed.mc.mcBuilds).toBe(2);
  });

  it('refuses when target is the last admin in any app', async () => {
    const res = await deleteUser('admin', { actor: { username: 'aang' }, app: 'all' });
    expect(res.ok).toBe(false);
  });
});
