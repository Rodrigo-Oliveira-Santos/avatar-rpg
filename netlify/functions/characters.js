/**
 * GET /api/characters     → list user's characters
 * POST /api/characters    → create new character
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, created, error, serverError } from './lib/response.js';
import { requireAuth } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  const { dbUser, error_response } = await requireAuth(event);
  if (error_response) return error_response;

  try {
    if (event.httpMethod === 'GET') {
      const { data, error: dbErr } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', dbUser.id)
        .order('updated_at', { ascending: false });

      if (dbErr) throw dbErr;
      return ok(data || []);
    }

    if (event.httpMethod === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return error('JSON inválido');
      }

      const {
        identidade = {},
        atributos = {},
        pontos_disponiveis = 0,
        habilidades = {},
        inventario = [],
        equipamentos = {},
        anotacoes = '',
      } = body;

      const charRow = {
        user_id: dbUser.id,
        name: identidade.nome || 'Sem nome',
        element: identidade.elemento || 'none',
        level: identidade.nivel || 1,
        xp: identidade.xp_atual || 0,
        subclass: identidade.subclasse || '',
        age: identidade.idade || '',
        gender: identidade.genero || '',
        alignment: identidade.alinhamento || '',
        notes: anotacoes || '',
        gold: 0,
        attr_for: atributos.FOR || 8,
        attr_agi: atributos.AGI || 8,
        attr_chi: atributos.CHI || 8,
        attr_per: atributos.PER || 8,
        attr_res: atributos.RES || 8,
        attr_esp: atributos.ESP || 8,
        points_available: pontos_disponiveis,
        skills_data: habilidades,
        inventory_data: inventario,
        equipment_data: equipamentos,
      };

      const { data, error: dbErr } = await supabase
        .from('characters')
        .insert(charRow)
        .select()
        .single();

      if (dbErr) throw dbErr;
      return created(data);
    }

    return error('Método não permitido', 405);
  } catch (err) {
    console.error('[characters]', err);
    return serverError();
  }
};
