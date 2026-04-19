/**
 * POST /api/shop/purchase
 * Purchase an item from the shop
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, forbidden, notFound, serverError } from './lib/response.js';
import { requireAuth } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'POST') return error('Método não permitido', 405);

  const { dbUser, error_response } = await requireAuth(event);
  if (error_response) return error_response;

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error('JSON inválido');
  }

  const { itemId, characterId } = body;
  if (!itemId || !characterId) return error('itemId e characterId são obrigatórios');

  try {
    // Verify character ownership
    const { data: character } = await supabase
      .from('characters')
      .select('id, user_id, gold')
      .eq('id', characterId)
      .single();

    if (!character) return notFound('Personagem não encontrado');
    if (character.user_id !== dbUser.id) return forbidden();

    // Get item + shop config
    const { data: item } = await supabase
      .from('items')
      .select('*, shop_config(price_override, is_active)')
      .eq('id', itemId)
      .eq('in_shop', true)
      .single();

    if (!item) return notFound('Item não disponível na loja');
    if (!item.shop_config?.[0]?.is_active) return error('Item não disponível no momento');

    const price = item.shop_config?.[0]?.price_override ?? item.price ?? 0;

    if (character.gold < price) return error('Ouro insuficiente');

    // Deduct gold
    await supabase
      .from('characters')
      .update({ gold: character.gold - price })
      .eq('id', characterId);

    // Add to inventory
    const { data: invEntry } = await supabase
      .from('character_inventory')
      .upsert({
        character_id: characterId,
        item_id: itemId,
        quantity: 1,
        acquired_from: 'shop',
      }, { onConflict: 'character_id,item_id', ignoreDuplicates: false })
      .select()
      .single();

    return ok({ success: true, goldSpent: price, item: { id: item.id, name: item.name } });
  } catch (err) {
    console.error('[shop-purchase]', err);
    return serverError();
  }
};
