/**
 * Local-storage seed for dev / offline mode.
 *
 * Mirror of `supabase/seed.sql` for the case where the app runs without
 * Supabase (the default `useSupabase: false`). Without this, the 5
 * preset player profiles would only get a localStorage character entry
 * after each one logged in for the first time — so the GM dashboard /
 * Hub would show them as "indisponíveis" until that happened.
 *
 * Behaviour:
 *   • Runs once per browser, gated by `LOCAL_SEED_MARKER`. If the user
 *     clears site data it re-seeds on the next load.
 *   • Idempotent: NEVER overwrites a character that already has a
 *     localStorage entry (so GM edits / actual logins are preserved).
 *   • Only writes the missing pieces — already-present accounts are
 *     left alone. Each character also makes sure the registry has the
 *     correct role for that username (lets fresh installs land with
 *     roles aligned).
 *
 * Does NOT run when Supabase is enabled: production / Supabase-local
 * setups already have authoritative seed data in the DB.
 */

import { isSupabaseEnabled } from '../api/config.js';
import { STORAGE_KEY as REGISTRY_KEY } from '../games/lib/users-registry.js';

const CHARACTER_PREFIX = 'avatar_rpg_character_';
export const LOCAL_SEED_MARKER = 'avatar_rpg_local_seed_v2';

// ── Mock item references (mirror shop/data.js MOCK_SHOP_ITEMS) ──
// Inlined here to avoid pulling the whole shop module into the seed
// bootstrap path. Only the fields equipped/used items actually need.
const ITEM_SWORD_BASIC = {
  id: 'item-sword-basic', name: 'Espada de Ferro', type: 'weapon', rarity: 'common',
  price: 50, damage: '1d8', weight: 'medium',
  description: 'Uma espada simples mas resistente, forjada em ferro comum.',
};
const ITEM_ARMOR_LEATHER = {
  id: 'item-armor-leather', name: 'Armadura de Couro', type: 'armor', rarity: 'common',
  price: 80, defense_bonus: 3, dodge_penalty: 0, weight_class: 'light',
  description: 'Proteção leve que permite liberdade de movimento.',
};
const ITEM_ARMOR_IRON = {
  id: 'item-armor-iron', name: 'Armadura de Ferro', type: 'armor', rarity: 'rare',
  price: 200, defense_bonus: 7, dodge_penalty: 3, weight_class: 'heavy',
  description: 'Proteção pesada feita de placas de ferro sobrepostas.',
};
const ITEM_POTION_HP = {
  id: 'item-potion-hp', name: 'Poção de Vida', type: 'consumable', rarity: 'common',
  price: 25, effect: 'Restaura 2d6 PV',
  description: 'Restaura 2d6 pontos de vida quando consumida.',
};
const ITEM_POTION_CHI = {
  id: 'item-potion-chi', name: 'Poção de Chi', type: 'consumable', rarity: 'common',
  price: 30, effect: 'Restaura 2d4 Chi',
  description: 'Restaura 2d4 pontos de chi.',
};
const ITEM_SCROLL_FIRE = {
  id: 'item-scroll-fire', name: 'Pergaminho de Fogo', type: 'accessory', rarity: 'rare',
  price: 150, effect: '+1 dano em habilidades de Fogo',
  description: 'Um pergaminho antigo que melhora habilidades de fogo.',
};
const ITEM_RING_SPIRIT = {
  id: 'item-ring-spirit', name: 'Anel Espiritual', type: 'accessory', rarity: 'epic',
  price: 350, effect: '+2 ESP',
  description: 'Um anel de jade que fortalece a conexão espiritual.',
};
const ITEM_STAFF_CHI = {
  id: 'item-staff-chi', name: 'Bastão de Chi', type: 'weapon', rarity: 'rare',
  price: 120, damage: '1d6+2', weight: 'light',
  description: 'Bastão de madeira encantada que canaliza a energia chi do portador.',
};
const ITEM_EARTH_GAUNTLETS = {
  id: 'item-earth-gauntlets', name: 'Manoplas de Terra', type: 'weapon', rarity: 'rare',
  price: 180, damage: '1d10', weight: 'heavy', element: 'earth',
  description: 'Pesadas manoplas reforçadas com cristais de terra.',
};

