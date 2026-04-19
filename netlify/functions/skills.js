/**
 * GET  /api/skills  → list all skills
 * POST /api/skills  → create skill (GM only)
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, created, error, serverError } from './lib/response.js';
import { requireAuth, requireGM } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  try {
    if (event.httpMethod === 'GET') {
      const { error_response } = await requireAuth(event);
      if (error_response) return error_response;

      const { data, error: dbErr } = await supabase
        .from('skills')
        .select('*')
        .order('element, tier, name');

      if (dbErr) throw dbErr;
      return ok(data || []);
    }

    if (event.httpMethod === 'POST') {
      const { error_response } = await requireGM(event);
      if (error_response) return error_response;

      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return error('JSON inválido');
      }

      const { data, error: dbErr } = await supabase
        .from('skills')
        .insert(body)
        .select()
        .single();

      if (dbErr) throw dbErr;
      return created(data);
    }

    return error('Método não permitido', 405);
  } catch (err) {
    console.error('[skills]', err);
    return serverError();
  }
};
