/**
 * GET /api/auth/me
 * Return current authenticated user info
 */

import { handleCORS } from './lib/cors.js';
import { ok, error } from './lib/response.js';
import { verifyAuth } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'GET') return error('Método não permitido', 405);

  const { user, dbUser, error_response } = await verifyAuth(event);
  if (error_response) return error_response;

  return ok({
    id: dbUser.id,
    username: dbUser.username || user.email,
    role: dbUser.role || 'player',
  });
};