/**
 * Full preset characters. Mirrors `supabase/seed.sql` rows but uses the
 * frontend Character shape directly (no rowToCharacter round-trip needed).
 *
 * The 7 keys here MUST match the 7 entries in users-registry's
 * `DEFAULT_USERS` so every registered preset gets a character.
 */
export const LOCAL_SEED_CHARACTERS = {
  zuko: {
    identidade: {
      nome: 'Zuko', elemento: 'fire', subclasse: 'Raio Azul',
      nivel: 12, xp_atual: 340, marco: 'Aventureiro',
      idade: '16', genero: 'Masculino', alinhamento: 'Neutro',
      aparncia: '', historia: '',
    },
    atributos: { FOR: 14, AGI: 12, CHI: 10, PER: 9, RES: 13, ESP: 8 },
    pontos_disponiveis: 0,
    ouro: 450,
    combat_path: 'precise',
    non_bender_path: null,
    habilidades: {
      'fire-sp1a': { active: true, activeSubSkills: [] },
      'fire-cb1a': { active: true, activeSubSkills: [] },
      'fire-cb2a': { active: true, activeSubSkills: [] },
    },
    inventario: [{ ...ITEM_SWORD_BASIC, quantity: 1 }],
    equipamentos: { armadura: { ...ITEM_ARMOR_IRON, quantity: 1 } },
    moedas: { fire_coins: 80, water_coins: 0, earth_coins: 0, air_coins: 0, universal_coins: 0 },
    scrolls: {},
    skill_uses: { 'fire-cb1a': 24, 'fire-cb2a': 6 },
    status_effects: [],
  },
  katara: {
    identidade: {
      nome: 'Katara', elemento: 'water', subclasse: 'Dobra de Sangue',
      nivel: 14, xp_atual: 500, marco: 'Aventureiro',
      idade: '14', genero: 'Feminino', alinhamento: 'Bom',
      aparncia: '', historia: '',
    },
    atributos: { FOR: 8, AGI: 10, CHI: 15, PER: 11, RES: 9, ESP: 14 },
    pontos_disponiveis: 0,
    ouro: 320,
    combat_path: null,
    non_bender_path: null,
    habilidades: {
      'water-sp1a': { active: true, activeSubSkills: [] },
      'water-sp2a': { active: true, activeSubSkills: [] },
      'water-cb1a': { active: true, activeSubSkills: [] },
    },
    inventario: [{ ...ITEM_POTION_HP, quantity: 3 }],
    equipamentos: { armadura: { ...ITEM_ARMOR_LEATHER, quantity: 1 } },
    moedas: { fire_coins: 0, water_coins: 120, earth_coins: 0, air_coins: 0, universal_coins: 0 },
    scrolls: {},
    skill_uses: { 'water-sp1a': 18 },
    status_effects: [{ id: 'regeneracao', type: 'positive' }],
  },
  toph: {
    identidade: {
      nome: 'Toph', elemento: 'earth', subclasse: 'Dobra de Metal',
      nivel: 15, xp_atual: 200, marco: 'Aventureiro',
      idade: '12', genero: 'Feminino', alinhamento: 'Caótico',
      aparncia: '', historia: '',
    },
    atributos: { FOR: 16, AGI: 9, CHI: 11, PER: 14, RES: 15, ESP: 8 },
    pontos_disponiveis: 3,
    ouro: 600,
    combat_path: 'brute',
    non_bender_path: null,
    habilidades: {
      'earth-ag1a': { active: true, activeSubSkills: [] },
      'earth-cb1c': { active: true, activeSubSkills: [] },
      'earth-br3a': { active: true, activeSubSkills: [] },
    },
    inventario: [{ ...ITEM_EARTH_GAUNTLETS, quantity: 1 }],
    equipamentos: { acessorio: { ...ITEM_RING_SPIRIT, quantity: 1 } },
    moedas: { fire_coins: 0, water_coins: 0, earth_coins: 200, air_coins: 0, universal_coins: 0 },
    scrolls: {},
    skill_uses: { 'earth-cb1c': 51, 'earth-br3a': 3 },
    status_effects: [{ id: 'escudo', type: 'positive' }],
  },
  aang: {
    identidade: {
      nome: 'Aang', elemento: 'air', subclasse: 'Avatar',
      nivel: 18, xp_atual: 800, marco: 'Herói',
      idade: '112', genero: 'Masculino', alinhamento: 'Bom',
      aparncia: '', historia: '',
    },
    atributos: { FOR: 10, AGI: 16, CHI: 14, PER: 12, RES: 9, ESP: 15 },
    pontos_disponiveis: 6,
    ouro: 150,
    combat_path: 'precise',
    non_bender_path: null,
    habilidades: {
      'air-sp1a': { active: true, activeSubSkills: [] },
      'air-ag1a': { active: true, activeSubSkills: [] },
      'air-ag2a': { active: true, activeSubSkills: [] },
      'air-cb1a': { active: true, activeSubSkills: [] },
    },
    inventario: [
      { ...ITEM_STAFF_CHI, quantity: 1 },
      { ...ITEM_POTION_CHI, quantity: 2 },
    ],
    equipamentos: { acessorio: { ...ITEM_SCROLL_FIRE, quantity: 1 } },
    moedas: { fire_coins: 10, water_coins: 10, earth_coins: 10, air_coins: 50, universal_coins: 0 },
    scrolls: { 'air-cb1a': 2 },
    skill_uses: { 'air-ag1a': 17, 'air-ag2a': 2 },
    status_effects: [],
  },
  sokka: {
    identidade: {
      nome: 'Sokka', elemento: 'none', subclasse: 'Estrategista',
      nivel: 10, xp_atual: 100, marco: 'Aventureiro',
      idade: '15', genero: 'Masculino', alinhamento: 'Bom',
      aparncia: '', historia: '',
    },
    atributos: { FOR: 12, AGI: 13, CHI: 8, PER: 15, RES: 11, ESP: 8 },
    pontos_disponiveis: 0,
    ouro: 800,
    combat_path: null,
    non_bender_path: 'weapons',
    habilidades: {
      'none-weapons-cb1a': { active: true, activeSubSkills: [] },
      'none-weapons-cb1b': { active: true, activeSubSkills: [] },
    },
    inventario: [{ ...ITEM_POTION_CHI, quantity: 2 }],
    equipamentos: {
      arma: { ...ITEM_SWORD_BASIC, quantity: 1 },
      armadura: { ...ITEM_ARMOR_LEATHER, quantity: 1 },
    },
    moedas: { fire_coins: 0, water_coins: 40, earth_coins: 0, air_coins: 0, universal_coins: 0 },
    scrolls: {},
    skill_uses: {},
    status_effects: [{ id: 'concentrado', type: 'positive' }],
  },
  gm: {
    identidade: {
      nome: 'Game Master', elemento: 'fire', subclasse: '',
      nivel: 30, xp_atual: 0, marco: 'Mestre',
      idade: '', genero: '', alinhamento: '',
      aparncia: '', historia: '',
    },
    atributos: { FOR: 15, AGI: 15, CHI: 15, PER: 15, RES: 15, ESP: 15 },
    pontos_disponiveis: 0,
    ouro: 50000,
    combat_path: null,
    non_bender_path: null,
    habilidades: {},
    inventario: [],
    equipamentos: {},
    moedas: { fire_coins: 0, water_coins: 0, earth_coins: 0, air_coins: 0, universal_coins: 0 },
    scrolls: {},
    skill_uses: {},
    status_effects: [],
  },
  admin: {
    identidade: {
      nome: 'Admin', elemento: 'fire', subclasse: '',
      nivel: 40, xp_atual: 0, marco: 'Lenda',
      idade: '', genero: '', alinhamento: '',
      aparncia: '', historia: '',
    },
    atributos: { FOR: 20, AGI: 20, CHI: 20, PER: 20, RES: 20, ESP: 20 },
    pontos_disponiveis: 0,
    ouro: 99999,
    combat_path: null,
    non_bender_path: null,
    habilidades: {},
    inventario: [],
    equipamentos: {},
    moedas: { fire_coins: 0, water_coins: 0, earth_coins: 0, air_coins: 0, universal_coins: 0 },
    scrolls: {},
    skill_uses: {},
    status_effects: [],
  },
};

