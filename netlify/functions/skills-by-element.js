/**
 * GET /api/skills/:element
 * Return skills for a specific element
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, serverError } from './lib/response.js';
import { requireAuth } from './lib/auth.js';

const VALID_ELEMENTS = ['fire', 'water', 'earth', 'air', 'none'];

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'GET') return error('Método não permitido', 405);

  const { error_response } = await requireAuth(event);
  if (error_response) return error_response;

  const element = event.queryStringParameters?.element || event.path?.split('/').pop();
  if (!element || !VALID_ELEMENTS.includes(element)) {
    return error(`Elemento inválido. Use: ${VALID_ELEMENTS.join(', ')}`);
  }

  try {
    const { data, error: dbErr } = await supabase
      .from('skills')
      .select('*')
      .eq('element', element)
      .order('tier, name');

    if (dbErr) throw dbErr;
    return ok(data || []);
  } catch (err) {
    console.error('[skills-by-element]', err);
    return serverError();
  }
};
