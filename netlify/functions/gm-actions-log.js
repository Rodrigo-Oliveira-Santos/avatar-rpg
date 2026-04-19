/**
 * GET /api/gm/actions-log
 * Get GM action log (GM and Admin only)
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, serverError } from './lib/response.js';
import { requireGM } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'GET') return error('Método não permitido', 405);

  const { dbUser, error_response } = await requireGM(event);
  if (error_response) return error_response;

  const params = event.queryStringParameters || {};
  const limit = Math.min(parseInt(params.limit, 10) || 50, 200);
  const offset = parseInt(params.offset, 10) || 0;

  try {
    let query = supabase
      .from('gm_actions')
      .select(`
        id, action_type, details, created_at,
        gm:users!gm_id(username),
        target:characters!target_char_id(name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Non-admins can only see their own actions
    if (dbUser.role !== 'admin') {
      query = query.eq('gm_id', dbUser.id);
    }

    const { data, error: dbErr } = await query;
    if (dbErr) throw dbErr;
    return ok(data || []);
  } catch (err) {
    console.error('[gm-actions-log]', err);
    return serverError();
  }
};
