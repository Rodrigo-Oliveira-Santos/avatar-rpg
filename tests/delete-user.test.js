/**
 * Tests for `deleteUser` cascade in users-registry.
 *
 * Modo local apenas — verifica que apaga ficha Avatar, ficha D&D,
 * builds MC, reactions MC, listas MC, sessões activas e remove a
 * entry no registry.
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
  deleteUser,
  validateDeleteUser,
  getUsers,
  readRegistry,
  writeRegistry,
} from '../public/js/games/lib/users-registry.js';

function seedRichLocalStorage() {
  // Registry com o target + admin + outro user
  writeRegistry({
    aang: { role: 'player', created_at: '2026-01-01' },
    admin: { role: 'admin', created_at: '2026-01-01' },
    katara: { role: 'player', created_at: '2026-01-01' },
  });
  // Ficha Avatar
  localStorage.setItem('avatar_rpg_character_aang', JSON.stringify({ identidade: { nome: 'Aang' } }));
  // Ficha D&D + registry
  localStorage.setItem('dnd_character_aang', JSON.stringify({ identity: { name: 'Aang' } }));
  localStorage.setItem('dnd_characters_registry', JSON.stringify({
    aang: { role: 'player' },
    katara: { role: 'player' },
  }));
  // Builds MC: 2 do aang, 1 do katara
  localStorage.setItem('mc_builds', JSON.stringify([
    { id: 'b1', owner_username: 'aang', title: 'Castle' },
    { id: 'b2', owner_username: 'aang', title: 'Farm' },
    { id: 'b3', owner_username: 'katara', title: 'Igloo' },
  ]));
  // Reactions: aang reagiu a b1 e b3; katara reagiu a b1
  localStorage.setItem('mc_reactions', JSON.stringify({
    b1: { aang: 'like', katara: 'dislike' },
    b3: { aang: 'like' },
  }));
  // Lists MC do aang
  localStorage.setItem('mc_lists_aang', JSON.stringify([
    { id: 'list-1', name: 'Favs', build_ids: ['b1', 'b3'] },
  ]));
  // Sessões: aang em D&D e MC; admin em Avatar
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

describe('deleteUser — cascade local', () => {
  beforeEach(() => {
    seedRichLocalStorage();
  });

  it('removes the registry entry', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    const reg = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(reg.aang).toBeUndefined();
    expect(reg.katara).toBeDefined(); // outros intactos
  });

  it('removes Avatar character', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    expect(localStorage.getItem('avatar_rpg_character_aang')).toBeNull();
  });

  it('removes D&D character + registry entry', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    expect(localStorage.getItem('dnd_character_aang')).toBeNull();
    const dndReg = JSON.parse(localStorage.getItem('dnd_characters_registry'));
    expect(dndReg.aang).toBeUndefined();
    expect(dndReg.katara).toBeDefined();
  });

  it('removes all MC builds owned by the user', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    const builds = JSON.parse(localStorage.getItem('mc_builds'));
    const ids = builds.map((b) => b.id);
    expect(ids).not.toContain('b1');
    expect(ids).not.toContain('b2');
    expect(ids).toContain('b3'); // katara's
  });

  it('removes user reactions across all builds, and reactions on deleted builds disappear too', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    const reactions = JSON.parse(localStorage.getItem('mc_reactions'));
    // b1 era do aang → build apagada, todas as reactions de b1 desaparecem
    // (incluindo a da katara — é correcto: a build já não existe)
    expect(reactions.b1).toBeUndefined();
    // b3 era da katara → continua a existir, mas sem reaction do aang
    expect(reactions.b3 == null || Object.keys(reactions.b3).length === 0).toBe(true);
  });

  it('removes MC lists key', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    expect(localStorage.getItem('mc_lists_aang')).toBeNull();
  });

  it('clears active sessions of the deleted user', async () => {
    await deleteUser('aang', { actor: { username: 'admin' } });
    expect(localStorage.getItem('dnd_user')).toBeNull();
    expect(localStorage.getItem('mc_user')).toBeNull();
    // sessão do admin não toca
    expect(JSON.parse(localStorage.getItem('avatar_rpg_user'))?.username).toBe('admin');
  });

  it('returns a summary with counters', async () => {
    const res = await deleteUser('aang', { actor: { username: 'admin' } });
    expect(res.ok).toBe(true);
    expect(res.removed.registry).toBe(true);
    expect(res.removed.avatarCharacter).toBe(true);
    expect(res.removed.dndCharacter).toBe(true);
    expect(res.removed.mcBuilds).toBe(2);
    // mcReactions só conta as reactions removidas pela passagem dedicada
    // (b3). As reactions em b1 desaparecem antes, junto com a build.
    expect(res.removed.mcReactions).toBeGreaterThanOrEqual(1);
    expect(res.removed.mcLists).toBe(true);
    expect(res.removed.sessions).toBe(2);
  });

  it('refuses when validation fails (self-delete)', async () => {
    const res = await deleteUser('admin', { actor: { username: 'admin' } });
    expect(res.ok).toBe(false);
    expect(res.removed).toBeNull();
    // registry intacto
    const reg = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(reg.admin).toBeDefined();
  });

  it('refuses when target is last admin', async () => {
    const res = await deleteUser('admin', { actor: { username: 'aang' } });
    expect(res.ok).toBe(false);
  });

  it('is safe to call for a user with no associated data', async () => {
    // Seeds only registry, no character/builds/lists
    writeRegistry({
      lonely: { role: 'player', created_at: '2026-01-01' },
      admin: { role: 'admin', created_at: '2026-01-01' },
    });
    const res = await deleteUser('lonely', { actor: { username: 'admin' } });
    expect(res.ok).toBe(true);
    expect(res.removed.registry).toBe(true);
    expect(res.removed.avatarCharacter).toBe(false);
    expect(res.removed.dndCharacter).toBe(false);
    expect(res.removed.mcBuilds).toBe(0);
  });
});