/** Default role per preset username — mirrors users-registry DEFAULT_USERS. */
const PRESET_ROLES = {
  zuko: 'player', katara: 'player', toph: 'player',
  aang: 'player', sokka: 'player',
  gm: 'gm', admin: 'admin',
};

function hasLocalStorage() {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.getItem('__probe__');
    return true;
  } catch {
    return false;
  }
}

function readMarker() {
  try { return localStorage.getItem(LOCAL_SEED_MARKER); }
  catch { return null; }
}

function writeMarker() {
  try { localStorage.setItem(LOCAL_SEED_MARKER, new Date().toISOString()); }
  catch {}
}

function ensureRegistry() {
  // Touch the registry so its self-seed kicks in and every preset has
  // the right role, even when the marker says the seed already ran.
  let raw;
  try { raw = localStorage.getItem(REGISTRY_KEY); } catch { return; }
  let parsed = {};
  if (raw) {
    try { parsed = JSON.parse(raw) || {}; } catch { parsed = {}; }
  }
  let mutated = false;
  const now = new Date().toISOString();
  for (const [username, role] of Object.entries(PRESET_ROLES)) {
    const existing = parsed[username];
    if (!existing) {
      parsed[username] = { role, created_at: now };
      mutated = true;
    } else if (!existing.role) {
      existing.role = role;
      mutated = true;
    }
  }
  if (mutated) {
    try { localStorage.setItem(REGISTRY_KEY, JSON.stringify(parsed)); } catch {}
  }
}

