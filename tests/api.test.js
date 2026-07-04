/**
 * API integration tests — verify that the API modules read/write via Supabase
 * when enabled and gracefully fall back to localStorage otherwise.
 *
 * The Supabase client is mocked via Vitest module mocks so no network/DB
 * is required to run these tests.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupLocalStorage, createMockCharacterData } from './helpers.js';

// ---- module mocks (must be declared before importing API modules) ----

let supabaseEnabled = false;
let supabaseClientImpl;

vi.mock('../public/js/api/config.js', () => ({
  getConfig: () => ({ useSupabase: supabaseEnabled, supabase: { url: 'x', anonKey: 'k' } }),
  isSupabaseEnabled: () => supabaseEnabled,
}));

vi.mock('../public/js/api/supabase-client.js', () => ({
  getSupabaseClient: () => Promise.resolve(supabaseClientImpl),
}));

// ---- helpers ----

/**
 * Build a chainable mock query that resolves to the given result for any
 * of the terminal awaitable forms (`.maybeSingle()`, `.single()`, or
 * implicit `await` on the builder itself).
 */
function mockQuery(result) {
  const promise = Promise.resolve(result);
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    maybeSingle: () => promise,
    single: () => promise,
    then: (resolve, reject) => promise.then(resolve, reject),
  };
  return builder;
}

function mockFromTable(table, results) {
  let callCount = 0;
  return {
    from: vi.fn((requestedTable) => {
      expect(requestedTable).toBe(table);
      const next = results[callCount] ?? results[results.length - 1];
      callCount += 1;
      return mockQuery(next);
    }),
  };
}

beforeEach(() => {
  setupLocalStorage();
  vi.resetModules();
  supabaseEnabled = false;
  supabaseClientImpl = null;
});

// ----------------------------------------------------------------
describe('characters API', () => {
  it('list() returns [] when Supabase disabled and no local data', async () => {
    const mod = await import('../public/js/api/characters.js');
    const result = await mod.list();
    expect(result).toEqual([]);
  });

  it('list() returns localStorage record (as array) in offline mode', async () => {
    const data = createMockCharacterData({ identidade: { nome: 'Local' } });
    localStorage.setItem('avatar_rpg_user', JSON.stringify({ username: 'zuko' }));
    localStorage.setItem('avatar_rpg_character_zuko', JSON.stringify(data));

    const mod = await import('../public/js/api/characters.js');
    const result = await mod.list();
    expect(result).toHaveLength(1);
    expect(result[0].identidade.nome).toBe('Local');
  });

  it('list() queries Supabase when enabled', async () => {
    supabaseEnabled = true;
    localStorage.setItem('avatar_rpg_user', JSON.stringify({ username: 'zuko' }));

    // First call: resolve user id; Second call: load character row
    supabaseClientImpl = {
      from: vi.fn()
        .mockReturnValueOnce(mockQuery({ data: { id: 'uid-zuko' }, error: null })) // users lookup
        .mockReturnValueOnce(mockQuery({                                              // characters select
          data: {
            id: 'char-1', user_id: 'uid-zuko',
            name: 'Zuko Remote', element: 'fire', level: 12, xp: 0, gold: 100,
            attr_for: 14, attr_agi: 12, attr_chi: 10, attr_per: 9, attr_res: 13, attr_esp: 8,
            skills_data: {}, inventory_data: [], equipment_data: {},
          },
          error: null,
        })),
    };

    const mod = await import('../public/js/api/characters.js');
    const result = await mod.list();
    expect(result).toHaveLength(1);
    expect(result[0].identidade.nome).toBe('Zuko Remote');
    expect(supabaseClientImpl.from).toHaveBeenCalledTimes(2);
  });

  it('getPreset() returns deterministic data for known usernames', async () => {
    const mod = await import('../public/js/api/characters.js');
    expect(mod.getPreset('zuko').identidade.elemento).toBe('fire');
    expect(mod.getPreset('unknown')).toBeNull();
  });
});

