/**
 * D&D Characters API
 *
 * Mesmo padrão da API Avatar (`api/characters.js`): se `useSupabase`
 * estiver ligado, lê/escreve em Supabase via REST; caso contrário cai em
 * localStorage. Cada utilizador tem uma única ficha guardada em
 * `dnd_character_{username}`. Existe ainda uma "registry" para o Hub
 * listar todos os personagens do sistema em modo local.
 *
 * Conversão Supabase ↔ runtime em `dnd-character-mapper.js`.
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';
import { rowToCharacter, characterToRow } from './dnd-character-mapper.js';

const REGISTRY_KEY = 'dnd_characters_registry';

function readCurrentUsername() {
  try {
    // D&D usa exclusivamente a sua chave de sessão — NÃO usar
    // `avatar_rpg_user` como fallback (quebra o isolamento entre jogos).
    const stored = localStorage.getItem('dnd_user');
    if (stored) return JSON.parse(stored).username;
  } catch {}
  return null;
}

function storageKey(username = readCurrentUsername()) {
  return `dnd_character_${username || 'default'}`;
}

function readRegistry() {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeRegistry(reg) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
}

function touchRegistry(username, summary) {
  if (!username) return;
  const reg = readRegistry();
  reg[username] = {
    ...(reg[username] || {}),
    ...summary,
    updated_at: new Date().toISOString(),
  };
  writeRegistry(reg);
}

// ─── Public API ────────────────────────────────────────────────────

export async function load(username = readCurrentUsername()) {
  if (!username) return null;

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data: user, error: userErr } = await client
        .from('users').select('id').eq('username', username).maybeSingle();
      if (userErr) throw userErr;
      if (user?.id) {
        const { data, error } = await client
          .from('dnd_characters').select('*').eq('user_id', user.id).maybeSingle();
        if (error) throw error;
        if (data) return rowToCharacter(data);
      }
    } catch (err) {
      console.warn('[dnd-characters.load] Supabase fallback', err);
    }
  }

  const raw = localStorage.getItem(storageKey(username));
  return raw ? JSON.parse(raw) : null;
}

export async function save(username, data) {
  const user = username || readCurrentUsername();
  if (!user) return null;

  const payload = { ...data, updated_at: new Date().toISOString() };

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data: u } = await client.from('users').select('id').eq('username', user).maybeSingle();
      if (u?.id) {
        await client.from('dnd_characters').upsert(
          characterToRow(u.id, payload),
          { onConflict: 'user_id' },
        );
      }
    } catch (err) {
      console.warn('[dnd-characters.save] Supabase failed, kept local copy', err);
    }
  }

  localStorage.setItem(storageKey(user), JSON.stringify(payload));
  touchRegistry(user, {
    name: payload?.identity?.name || user,
    class: payload?.identity?.class || '',
    level: payload?.level || 1,
  });
  return payload;
}

export async function listAll() {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('dnd_characters')
        .select('*, users:users!dnd_characters_user_id_fkey(username, role)');
      if (error) throw error;
      return (data || []).map((row) => ({
        ...rowToCharacter(row),
        owner_username: row.users?.username || null,
        owner_role: row.users?.role || null,
      }));
    } catch (err) {
      console.warn('[dnd-characters.listAll] Supabase failed, using local registry', err);
    }
  }
  // Local registry → expand
  const reg = readRegistry();
  return Object.entries(reg).map(([username, meta]) => {
    const raw = localStorage.getItem(`dnd_character_${username}`);
    const data = raw ? JSON.parse(raw) : null;
    return {
      owner_username: username,
      owner_role: meta.role || null,
      ...meta,
      ...(data || {}),
    };
  });
}

/**
 * Apenas para o Hub no modo local: garante que o utilizador da sessão
 * existe na registry mesmo que nunca tenha guardado a ficha. Usa o
 * registry do auth Avatar para inferir o role.
 */
export function ensureRegistered(username, role = 'player') {
  if (!username) return;
  const reg = readRegistry();
  if (reg[username]) return;
  reg[username] = { role, updated_at: new Date().toISOString() };
  writeRegistry(reg);
}

/**
 * Apaga a ficha D&D de um utilizador (uso admin). Remove do
 * Supabase (se disponível), do localStorage e da registry.
 *
 * Devolve true se algo foi efectivamente removido.
 */
export async function deleteCharacter(username) {
  const target = String(username || '').trim().toLowerCase();
  if (!target) return false;

  let removed = false;

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data: u } = await client.from('users').select('id').eq('username', target).maybeSingle();
      if (u?.id) {
        const { error } = await client.from('dnd_characters').delete().eq('user_id', u.id);
        if (error) throw error;
        removed = true;
      }
    } catch (err) {
      console.warn('[dnd-characters.deleteCharacter] Supabase failed', err);
    }
  }

  const key = storageKey(target);
  if (localStorage.getItem(key) != null) {
    localStorage.removeItem(key);
    removed = true;
  }

  const reg = readRegistry();
  if (reg[target]) {
    delete reg[target];
    writeRegistry(reg);
    removed = true;
  }

  return removed;
}
