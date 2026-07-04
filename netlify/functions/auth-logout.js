/**
 * POST /api/auth/logout
 * Invalidate current session
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, serverError } from './lib/response.js';
import { verifyAuth } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'POST') return error('Método não permitido', 405);

  const { user, error_response } = await verifyAuth(event);
  if (error_response) return error_response;

  try {
    await supabase.auth.admin.signOut(user.id);
    return ok({ message: 'Sessão encerrada' });
  } catch (err) {
    console.error('[auth-logout]', err);
    return serverError();
  }
};
