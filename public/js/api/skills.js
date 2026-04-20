/**
 * Skills API
 */

// BYPASS TEMPORÁRIO: import do client comentado (reverter: descomentar)
// import { get, post } from './client.js';

/* BYPASS TEMPORÁRIO: funções originais comentadas — reverter: descomentar tudo abaixo e apagar os mocks, descomentar o import acima

import { get, post } from './client.js';

export function listAll() { return get('/api/skills'); }
export function getSkills(element) { return get(`/api/skills/${element}`); }
export function importSkills(payload) { return post('/api/gm/import', { type: 'skills', ...payload }); }

*/

/** BYPASS TEMPORÁRIO: retorna lista vazia — a app (skills/data.js) já trata arrays vazios */
export function listAll() { return Promise.resolve([]); }

/** BYPASS TEMPORÁRIO: retorna lista vazia por elemento */
export function getSkills(element) { return Promise.resolve([]); }

/** BYPASS TEMPORÁRIO */
export function importSkills(payload) { return Promise.resolve({ imported: 0 }); }
