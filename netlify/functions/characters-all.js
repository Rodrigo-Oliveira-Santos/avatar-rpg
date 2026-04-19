/**
 * GET /api/characters/all
 * Get all characters (GM and Admin only)
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, serverError } from './lib/response.js';
import { requireGM } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'GET') return error('Método não permitido', 405);

  const { error_response } = await requireGM(event);
  if (error_response) return error_response;

  try {
    const { data, error: dbErr } = await supabase
      .from('characters')
      .select(`
        id, name, element, level, xp, gold, subclass,
        attr_for, attr_agi, attr_chi, attr_per, attr_res, attr_esp,
        points_available, updated_at,
        users!inner(username, role)
      `)
      .order('updated_at', { ascending: false });

    if (dbErr) throw dbErr;
    return ok(data || []);
  } catch (err) {
    console.error('[characters-all]', err);
    return serverError();
  }
};
