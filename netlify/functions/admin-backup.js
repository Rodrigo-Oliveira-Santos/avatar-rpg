/**
 * GET  /api/admin/backup  → export full database (Admin only)
 * POST /api/admin/backup  → restore from backup (Admin only)
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, serverError } from './lib/response.js';
import { requireAdmin } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  const { error_response } = await requireAdmin(event);
  if (error_response) return error_response;

  try {
    if (event.httpMethod === 'GET') {
      // Export all tables
      const tables = ['users', 'characters', 'skills', 'items', 'shop_config', 'character_inventory', 'gm_actions', 'notifications'];
      const backup = { exportedAt: new Date().toISOString(), tables: {} };

      await Promise.all(tables.map(async (table) => {
        const { data } = await supabase.from(table).select('*');
        backup.tables[table] = data || [];
      }));

      return ok(backup);
    }

    if (event.httpMethod === 'POST') {
      let body;
      try { body = JSON.parse(event.body || '{}'); } catch { return error('JSON inválido'); }

      const { tables } = body;
      if (!tables || typeof tables !== 'object') return error('tables é obrigatório');

      const results = {};
      const restorableTables = ['skills', 'items', 'shop_config'];

      for (const table of restorableTables) {
        if (!tables[table]) continue;
        const { error: dbErr } = await supabase.from(table).upsert(tables[table]);
        results[table] = dbErr ? `Erro: ${dbErr.message}` : `${tables[table].length} registos`;
      }

      return ok({ success: true, results });
    }

    return error('Método não permitido', 405);
  } catch (err) {
    console.error('[admin-backup]', err);
    return serverError();
  }
};
