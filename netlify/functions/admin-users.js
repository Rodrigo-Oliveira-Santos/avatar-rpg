/**
 * GET    /api/admin/users       → list all users
 * POST   /api/admin/users       → create user
 * PUT    /api/admin/users       → update user role
 * DELETE /api/admin/users       → delete user
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, created, noContent, error, serverError } from './lib/response.js';
import { requireAdmin } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  const { error_response } = await requireAdmin(event);
  if (error_response) return error_response;

  try {
    if (event.httpMethod === 'GET') {
      const { data, error: dbErr } = await supabase
        .from('users')
        .select('id, username, role, created_at, updated_at')
        .order('created_at');

      if (dbErr) throw dbErr;
      return ok(data || []);
    }

    if (event.httpMethod === 'POST') {
      let body;
      try { body = JSON.parse(event.body || '{}'); } catch { return error('JSON inválido'); }

      const { username, password, role = 'player' } = body;
      if (!username || !password) return error('username e password são obrigatórios');

      const validRoles = ['player', 'gm', 'admin'];
      if (!validRoles.includes(role)) return error(`Role inválido: ${role}`);

      // Enforce max admin accounts
      if (role === 'admin') {
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin');
        if (count >= 3) return error('Máximo de 3 contas admin atingido');
      }

      // Create Supabase Auth user
      const email = `${username.toLowerCase()}@avatar-rpg.local`;
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authErr) throw authErr;

      // Create users table entry
      const { data: dbUser, error: dbErr } = await supabase
        .from('users')
        .insert({ auth_id: authData.user.id, username, role })
        .select()
        .single();

      if (dbErr) throw dbErr;
      return created({ id: dbUser.id, username, role });
    }

    if (event.httpMethod === 'PUT') {
      let body;
      try { body = JSON.parse(event.body || '{}'); } catch { return error('JSON inválido'); }

      const { userId, role } = body;
      if (!userId || !role) return error('userId e role são obrigatórios');

      const validRoles = ['player', 'gm', 'admin'];
      if (!validRoles.includes(role)) return error(`Role inválido: ${role}`);

      const { error: dbErr } = await supabase.from('users').update({ role }).eq('id', userId);
      if (dbErr) throw dbErr;
      return ok({ success: true });
    }

    if (event.httpMethod === 'DELETE') {
      const userId = event.queryStringParameters?.userId;
      if (!userId) return error('userId é obrigatório');

      const { data: user } = await supabase.from('users').select('auth_id').eq('id', userId).single();
      if (!user) return error('Utilizador não encontrado', 404);

      await supabase.auth.admin.deleteUser(user.auth_id);
      await supabase.from('users').delete().eq('id', userId);
      return noContent();
    }

    return error('Método não permitido', 405);
  } catch (err) {
    console.error('[admin-users]', err);
    return serverError();
  }
};
