/**
 * Tests for D&D delete-character flow (admin action).
 *
 * Vive em modo local — confirma que a remoção limpa storage e registry.
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

import { save, load, deleteCharacter, ensureRegistered } from '../public/js/api/dnd-characters.js';

beforeEach(() => {
  setupLocalStorage();
});

describe('dnd-characters.deleteCharacter (local mode)', () => {
  it('removes both the character storage and the registry entry', async () => {
    await save('aang', { identity: { name: 'Aang', class: 'monk' }, level: 3 });
    expect(await load('aang')).toBeTruthy();

    const removed = await deleteCharacter('aang');
    expect(removed).toBe(true);

    expect(localStorage.getItem('dnd_character_aang')).toBeNull();
    const reg = JSON.parse(localStorage.getItem('dnd_characters_registry'));
    expect(reg.aang).toBeUndefined();
  });

  it('still cleans registry when only ensureRegistered was called', async () => {
    ensureRegistered('toph', 'player');
    expect(localStorage.getItem('dnd_character_toph')).toBeNull();
    const removed = await deleteCharacter('toph');
    expect(removed).toBe(true);
    const reg = JSON.parse(localStorage.getItem('dnd_characters_registry'));
    expect(reg.toph).toBeUndefined();
  });

  it('is idempotent — second call returns false', async () => {
    await save('katara', { identity: { name: 'Katara' } });
    expect(await deleteCharacter('katara')).toBe(true);
    expect(await deleteCharacter('katara')).toBe(false);
  });

  it('normalizes username (trim + lowercase)', async () => {
    await save('zuko', { identity: { name: 'Zuko' } });
    expect(await deleteCharacter('  ZUKO  ')).toBe(true);
    expect(localStorage.getItem('dnd_character_zuko')).toBeNull();
  });

  it('returns false for empty username', async () => {
    expect(await deleteCharacter('')).toBe(false);
    expect(await deleteCharacter(null)).toBe(false);
  });
});
