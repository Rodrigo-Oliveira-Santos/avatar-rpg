/**
 * Notifications API
 */

// BYPASS TEMPORÁRIO: import do client comentado (reverter: descomentar)
// import { get, put } from './client.js';

/* BYPASS TEMPORÁRIO: funções originais comentadas — reverter: descomentar tudo abaixo e apagar os mocks, descomentar o import acima

import { get, put } from './client.js';

export function list() { return get('/api/notifications'); }
export function markRead(id) { return put(`/api/notifications/${id}`, { is_read: true }); }

*/

/** BYPASS TEMPORÁRIO: retorna lista vazia de notificações */
export function list() { return Promise.resolve([]); }

/** BYPASS TEMPORÁRIO */
export function markRead(id) { return Promise.resolve({ id, is_read: true }); }
