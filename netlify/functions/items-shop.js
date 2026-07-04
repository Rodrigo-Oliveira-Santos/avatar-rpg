/**
 * GET /api/items/shop
 * Return items currently available in the shop
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, serverError } from './lib/response.js';
import { requireAuth } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'GET') return error('Método não permitido', 405);

  const { error_response } = await requireAuth(event);
  if (error_response) return error_response;

  try {
    const { data, error: dbErr } = await supabase
      .from('items')
      .select(`
        *,
        shop_config!inner(price_override, is_active)
      `)
      .eq('in_shop', true)
      .eq('shop_config.is_active', true)
      .order('type, name');

    if (dbErr) throw dbErr;

    // Apply price overrides
    const items = (data || []).map(item => ({
      ...item,
      display_price: item.shop_config?.[0]?.price_override ?? item.price,
      shop_config: undefined,
    }));

    return ok(items);
  } catch (err) {
    console.error('[items-shop]', err);
    return serverError();
  }
};
