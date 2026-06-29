/**
 * Hub data source
 *
 * Resolution order:
 *   1. Supabase REST (when `useSupabase` is on) — players + characters joined.
 *   2. localStorage saves keyed per-user.
 *   3. MOCK_PLAYERS, only when neither backend yields anything.
 */

import { calculateAllStats } from '../character/stats.js';
import { isSupabaseEnabled } from '../api/config.js';
import { getSupabaseClient } from '../api/supabase-client.js';
import { rowToCharacter } from '../api/character-mapper.js';
import { normalizeStatusEffect } from '../utils/statusEffects.js';

const CHARACTER_STORAGE_PREFIX = 'avatar_rpg_character_';
const USER_REGISTRY_KEY = 'avatar_rpg_users_registry';
const PRESET_USERNAMES = ['zuko', 'katara', 'toph', 'aang', 'sokka', 'gm', 'admin'];
const DEFAULT_ATTRIBUTES = {
  FOR: 8,
  AGI: 8,
  CHI: 8,
  PER: 8,
  RES: 8,
  ESP: 8,
};

export const MOCK_PLAYERS = [
  {
    id: 'player-1',
    username: 'kael',
    name: 'Kael',
    element: 'fire',
    level: 12,
    hp: 98,
    hpMax: 118,
    chi: 66,
    chiMax: 66,
    espiritu: 80,
    espirituMax: 80,
    defense: 27,
    dodge: 13,
    subclass: null,
    buffs: [
      { name: 'Regeneração', type: 'positive' },
    ],
    debuffs: [],
  },
  {
    id: 'player-2',
    username: 'yuki',
    name: 'Yuki',
    element: 'water',
    level: 10,
    hp: 87,
    hpMax: 87,
    chi: 50,
    chiMax: 54,
    espiritu: 68,
    espirituMax: 68,
    defense: 24,
    dodge: 14,
    subclass: 'Cura Avançada',
    buffs: [],
    debuffs: [],
  },
  {
    id: 'player-3',
    username: 'toph',
    name: 'Toph',
    element: 'earth',
    level: 15,
    hp: 130,
    hpMax: 145,
    chi: 41,
    chiMax: 46,
    espiritu: 62,
    espirituMax: 62,
    defense: 38,
    dodge: 11,
    subclass: 'Dobra de Metal',
    buffs: [
      { name: 'Escudo', type: 'positive' },
    ],
    debuffs: [
      { name: 'Lentidão', type: 'negative' },
    ],
  },
  {
    id: 'player-4',
    username: 'jinora',
    name: 'Jinora',
    element: 'air',
    level: 8,
    hp: 62,
    hpMax: 62,
    chi: 60,
    chiMax: 60,
    espiritu: 74,
    espirituMax: 74,
    defense: 19,
    dodge: 16,
    subclass: null,
    buffs: [],
    debuffs: [],
  },
  {
    id: 'player-5',
    username: 'sokka',
    name: 'Sokka',
    element: 'none',
    level: 11,
    hp: 45,
    hpMax: 110,
    chi: 30,
    chiMax: 46,
    espiritu: 55,
    espirituMax: 55,
    defense: 30,
    dodge: 13,
    subclass: 'Estrategista',
    buffs: [],
    debuffs: [
      { name: 'Sangramento', type: 'negative' },
    ],
  },
];

function hasLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function getCharacterStorageKey(username) {
  return `${CHARACTER_STORAGE_PREFIX}${username}`;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function parseCharacter(raw) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function getKnownCharacterUsernames() {
  if (!hasLocalStorage()) return [];

  const discovered = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(CHARACTER_STORAGE_PREFIX)) {
      discovered.push(key.slice(CHARACTER_STORAGE_PREFIX.length));
    }
  }

  const extraUsernames = discovered
    .filter(username => username && !PRESET_USERNAMES.includes(username))
    .sort((left, right) => left.localeCompare(right));

  return [...PRESET_USERNAMES, ...extraUsernames];
}

