/**
 * Characters API
 *
 * When `useSupabase` is enabled (see `public/config.js`), reads and writes
 * are issued directly against the Supabase REST API via `supabase-client.js`.
 * Otherwise the module falls back to localStorage so the app keeps working
 * offline.
 */

import { isSupabaseEnabled } from './config.js';
import {
  loadCharacter as loadCharacterFromSupabase,
  saveCharacter as saveCharacterToSupabase,
} from './supabase-characters.js';
import { getSupabaseClient } from './supabase-client.js';
import { rowToCharacter } from './character-mapper.js';

function readCurrentUsername() {
  try {
    const stored = localStorage.getItem('avatar_rpg_user');
    if (stored) return JSON.parse(stored).username;
  } catch {}
  return null;
}

function getStorageKey() {
  return `avatar_rpg_character_${readCurrentUsername() || 'default'}`;
}

/**
 * Default character presets for test profiles (first-login bootstrap).
 */
const PRESETS = {
  zuko: {
    identidade: { nome: 'Zuko', elemento: 'fire', subclasse: 'Raio Azul', nivel: 12, xp_atual: 340, marco: 'Aventureiro', idade: '16', genero: 'Masculino', alinhamento: 'Neutro', aparncia: '', historia: '' },
    atributos: { FOR: 14, AGI: 12, CHI: 10, PER: 9, RES: 13, ESP: 8 },
    ouro: 450,
  },
  katara: {
    identidade: { nome: 'Katara', elemento: 'water', subclasse: 'Dobra de Sangue', nivel: 14, xp_atual: 500, marco: 'Aventureiro', idade: '14', genero: 'Feminino', alinhamento: 'Bom', aparncia: '', historia: '' },
    atributos: { FOR: 8, AGI: 10, CHI: 15, PER: 11, RES: 9, ESP: 14 },
    ouro: 320,
  },
  toph: {
    identidade: { nome: 'Toph', elemento: 'earth', subclasse: 'Dobra de Metal', nivel: 15, xp_atual: 200, marco: 'Aventureiro', idade: '12', genero: 'Feminino', alinhamento: 'Caótico', aparncia: '', historia: '' },
    atributos: { FOR: 16, AGI: 9, CHI: 11, PER: 14, RES: 15, ESP: 8 },
    ouro: 600,
  },
  aang: {
    identidade: { nome: 'Aang', elemento: 'air', subclasse: 'Avatar', nivel: 18, xp_atual: 800, marco: 'Herói', idade: '112', genero: 'Masculino', alinhamento: 'Bom', aparncia: '', historia: '' },
    atributos: { FOR: 10, AGI: 16, CHI: 14, PER: 12, RES: 9, ESP: 15 },
    ouro: 150,
  },
  sokka: {
    identidade: { nome: 'Sokka', elemento: 'none', subclasse: 'Estrategista', nivel: 10, xp_atual: 100, marco: 'Aventureiro', idade: '15', genero: 'Masculino', alinhamento: 'Bom', aparncia: '', historia: '' },
    atributos: { FOR: 12, AGI: 13, CHI: 8, PER: 15, RES: 11, ESP: 8 },
    ouro: 800,
  },
  admin: {
    identidade: { nome: 'Admin', elemento: 'fire', subclasse: '', nivel: 40, xp_atual: 0, marco: 'Lenda', idade: '', genero: '', alinhamento: '', aparncia: '', historia: '' },
    atributos: { FOR: 20, AGI: 20, CHI: 20, PER: 20, RES: 20, ESP: 20 },
    ouro: 99999,
  },
  gm: {
    identidade: { nome: 'Game Master', elemento: 'fire', subclasse: '', nivel: 30, xp_atual: 0, marco: 'Mestre', idade: '', genero: '', alinhamento: '', aparncia: '', historia: '' },
    atributos: { FOR: 15, AGI: 15, CHI: 15, PER: 15, RES: 15, ESP: 15 },
    ouro: 50000,
  },
};

/**
 * List characters for the current user.
 * - Supabase mode: returns `[character]` (single record per user today) or `[]`.
 * - Local mode: returns the localStorage record wrapped in an array, or `[]`.
 */
export async function list() {
  if (isSupabaseEnabled()) {
    const username = readCurrentUsername();
    if (!username) return [];
    try {
      const character = await loadCharacterFromSupabase(username);
      return character ? [character] : [];
    } catch (err) {
      console.warn('[characters.list] Supabase load failed, falling back to localStorage', err);
    }
  }

  const local = loadLocal();
  return local ? [local] : [];
}

/**
 * Create a character for the current user (used on first login bootstrap).
 */
export async function create(data) {
  if (isSupabaseEnabled()) {
    const username = readCurrentUsername();
    if (username) {
      try {
        const id = await saveCharacterToSupabase(username, data);
        return { ...data, id };
      } catch (err) {
        console.warn('[characters.create] Supabase save failed, kept local copy', err);
      }
    }
  }
  saveLocal(data);
  return { id: data.id || 'local-char', ...data };
}

/**
 * Fetch a character by id (Supabase) or fall back to the localStorage record.
 */
export async function getById(id) {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('characters')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (data) return rowToCharacter(data);
    } catch (err) {
      console.warn('[characters.getById] Supabase fetch failed, falling back', err);
    }
  }
  const saved = localStorage.getItem(getStorageKey());
  return saved ? JSON.parse(saved) : null;
}

/**
 * Update a character (id is ignored in Supabase mode because we key by username).
 */
export async function update(id, data) {
  if (isSupabaseEnabled()) {
    const username = readCurrentUsername();
    if (username) {
      try {
        await saveCharacterToSupabase(username, data);
      } catch (err) {
        console.warn('[characters.update] Supabase update failed, kept local copy', err);
      }
    }
  }
  saveLocal(data);
  return data;
}

/**
 * Delete a character. In Supabase mode it removes the row; locally clears the key.
 */
export async function remove(id) {
  if (isSupabaseEnabled() && id) {
    try {
      const client = await getSupabaseClient();
      const { error } = await client.from('characters').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('[characters.remove] Supabase delete failed', err);
    }
  }
  localStorage.removeItem(getStorageKey());
  return null;
}

/**
 * List all characters in the system (GM/Admin view).
 */
export async function listAll() {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('characters')
        .select('*, users:users!characters_user_id_fkey(username, role)');
      if (error) throw error;
      return (data || []).map((row) => ({
        ...rowToCharacter(row),
        owner_username: row.users?.username || null,
        owner_role: row.users?.role || null,
      }));
    } catch (err) {
      console.warn('[characters.listAll] Supabase fetch failed', err);
      return [];
    }
  }
  return [];
}

/**
 * Get preset data for a username (used on first login).
 */
export function getPreset(username) {
  return PRESETS[username.toLowerCase()] || null;
}

/**
 * Save character to localStorage (per-user). Always available as a backup.
 */
export function saveLocal(data) {
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
}

/**
 * Load character from localStorage (per-user).
 */
export function loadLocal() {
  const saved = localStorage.getItem(getStorageKey());
  return saved ? JSON.parse(saved) : null;
}
