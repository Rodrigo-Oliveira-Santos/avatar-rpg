/**
 * GET /api/notifications       → list user's notifications
 * PUT /api/notifications/:id   → mark as read
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, serverError } from './lib/response.js';
import { requireAuth } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  const { dbUser, error_response } = await requireAuth(event);
  if (error_response) return error_response;

  try {
    if (event.httpMethod === 'GET') {
      const { data, error: dbErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbErr) throw dbErr;
      return ok(data || []);
    }

    if (event.httpMethod === 'PUT') {
      const id = event.queryStringParameters?.id || event.path?.split('/').pop();
      if (!id) return error('ID da notificação é obrigatório');

      const { error: dbErr } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', dbUser.id); // ensure ownership

      if (dbErr) throw dbErr;
      return ok({ success: true });
    }

    return error('Método não permitido', 405);
  } catch (err) {
    console.error('[notifications]', err);
    return serverError();
  }
};