function resolveCurrentValue(character, candidates, maxValue) {
  const sources = [
    character,
    character?.stats_derived,
    character?.resources,
    character?.combat,
  ];

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    for (const key of candidates) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== '') {
        return clamp(toNumber(value, maxValue), 0, maxValue);
      }
    }
  }

  return maxValue;
}

function getEffectName(effect) {
  if (typeof effect === 'string') return effect;
  if (!effect || typeof effect !== 'object') return null;
  return effect.name || effect.nome || effect.label || effect.id || null;
}

function getEffectType(effect) {
  if (!effect || typeof effect !== 'object') return null;

  if (effect.positive === true || effect.isBuff === true) return 'positive';
  if (effect.negative === true || effect.isDebuff === true) return 'negative';

  const rawType = String(effect.type || effect.kind || effect.category || '').toLowerCase();

  if (['positive', 'buff', 'boon', 'beneficial', 'positivo'].includes(rawType)) return 'positive';
  if (['negative', 'debuff', 'penalty', 'harmful', 'negativo'].includes(rawType)) return 'negative';

  return null;
}

/**
 * Convert the raw `status_effects` array stored on a character into the
 * `{ buffs, debuffs }` shape the Hub UI expects. Uses the catalog
 * (`utils/statusEffects`) to resolve human-readable names + icons for
 * entries persisted by id only (e.g. `{ id: 'sangrando', type: 'negative' }`).
 */
function mapStatusEffects(statusEffects = []) {
  const effects = Array.isArray(statusEffects) ? statusEffects : [];

  return effects.reduce((accumulator, raw) => {
    // Prefer the catalog-aware normaliser; fall back to legacy name+type
    // heuristics for very old shapes (string-only labels, `positive: true`).
    const normalised = normalizeStatusEffect(raw);
    if (normalised) {
      const bucket = normalised.type === 'positive' ? 'buffs' : 'debuffs';
      accumulator[bucket].push(normalised);
      return accumulator;
    }

    const name = getEffectName(raw);
    const type = getEffectType(raw);
    if (!name || !type) return accumulator;
    accumulator[type === 'positive' ? 'buffs' : 'debuffs'].push({ id: name, name, type, icon: '•', custom: true });
    return accumulator;
  }, { buffs: [], debuffs: [] });
}

function toHubPlayer(username, character) {
  const identity = character?.identidade || {};
  const attributes = { ...DEFAULT_ATTRIBUTES, ...(character?.atributos || {}) };
  const level = Math.max(1, toNumber(identity.nivel, 1));
  const derivedStats = calculateAllStats({
    ...character,
    identidade: { ...identity, nivel: level },
    atributos: attributes,
    equipamentos: character?.equipamentos || {},
  });
  const effects = mapStatusEffects(character?.status_effects);

  return {
    id: username,
    username,
    name: identity.nome || username,
    element: String(identity.elemento || 'none').toLowerCase(),
    level,
    hp: resolveCurrentValue(character, ['hp_current', 'hp', 'currentHp', 'currentHP', 'vida', 'vidaAtual'], derivedStats.maxHP),
    hpMax: derivedStats.maxHP,
    chi: resolveCurrentValue(character, ['cp_current', 'chi', 'currentChi', 'currentCp', 'currentCP', 'cp', 'chiAtual'], derivedStats.maxCP),
    chiMax: derivedStats.maxCP,
    espiritu: resolveCurrentValue(character, ['sp_current', 'espiritu', 'espirito', 'currentSp', 'currentSP', 'sp', 'espirituAtual', 'espiritoAtual'], derivedStats.maxSP),
    espirituMax: derivedStats.maxSP,
    defense: derivedStats.defense,
    dodge: derivedStats.dodge,
    subclass: identity.subclasse || null,
    buffs: effects.buffs,
    debuffs: effects.debuffs,
  };
}

export function getPlayerUsernames() {
  if (!hasLocalStorage()) return [];

  return getKnownCharacterUsernames().filter(username => {
    const character = parseCharacter(localStorage.getItem(getCharacterStorageKey(username)));
    return Boolean(character);
  });
}

