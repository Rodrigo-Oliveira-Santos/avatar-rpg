/**
 * Tests for the shared users-registry module (cross-app role
 * management).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupLocalStorage } from './helpers.js';

import {
  STORAGE_KEY,
  MAX_ADMINS,
  readRegistry,
  writeRegistry,
  getUsers,
  getActiveSessions,
  hasAnyAdminSession,
  getCurrentAdmin,
  validateRoleChange,
  applyRoleChange,
  getActionsFor,
  normalizeRole,
} from '../public/js/games/lib/users-registry.js';

beforeEach(() => {
  setupLocalStorage();
});

describe('users-registry — seeding & basic reads', () => {
  it('seeds defaults on first read', () => {
    const users = getUsers();
    expect(users.length).toBeGreaterThan(0);
    const usernames = users.map((u) => u.username);
    expect(usernames).toContain('admin');
    expect(usernames).toContain('gm');
    expect(usernames).toContain('aang');
  });

  it('sorts admins first, then gm, then players', () => {
    const users = getUsers();
    const roles = users.map((u) => u.role);
    // First admin should appear before first player
    const firstAdminIdx = roles.indexOf('admin');
    const firstPlayerIdx = roles.indexOf('player');
    expect(firstAdminIdx).toBeLessThan(firstPlayerIdx);
  });

  it('includes extras passed in (e.g. owners of fichas)', () => {
    const users = getUsers(['novaUser']);
    expect(users.map((u) => u.username)).toContain('novauser');
  });

  it('normalizes unknown roles to player', () => {
    expect(normalizeRole('badrole')).toBe('player');
    expect(normalizeRole('admin')).toBe('admin');
  });
});

describe('users-registry — active sessions', () => {
  it('detects all 4 session keys (avatar, dnd, mc, landing)', () => {
    localStorage.setItem('avatar_rpg_user', JSON.stringify({ username: 'aang', role: 'player' }));
    localStorage.setItem('dnd_user', JSON.stringify({ username: 'admin', role: 'admin' }));
    localStorage.setItem('mc_user', JSON.stringify({ username: 'zuko', role: 'player' }));
    localStorage.setItem('landing_user', JSON.stringify({ username: 'gm', role: 'gm' }));

    const sessions = getActiveSessions();
    expect(sessions).toHaveLength(4);
    expect(sessions.map((s) => s.app)).toEqual(expect.arrayContaining(['avatar', 'dnd', 'mc', 'landing']));
  });

  it('hasAnyAdminSession returns true when any session has admin role', () => {
    expect(hasAnyAdminSession()).toBe(false);
    localStorage.setItem('mc_user', JSON.stringify({ username: 'admin', role: 'admin' }));
    expect(hasAnyAdminSession()).toBe(true);
  });

  it('hasAnyAdminSession picks up landing_user as well', () => {
    expect(hasAnyAdminSession()).toBe(false);
    localStorage.setItem('landing_user', JSON.stringify({ username: 'admin', role: 'admin' }));
    expect(hasAnyAdminSession()).toBe(true);
  });

  it('getCurrentAdmin returns the first admin session found', () => {
    expect(getCurrentAdmin()).toBeNull();
    localStorage.setItem('dnd_user', JSON.stringify({ username: 'admin', role: 'admin' }));
    expect(getCurrentAdmin()?.username).toBe('admin');
  });
});

describe('users-registry — role change validation', () => {
  beforeEach(() => {
    getUsers(); // seed
  });

  it('rejects same-role transitions', () => {
    const r = validateRoleChange({
      username: 'aang', fromRole: 'player', toRole: 'player', actor: { username: 'admin' },
    });
    expect(r.allowed).toBe(false);
  });

  it('player can only promote to gm', () => {
    const ok = validateRoleChange({ username: 'aang', fromRole: 'player', toRole: 'gm', actor: { username: 'admin' } });
    expect(ok.allowed).toBe(true);
    const bad = validateRoleChange({ username: 'aang', fromRole: 'player', toRole: 'admin', actor: { username: 'admin' } });
    expect(bad.allowed).toBe(false);
  });

  it('gm can promote to admin or demote to player', () => {
    const up = validateRoleChange({ username: 'gm', fromRole: 'gm', toRole: 'admin', actor: { username: 'admin' } });
    expect(up.allowed).toBe(true);
    const down = validateRoleChange({ username: 'gm', fromRole: 'gm', toRole: 'player', actor: { username: 'admin' } });
    expect(down.allowed).toBe(true);
  });

  it('admin can only be demoted to gm', () => {
    // seed: precisa de pelo menos 2 admins, senão regra "min 1 admin" bloqueia
    const reg = readRegistry();
    reg.admin2 = { role: 'admin', created_at: new Date().toISOString() };
    writeRegistry(reg);

    const ok = validateRoleChange({ username: 'admin2', fromRole: 'admin', toRole: 'gm', actor: { username: 'admin' } });
    expect(ok.allowed).toBe(true);
    const bad = validateRoleChange({ username: 'admin2', fromRole: 'admin', toRole: 'player', actor: { username: 'admin' } });
    expect(bad.allowed).toBe(false);
  });

  it('actor cannot demote themselves', () => {
    const r = validateRoleChange({
      username: 'admin', fromRole: 'admin', toRole: 'gm', actor: { username: 'admin' },
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/própria/i);
  });

  it('enforces MAX_ADMINS', () => {
    // Bring admin count to MAX_ADMINS
    const reg = readRegistry();
    let i = 0;
    while (Object.values(reg).filter((e) => e.role === 'admin').length < MAX_ADMINS) {
      reg[`extra-admin-${i++}`] = { role: 'admin', created_at: new Date().toISOString() };
    }
    reg.bob = { role: 'gm', created_at: new Date().toISOString() };
    writeRegistry(reg);

    const r = validateRoleChange({ username: 'bob', fromRole: 'gm', toRole: 'admin', actor: { username: 'admin' } });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/3 contas admin/);
  });

  it('refuses to demote last admin', () => {
    // default registry has exactly 1 admin
    const r = validateRoleChange({ username: 'admin', fromRole: 'admin', toRole: 'gm', actor: { username: 'other' } });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/pelo menos 1 admin/);
  });
});

describe('users-registry — applyRoleChange', () => {
  beforeEach(() => {
    getUsers(); // seed
  });

  it('persists role change in registry', () => {
    const res = applyRoleChange({
      username: 'aang', fromRole: 'player', toRole: 'gm', actor: { username: 'admin' },
    });
    expect(res.ok).toBe(true);
    const reg = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(reg.aang.role).toBe('gm');
  });

  it('returns reason and skips write on invalid change', () => {
    const before = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const res = applyRoleChange({
      username: 'aang', fromRole: 'player', toRole: 'admin', actor: { username: 'admin' },
    });
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/Jogadores só podem/);
    const after = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(after).toEqual(before);
  });

  it('syncs all active sessions with the same username', () => {
    localStorage.setItem('avatar_rpg_user', JSON.stringify({ username: 'aang', role: 'player' }));
    localStorage.setItem('dnd_user', JSON.stringify({ username: 'aang', role: 'player' }));
    localStorage.setItem('mc_user', JSON.stringify({ username: 'somebody-else', role: 'player' }));
    localStorage.setItem('landing_user', JSON.stringify({ username: 'aang', role: 'player' }));

    applyRoleChange({ username: 'aang', fromRole: 'player', toRole: 'gm', actor: { username: 'admin' } });

    expect(JSON.parse(localStorage.getItem('avatar_rpg_user')).role).toBe('gm');
    expect(JSON.parse(localStorage.getItem('dnd_user')).role).toBe('gm');
    expect(JSON.parse(localStorage.getItem('landing_user')).role).toBe('gm');
    // outras sessões intactas
    expect(JSON.parse(localStorage.getItem('mc_user')).role).toBe('player');
  });
});

describe('users-registry — getActionsFor', () => {
  it('player → promote to gm', () => {
    expect(getActionsFor('player')).toEqual([{ label: 'Promover a GM', toRole: 'gm', variant: 'gm' }]);
  });

  it('gm → both promote and demote', () => {
    const actions = getActionsFor('gm');
    expect(actions).toHaveLength(2);
    expect(actions.map((a) => a.toRole).sort()).toEqual(['admin', 'player']);
  });

  it('admin → only demote', () => {
    expect(getActionsFor('admin')).toEqual([{ label: 'Rebaixar a GM', toRole: 'gm', variant: 'danger' }]);
  });

  it('unknown role → no actions', () => {
    expect(getActionsFor('alien')).toEqual([]);
  });
});
