/**
 * Tests for the Minecraft build transfer API (admin action).
 *
 * Modo local — confirma que `transferBuild` muda o dono e que
 * `transferAllBuildsFromUser` faz bulk + validação de role.
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

import { transferBuild, transferAllBuildsFromUser } from '../public/js/api/mc-builds.js';

function seedBuilds() {
  localStorage.setItem('mc_builds', JSON.stringify([
    { id: 'b1', owner_username: 'aang', owner_id: 'user-aang', title: 'Castle', category: 'survival', tags: [], created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 'b2', owner_username: 'aang', owner_id: 'user-aang', title: 'Farm', category: 'farm', tags: [], created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 'b3', owner_username: 'katara', owner_id: 'user-katara', title: 'Igloo', category: 'survival', tags: [], created_at: '2026-01-01', updated_at: '2026-01-01' },
  ]));
}

function loginAs(username, role = 'admin') {
  localStorage.setItem('mc_user', JSON.stringify({ id: `user-${username}`, username, role }));
}

beforeEach(() => {
  setupLocalStorage();
  seedBuilds();
});

describe('transferBuild', () => {
  it('changes owner_username and owner_id when admin transfers', async () => {
    loginAs('admin', 'admin');
    const res = await transferBuild('b1', 'katara');
    expect(res.ok).toBe(true);

    const all = JSON.parse(localStorage.getItem('mc_builds'));
    const b1 = all.find((b) => b.id === 'b1');
    expect(b1.owner_username).toBe('katara');
    expect(b1.owner_id).toBe('user-katara');
  });

  it('normalizes target username (trim + lowercase)', async () => {
    loginAs('admin', 'admin');
    const res = await transferBuild('b1', '  KaTARA  ');
    expect(res.ok).toBe(true);
    const all = JSON.parse(localStorage.getItem('mc_builds'));
    expect(all.find((b) => b.id === 'b1').owner_username).toBe('katara');
  });

  it('rejects non-admin', async () => {
    loginAs('aang', 'player');
    const res = await transferBuild('b1', 'katara');
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/admin/i);
  });

  it('rejects when not logged in', async () => {
    const res = await transferBuild('b1', 'katara');
    expect(res.ok).toBe(false);
  });

  it('rejects empty destination', async () => {
    loginAs('admin', 'admin');
    const res = await transferBuild('b1', '');
    expect(res.ok).toBe(false);
  });

  it('rejects when build does not exist', async () => {
    loginAs('admin', 'admin');
    const res = await transferBuild('nonexistent', 'katara');
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/não encontrada/i);
  });

  it('rejects when destination is already the owner', async () => {
    loginAs('admin', 'admin');
    const res = await transferBuild('b1', 'aang');
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/já pertence/i);
  });

  it('updates `updated_at` timestamp', async () => {
    loginAs('admin', 'admin');
    const before = JSON.parse(localStorage.getItem('mc_builds')).find((b) => b.id === 'b1').updated_at;
    // tiny wait so timestamps differ
    await new Promise((r) => setTimeout(r, 5));
    await transferBuild('b1', 'katara');
    const after = JSON.parse(localStorage.getItem('mc_builds')).find((b) => b.id === 'b1').updated_at;
    expect(after).not.toBe(before);
  });
});

describe('transferAllBuildsFromUser', () => {
  it('transfers all builds in bulk', async () => {
    loginAs('admin', 'admin');
    const res = await transferAllBuildsFromUser('aang', 'katara');
    expect(res.ok).toBe(true);
    expect(res.transferred).toBe(2);
    expect(res.failed).toBe(0);

    const all = JSON.parse(localStorage.getItem('mc_builds'));
    expect(all.find((b) => b.id === 'b1').owner_username).toBe('katara');
    expect(all.find((b) => b.id === 'b2').owner_username).toBe('katara');
    expect(all.find((b) => b.id === 'b3').owner_username).toBe('katara'); // já era
  });

  it('rejects same source and destination', async () => {
    loginAs('admin', 'admin');
    const res = await transferAllBuildsFromUser('aang', 'aang');
    expect(res.ok).toBe(false);
    expect(res.transferred).toBe(0);
  });

  it('rejects empty arguments', async () => {
    loginAs('admin', 'admin');
    const r1 = await transferAllBuildsFromUser('', 'katara');
    expect(r1.ok).toBe(false);
    const r2 = await transferAllBuildsFromUser('aang', '');
    expect(r2.ok).toBe(false);
  });

  it('reports 0 transferred when source has no builds', async () => {
    loginAs('admin', 'admin');
    const res = await transferAllBuildsFromUser('toph', 'katara');
    expect(res.ok).toBe(true);
    expect(res.transferred).toBe(0);
  });

  it('blocks bulk if actor is not admin', async () => {
    loginAs('aang', 'player');
    const res = await transferAllBuildsFromUser('aang', 'katara');
    expect(res.ok).toBe(false);
    expect(res.failed).toBeGreaterThan(0);
  });
});
