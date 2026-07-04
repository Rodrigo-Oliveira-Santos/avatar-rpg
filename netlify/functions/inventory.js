/**
 * GET /api/inventory     → get character's inventory
 * PUT /api/inventory     → equip/unequip item
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, error, forbidden, serverError } from './lib/response.js';
import { requireAuth } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  const { dbUser, error_response } = await requireAuth(event);
  if (error_response) return error_response;

  const characterId = event.queryStringParameters?.characterId;
  if (!characterId) return error('characterId é obrigatório');

  try {
    // Verify ownership
    const { data: character } = await supabase
      .from('characters')
      .select('user_id')
      .eq('id', characterId)
      .single();

    if (!character) return error('Personagem não encontrado', 404);
    if (character.user_id !== dbUser.id && !['gm', 'admin'].includes(dbUser.role)) {
      return forbidden();
    }

    if (event.httpMethod === 'GET') {
      const { data, error: dbErr } = await supabase
        .from('character_inventory')
        .select('*, items(*)')
        .eq('character_id', characterId);

      if (dbErr) throw dbErr;
      return ok(data || []);
    }

    if (event.httpMethod === 'PUT') {
      let body;
      try { body = JSON.parse(event.body || '{}'); } catch { return error('JSON inválido'); }

      const { itemId, action } = body; // action: 'equip' | 'unequip'
      if (!itemId || !action) return error('itemId e action são obrigatórios');

      if (action === 'equip') {
        const { data: item } = await supabase.from('items').select('type').eq('id', itemId).single();
        if (!item) return error('Item não encontrado', 404);

        await supabase.from('characters').update({ armor_equipped: itemId }).eq('id', characterId);
      } else if (action === 'unequip') {
        await supabase.from('characters').update({ armor_equipped: null }).eq('id', characterId);
      } else {
        return error('action deve ser "equip" ou "unequip"');
      }

      return ok({ success: true });
    }

    return error('Método não permitido', 405);
  } catch (err) {
    console.error('[inventory]', err);
    return serverError();
  }
};
