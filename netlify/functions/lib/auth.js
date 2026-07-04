/**
 * Authentication helpers for Netlify Functions
 */

import { supabase } from './supabase.js';
import { unauthorized, forbidden } from './response.js';

/**
 * Verify JWT and return { user, dbUser, error_response }
 * @param {object} event - Netlify event
 */
export async function verifyAuth(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, dbUser: null, error_response: unauthorized() };
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, dbUser: null, error_response: unauthorized('Token inválido ou expirado') };
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('auth_id', user.id)
    .single();

  return {
    user,
    dbUser: dbUser || { id: user.id, username: user.email, role: 'player' },
    error_response: null,
  };
}

/**
 * Require any authenticated user
 */
export async function requireAuth(event) {
  return verifyAuth(event);
}

/**
 * Require GM or ADMIN role
 */
export async function requireGM(event) {
  const result = await verifyAuth(event);
  if (result.error_response) return result;

  if (!['gm', 'admin'].includes(result.dbUser?.role)) {
    return { ...result, error_response: forbidden('Requer role GM ou superior') };
  }
  return result;
}

/**
 * Require ADMIN role
 */
export async function requireAdmin(event) {
  const result = await verifyAuth(event);
  if (result.error_response) return result;

  if (result.dbUser?.role !== 'admin') {
    return { ...result, error_response: forbidden('Requer role Admin') };
  }
  return result;
}