// ----------------------------------------------------------------
describe('skills API', () => {
  it('returns [] when Supabase disabled', async () => {
    const mod = await import('../public/js/api/skills.js');
    expect(await mod.listAll()).toEqual([]);
    expect(await mod.getSkills('fire')).toEqual([]);
  });

  it('listAll() fetches from skills table when enabled', async () => {
    supabaseEnabled = true;
    supabaseClientImpl = mockFromTable('skills', [{
      data: [
        { id: 's1', name: 'Fireball', element: 'fire', category: 'spirit', tier: 1, description: null,
          position: 'off', requirements: {}, prerequisites: [], attacks: [], passive_effect: null },
      ],
      error: null,
    }]);
    const mod = await import('../public/js/api/skills.js');
    const result = await mod.listAll();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Fireball');
  });
});

// ----------------------------------------------------------------
describe('items API', () => {
  it('getShopItems() returns [] when disabled', async () => {
    const mod = await import('../public/js/api/items.js');
    expect(await mod.getShopItems()).toEqual([]);
  });

  it('getShopItems() filters by in_shop when enabled', async () => {
    supabaseEnabled = true;
    supabaseClientImpl = mockFromTable('items', [{
      data: [{ id: 'i1', name: 'Sword', type: 'weapon', rarity: 'common', price: 100, in_shop: true }],
      error: null,
    }]);
    const mod = await import('../public/js/api/items.js');
    const result = await mod.getShopItems();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Sword');
  });
});

// ----------------------------------------------------------------
describe('notifications API', () => {
  it('list() returns [] when disabled', async () => {
    const mod = await import('../public/js/api/notifications.js');
    expect(await mod.list()).toEqual([]);
  });

  it('list() returns [] when no session', async () => {
    supabaseEnabled = true;
    const mod = await import('../public/js/api/notifications.js');
    expect(await mod.list()).toEqual([]);
  });

  it('list() fetches user notifications when enabled', async () => {
    supabaseEnabled = true;
    localStorage.setItem('avatar_rpg_user', JSON.stringify({ username: 'zuko' }));
    supabaseClientImpl = {
      from: vi.fn()
        .mockReturnValueOnce(mockQuery({ data: { id: 'uid-zuko' }, error: null })) // users
        .mockReturnValueOnce(mockQuery({                                              // notifications
          data: [{ id: 'n1', user_id: 'uid-zuko', type: 'gold_reward', title: 'Gold', message: '+50', is_read: false }],
          error: null,
        })),
    };
    const mod = await import('../public/js/api/notifications.js');
    const result = await mod.list();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Gold');
  });
});

// ----------------------------------------------------------------
describe('auth API', () => {
  it('login() works offline using local profile registry', async () => {
    const mod = await import('../public/js/api/auth.js');
    const result = await mod.login('zuko');
    expect(result.user.username).toBe('zuko');
    expect(result.user.role).toBe('player');
    expect(JSON.parse(localStorage.getItem('avatar_rpg_user')).username).toBe('zuko');
  });

  it('login() upserts and adopts remote role when Supabase enabled', async () => {
    supabaseEnabled = true;
    // user not found, then insert returns persisted row
    supabaseClientImpl = {
      from: vi.fn()
        .mockReturnValueOnce(mockQuery({ data: null, error: null }))
        .mockReturnValueOnce(mockQuery({ data: { id: 'remote-id', username: 'newcomer', role: 'player' }, error: null })),
    };
    const mod = await import('../public/js/api/auth.js');
    const result = await mod.login('newcomer');
    expect(result.user.id).toBe('remote-id');
    expect(result.user.role).toBe('player');
  });

  it('login() falls back to local profile when Supabase throws', async () => {
    supabaseEnabled = true;
    supabaseClientImpl = {
      from: () => { throw new Error('boom'); },
    };
    const mod = await import('../public/js/api/auth.js');
    const result = await mod.login('katara');
    expect(result.user.username).toBe('katara');
    expect(result.user.role).toBe('player');
  });

  it('getMe() throws when no session', async () => {
    const mod = await import('../public/js/api/auth.js');
    await expect(mod.getMe()).rejects.toThrow('Sem sessão');
  });
});
