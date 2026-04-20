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

/** BYPASS TEMPORÁRIO: retorna lista vazia — a app faz fallback para localStorage */
export function list() { return Promise.resolve([]); }

/** BYPASS TEMPORÁRIO */
export function create(data) {
  return Promise.resolve({ id: 'local-char', ...data });
}

/** BYPASS TEMPORÁRIO */
export function getById(id) {
  const saved = localStorage.getItem('avatar_rpg_character');
  return saved ? Promise.resolve(JSON.parse(saved)) : Promise.resolve(null);
}

/** BYPASS TEMPORÁRIO */
export function update(id, data) { return Promise.resolve(data); }

/** BYPASS TEMPORÁRIO */
export function remove(id) { return Promise.resolve(null); }

/** BYPASS TEMPORÁRIO: retorna lista vazia */
export function listAll() { return Promise.resolve([]); }
