/**
 * Characters API
 */

// BYPASS TEMPORÁRIO: import do client comentado (reverter: descomentar)
// import { get, post, put, del } from './client.js';

/* BYPASS TEMPORÁRIO: funções originais comentadas — reverter: descomentar tudo abaixo e apagar os mocks, descomentar o import acima

import { get, post, put, del } from './client.js';

export function list() { return get('/api/characters'); }
export function create(data) { return post('/api/characters', data); }
export function getById(id) { return get(`/api/characters/${id}`); }
export function update(id, data) { return put(`/api/characters/${id}`, data); }
export function remove(id) { return del(`/api/characters/${id}`); }
export function listAll() { return get('/api/characters/all'); }

*/

/**
 * Get current username for localStorage key
 */
function getCurrentUser() {
  try {
    const stored = localStorage.getItem('avatar_rpg_user');
    if (stored) return JSON.parse(stored).username;
  } catch {}
  return 'default';
}

function getStorageKey() {
  return `avatar_rpg_character_${getCurrentUser()}`;
}

/**
 * Default character presets for test profiles
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

/** BYPASS TEMPORÁRIO: retorna lista vazia — a app faz fallback para localStorage */
export function list() { return Promise.resolve([]); }

/** BYPASS TEMPORÁRIO */
export function create(data) {
  return Promise.resolve({ id: 'local-char', ...data });
}

/** BYPASS TEMPORÁRIO */
export function getById(id) {
  const saved = localStorage.getItem(getStorageKey());
  return saved ? Promise.resolve(JSON.parse(saved)) : Promise.resolve(null);
}

/** BYPASS TEMPORÁRIO */
export function update(id, data) { return Promise.resolve(data); }

/** BYPASS TEMPORÁRIO */
export function remove(id) { return Promise.resolve(null); }

/** BYPASS TEMPORÁRIO: retorna lista vazia */
export function listAll() { return Promise.resolve([]); }

/**
 * Get preset data for a username (used on first login)
 * @param {string} username
 * @returns {object|null}
 */
export function getPreset(username) {
  return PRESETS[username.toLowerCase()] || null;
}

/**
 * Save character to localStorage (per-user)
 * @param {object} data - Character data
 */
export function saveLocal(data) {
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
}

/**
 * Load character from localStorage (per-user)
 * @returns {object|null}
 */
export function loadLocal() {
  const saved = localStorage.getItem(getStorageKey());
  return saved ? JSON.parse(saved) : null;
}
