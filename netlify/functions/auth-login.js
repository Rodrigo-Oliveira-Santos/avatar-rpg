/**
 * POST /api/auth/login
 * Authenticate user by username (Phase 1: no password)
 * Creates user in Supabase Auth if not exists
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

  const { username } = body;
  if (!username) return error('Nome de utilizador é obrigatório');

  try {
    const email = `${username.toLowerCase()}@avatar-rpg.local`;
    const defaultPassword = `avatar-rpg-${username.toLowerCase()}-phase1`;

    // Try to sign in first
    let { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: defaultPassword,
    });

    // If user doesn't exist, create them
    if (authError && authError.message?.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
      });

      if (signUpError) {
        return error('Erro ao criar utilizador: ' + signUpError.message, 500);
      }

      // Create entry in users table
      await supabase.from('users').insert({
        auth_id: signUpData.user.id,
        username: username.toLowerCase(),
        role: 'player',
      });

      // Sign in the newly created user
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: defaultPassword,
      });

      if (loginError || !loginData.session) {
        return error('Erro ao autenticar após criação', 500);
      }

      data = loginData;
    } else if (authError) {
      return error('Erro de autenticação', 401);
    }

    if (!data?.session) {
      return error('Sessão não criada', 500);
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