/**
 * Idempotently populate localStorage with the preset characters.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.force] When true, ignores the marker and the
 *   "already exists" guard — overwrites every preset character with
 *   pristine seed data. Used by an explicit "Restaurar perfis de teste"
 *   admin action (future). Default false.
 * @returns {{ created: string[], skipped: string[], forced: string[] }}
 */
export function bootstrapLocalSeed({ force = false } = {}) {
  if (!hasLocalStorage()) {
    return { created: [], skipped: [], forced: [] };
  }
  // Never seed when Supabase is the source of truth.
  if (isSupabaseEnabled()) {
    return { created: [], skipped: Object.keys(LOCAL_SEED_CHARACTERS), forced: [] };
  }
  // Marker prevents re-seed across reloads so GM edits are preserved.
  if (!force && readMarker()) {
    return { created: [], skipped: Object.keys(LOCAL_SEED_CHARACTERS), forced: [] };
  }

  ensureRegistry();

  const created = [];
  const skipped = [];
  const forced = [];

  for (const [username, character] of Object.entries(LOCAL_SEED_CHARACTERS)) {
    const key = `${CHARACTER_PREFIX}${username}`;
    const existing = (() => {
      try { return localStorage.getItem(key); } catch { return null; }
    })();

    if (existing && !force) {
      skipped.push(username);
      continue;
    }

    try {
      localStorage.setItem(key, JSON.stringify(character));
      if (existing && force) forced.push(username);
      else created.push(username);
    } catch (err) {
      console.warn('[local-seed] failed to write', username, err);
    }
  }

  writeMarker();
  return { created, skipped, forced };
}
