/**
 * POST /api/gm/reward-gold
 * Give gold to a character (GM only)
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

  const { characterId, amount, reason } = body;
  if (!characterId || !amount) return error('characterId e amount são obrigatórios');
  if (typeof amount !== 'number' || amount === 0) return error('amount deve ser um número não-zero');

  try {
    const { data: character } = await supabase
      .from('characters')
      .select('id, gold, name')
      .eq('id', characterId)
      .single();

    if (!character) return notFound('Personagem não encontrado');

    const newGold = Math.max(0, character.gold + amount);

    await supabase.from('characters').update({ gold: newGold }).eq('id', characterId);

    // Log GM action
    await supabase.from('gm_actions').insert({
      gm_id: gm.id,
      action_type: 'reward_gold',
      target_char_id: characterId,
      details: { amount, reason: reason || '', previous_gold: character.gold, new_gold: newGold },
    });

    // Notify player
    await supabase.from('notifications').insert({
      user_id: characterId,
      type: 'gold_reward',
      title: 'Recompensa de Ouro',
      message: `Você recebeu ${amount > 0 ? '+' : ''}${amount} ouro${reason ? ` — ${reason}` : ''}.`,
    });

    return ok({ success: true, characterName: character.name, newGold });
  } catch (err) {
    console.error('[gm-reward-gold]', err);
    return serverError();
  }
};
