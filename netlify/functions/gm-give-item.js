/**
 * POST /api/gm/give-item
 * Give an item to a character (GM only)
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, notFound, serverError } from './lib/response.js';
import { requireGM } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  if (event.httpMethod !== 'POST') return error('Método não permitido', 405);

  const { dbUser: gm, error_response } = await requireGM(event);
  if (error_response) return error_response;

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error('JSON inválido');
  }

  const { characterId, itemId, quantity = 1, reason } = body;
  if (!characterId || !itemId) return error('characterId e itemId são obrigatórios');

  try {
    const [{ data: character }, { data: item }] = await Promise.all([
      supabase.from('characters').select('id, name').eq('id', characterId).single(),
      supabase.from('items').select('id, name').eq('id', itemId).single(),
    ]);

    if (!character) return notFound('Personagem não encontrado');
    if (!item) return notFound('Item não encontrado');

    // Add to inventory (upsert to handle duplicates)
    const { data: existing } = await supabase
      .from('character_inventory')
      .select('id, quantity')
      .eq('character_id', characterId)
      .eq('item_id', itemId)
      .single();

    if (existing) {
      await supabase
        .from('character_inventory')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id);
    } else {
      await supabase.from('character_inventory').insert({
        character_id: characterId,
        item_id: itemId,
        quantity,
        acquired_from: 'gm',
      });
    }

    // Log GM action
    await supabase.from('gm_actions').insert({
      gm_id: gm.id,
      action_type: 'give_item',
      target_char_id: characterId,
      details: { itemId, itemName: item.name, quantity, reason: reason || '' },
    });

    // Notify player
    await supabase.from('notifications').insert({
      user_id: characterId,
      type: 'item_received',
      title: 'Item Recebido',
      message: `Você recebeu ${quantity}x ${item.name}${reason ? ` — ${reason}` : ''}.`,
    });

    return ok({ success: true, characterName: character.name, itemName: item.name, quantity });
  } catch (err) {
    console.error('[gm-give-item]', err);
    return serverError();
  }
};
