/**
 * Items API
 */

// BYPASS TEMPORÁRIO: import do client comentado (reverter: descomentar)
// import { get, post } from './client.js';

/* BYPASS TEMPORÁRIO: funções originais comentadas — reverter: descomentar tudo abaixo e apagar os mocks, descomentar o import acima

import { get, post } from './client.js';

export function listAll() { return get('/api/items'); }
export function getShopItems() { return get('/api/items/shop'); }
export function purchase(itemId, characterId) { return post('/api/shop/purchase', { itemId, characterId }); }
export function importItems(payload) { return post('/api/gm/import', { type: 'items', ...payload }); }

*/

/** BYPASS TEMPORÁRIO: retorna lista vazia — a app (items/data.js e shop) já trata arrays vazios */
export function listAll() { return Promise.resolve([]); }

/** BYPASS TEMPORÁRIO */
export function getShopItems() { return Promise.resolve([]); }

/** BYPASS TEMPORÁRIO */
export function purchase(itemId, characterId) { return Promise.resolve({ success: true }); }

/** BYPASS TEMPORÁRIO */
export function importItems(payload) { return Promise.resolve({ imported: 0 }); }