/**
 * Read all usernames registered as `player` role, regardless of whether
 * they have a saved character. Useful for GM tooling that needs to see
 * the full roster even before players log in for the first time.
 */
export function getRegisteredPlayerUsernames() {
  if (!hasLocalStorage()) return [];

  try {
    const stored = localStorage.getItem(USER_REGISTRY_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return [];

    return Object.entries(parsed)
      .filter(([, entry]) => entry?.role === 'player')
      .map(([username]) => username)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function createUnsavedPlayer(username) {
  return {
    id: username,
    username,
    name: username,
    element: 'none',
    level: 1,
    hp: 0,
    hpMax: 0,
    chi: 0,
    chiMax: 0,
    espiritu: 0,
    espirituMax: 0,
    defense: 0,
    dodge: 0,
    subclass: null,
    buffs: [],
    debuffs: [],
    unsaved: true,
  };
}

/**
 * Get hub players from saved character data, falling back to mocks.
 * @param {object} [options]
 * @param {boolean} [options.includeUnsaved] - When true, also lists registered
 *   players without a saved character (placeholder entries flagged `unsaved`).
 * @returns {object[]}
 */
export function getPlayers(options = {}) {
  if (!hasLocalStorage()) return [...MOCK_PLAYERS];

  const savedUsernames = getPlayerUsernames();
  const players = savedUsernames
    .map(username => {
      const character = parseCharacter(localStorage.getItem(getCharacterStorageKey(username)));
      return character ? toHubPlayer(username, character) : null;
    })
    .filter(Boolean);

  if (options.includeUnsaved) {
    const savedSet = new Set(savedUsernames);
    const unsaved = getRegisteredPlayerUsernames()
      .filter(username => !savedSet.has(username))
      .map(createUnsavedPlayer);
    return [...players, ...unsaved];
  }

  return players.length > 0 ? players : [...MOCK_PLAYERS];
}

/**
 * Supabase-backed version of `getPlayers`. Returns an array of HubPlayer
 * objects keyed by registered users with role='player'. When
 * `includeUnsaved` is true, players without a character row are returned
 * as placeholder entries flagged `unsaved`.
 *
 * Falls back to the synchronous `getPlayers` on any error so the UI keeps
 * working offline.
 *
 * @param {object} [options]
 * @param {boolean} [options.includeUnsaved]
 * @returns {Promise<object[]>}
 */
export async function getPlayersAsync(options = {}) {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('users')
        .select('username, role, characters(*)')
        .eq('role', 'player');
      if (error) throw error;

      const players = (data || [])
        .map((userRow) => {
          const rawChar = Array.isArray(userRow.characters)
            ? userRow.characters[0]
            : userRow.characters;
          if (rawChar) {
            const character = rowToCharacter(rawChar);
            return toHubPlayer(userRow.username, character);
          }
          return options.includeUnsaved ? createUnsavedPlayer(userRow.username) : null;
        })
        .filter(Boolean);

      // Sort: saved first, then unsaved, alphabetical within each group.
      players.sort((a, b) => {
        if (Boolean(a.unsaved) !== Boolean(b.unsaved)) return a.unsaved ? 1 : -1;
        return a.username.localeCompare(b.username);
      });
      return players;
    } catch (err) {
      console.warn('[hub.getPlayersAsync] Supabase fetch failed, falling back', err);
    }
  }
  return getPlayers(options);
}

/**
 * Count of registered campaign players (role='player'). Independent of
 * whether they have a saved character. Used by the nav badge.
 *
 * @returns {Promise<number>}
 */
export async function getPlayerCount() {
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { count, error } = await client
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'player');
      if (error) throw error;
      if (typeof count === 'number') return count;
    } catch (err) {
      console.warn('[hub.getPlayerCount] Supabase count failed, using fallback', err);
    }
  }
  // Local fallback: registered players (everyone with role='player' in localStorage).
  const registered = getRegisteredPlayerUsernames();
  if (registered.length) return registered.length;
  const saved = getPlayerUsernames();
  return saved.length || MOCK_PLAYERS.length;
}
