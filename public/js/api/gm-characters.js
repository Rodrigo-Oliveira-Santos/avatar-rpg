/**
 * Persistence helpers for GM-side tools that need to read/write *any*
 * player's character (not just the logged-in user). Supabase-first when
 * enabled, falling back to localStorage so the tooling stays usable in
 * pure-local mode.
 *
 * These wrappers exist because the existing per-tool implementations
 * (LootDelivery, GroupRewards, GiftTransfer, GM Control buy-for-player)
 * all rolled their own localStorage-only logic and silently dropped
 * writes when the seed lived only in Supabase.
 */

import { isSupabaseEnabled } from './config.js';
import {
  loadCharacter as loadCharFromSupabase,
  saveCharacter as saveCharToSupabase,
} from './supabase-characters.js';
import { getSupabaseClient } from './supabase-client.js';

const CHARACTER_STORAGE_PREFIX = 'avatar_rpg_character_';

function storageKey(username) {
  return `${CHARACTER_STORAGE_PREFIX}${username}`;
}

function readLocal(username) {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(storageKey(username));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocal(username, character) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(storageKey(username), JSON.stringify(character)); } catch {}
}

/**
 * Load a player character (Supabase first when enabled, localStorage
 * fallback otherwise). Returns null when neither backend has the row.
 */
export async function loadPlayerCharacter(username) {
  if (!username) return null;

  if (isSupabaseEnabled()) {
    try {
      const remote = await loadCharFromSupabase(username);
      if (remote) return remote;
    } catch (err) {
      console.warn('[gm-characters.loadPlayerCharacter] Supabase load failed', err);
    }
  }
  return readLocal(username);
}

/**
 * Persist a player character. Writes to Supabase when enabled *and*
 * mirrors to localStorage so offline reads keep working. Throws on
 * Supabase write failure when enabled (caller should toast it).
 */
export async function savePlayerCharacter(username, character) {
  if (!username) throw new Error('Sem username');
  if (isSupabaseEnabled()) {
    await saveCharToSupabase(username, character);
  }
  writeLocal(username, character);
}

/**
 * Permanently delete a player account. Removes:
 *   - the Supabase `users` row (cascades to `characters`, `notifications`)
 *   - the localStorage character entry
 *   - the localStorage user-registry entry
 *
 * Throws on any Supabase write failure when Supabase is enabled so the
 * caller can surface the error. Caller is responsible for guarding
 * against self-delete / required-admin invariants.
 */
export async function deletePlayerAccount(username) {
  if (!username) throw new Error('Sem username');
  const normalized = String(username).trim().toLowerCase();

  if (isSupabaseEnabled()) {
    const client = await getSupabaseClient();

    // Trades use text usernames (not user_id FK), so the `users` cascade
    // doesn't touch them. Delete them explicitly first so the user's
    // history doesn't linger forever in the trades table.
    const { error: tradesErr } = await client
      .from('trades')
      .delete()
      .or(`from_username.eq.${normalized},to_username.eq.${normalized}`);
    if (tradesErr && tradesErr.code !== 'PGRST116') {
      console.warn('[gm-characters.deletePlayerAccount] trades cleanup failed', tradesErr);
    }

    const { error } = await client
      .from('users')
      .delete()
      .eq('username', normalized);
    // PGRST116 ("no rows found") is OK — local-only accounts won't have
    // a Supabase row. Any other error bubbles up.
    if (error && error.code !== 'PGRST116') throw error;
  }

  // Local cleanup — best effort, independent of Supabase result.
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(storageKey(normalized)); } catch {}
    try {
      const raw = localStorage.getItem('avatar_rpg_users_registry');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed[normalized]) {
          delete parsed[normalized];
          localStorage.setItem('avatar_rpg_users_registry', JSON.stringify(parsed));
        }
      }
    } catch {}
    // Local-mode trade store (legacy / offline) — also user-keyed.
    try {
      const raw = localStorage.getItem('avatar_rpg_trades');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((t) => {
            const from = String(t?.from_username || '').toLowerCase();
            const to = String(t?.to_username || '').toLowerCase();
            return from !== normalized && to !== normalized;
          });
          localStorage.setItem('avatar_rpg_trades', JSON.stringify(filtered));
        }
      }
    } catch {}
  }
}

/**
 * List all usernames the GM can target. Supabase-first (uses the `users`
 * table filtered by role='player'), falls back to the local registry.
 */
export async function listPlayerUsernames() {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('users')
        .select('username')
        .eq('role', 'player');
      if (error) throw error;
      const names = (data || []).map((u) => u.username).filter(Boolean);
      names.sort((a, b) => a.localeCompare(b));
      if (names.length > 0) return names;
    } catch (err) {
      console.warn('[gm-characters.listPlayerUsernames] Supabase fetch failed', err);
    }
  }

  // Local fallback: inspect the user registry written by AuthManager.
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem('avatar_rpg_users_registry');
    const parsed = raw ? JSON.parse(raw) : {};
    return Object.entries(parsed || {})
      .filter(([, entry]) => entry?.role === 'player')
      .map(([username]) => username)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}
