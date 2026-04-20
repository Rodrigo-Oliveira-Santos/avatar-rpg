/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, serverError } from './lib/response.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'POST') return error('Método não permitido', 405);

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error('JSON inválido');
  }

  const { username, password } = body;
  if (!username || !password) return error('Utilizador e senha são obrigatórios');

  try {
    // Authenticate with Supabase Auth (email = username@avatar-rpg.local convention)
    const email = `${username.toLowerCase()}@avatar-rpg.local`;
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.session) {
      return error('Credenciais inválidas', 401);
    }

    // Get user role from users table
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('auth_id', data.user.id)
      .single();

    return ok({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: dbUser?.id || data.user.id,
        username: dbUser?.username || username,
        role: dbUser?.role || 'player',
      },
    });
  } catch (err) {
    console.error('[auth-login]', err);
    return serverError();
  }
};
