/**
 * GET    /api/characters/:id  → get character by ID
 * PUT    /api/characters/:id  → update character (auto-save)
 * DELETE /api/characters/:id  → delete character
 */

import { supabase } from './lib/supabase.js';
import { handleCORS } from './lib/cors.js';
import { ok, noContent, error, forbidden, notFound, serverError } from './lib/response.js';
import { requireAuth } from './lib/auth.js';

export const handler = async (event) => {
  const cors = handleCORS(event);
  if (cors) return cors;

  const { dbUser, error_response } = await requireAuth(event);
  if (error_response) return error_response;

  // ID comes from redirect rule query param
  const id = event.queryStringParameters?.id || event.path?.split('/').pop();
  if (!id || id === 'undefined') return error('ID do personagem é obrigatório');

  try {
    // Verify ownership (or GM/admin access)
    const { data: existing, error: fetchErr } = await supabase
      .from('characters')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return notFound('Personagem não encontrado');

    const isOwner = existing.user_id === dbUser.id;
    const isGMOrAdmin = ['gm', 'admin'].includes(dbUser.role);
    if (!isOwner && !isGMOrAdmin) return forbidden();

    if (event.httpMethod === 'GET') {
      const { data, error: dbErr } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single();

      if (dbErr) throw dbErr;
      return ok(data);
    }

    if (event.httpMethod === 'PUT') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return error('JSON inválido');
      }

      const {
        identidade = {},
        atributos = {},
        pontos_disponiveis,
        habilidades,
        inventario,
        equipamentos,
        anotacoes,
      } = body;

      const updates = {
        name: identidade.nome,
        element: identidade.elemento,
        level: identidade.nivel,
        xp: identidade.xp_atual,
        subclass: identidade.subclasse,
        age: identidade.idade,
        gender: identidade.genero,
        alignment: identidade.alinhamento,
        notes: anotacoes,
        attr_for: atributos.FOR,
        attr_agi: atributos.AGI,
        attr_chi: atributos.CHI,
        attr_per: atributos.PER,
        attr_res: atributos.RES,
        attr_esp: atributos.ESP,
        points_available: pontos_disponiveis,
        skills_data: habilidades,
        inventory_data: inventario,
        equipment_data: equipamentos,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined fields
      Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

      const { data, error: dbErr } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (dbErr) throw dbErr;
      return ok(data);
    }

    if (event.httpMethod === 'DELETE') {
      if (!isOwner && dbUser.role !== 'admin') return forbidden();

      const { error: dbErr } = await supabase.from('characters').delete().eq('id', id);
      if (dbErr) throw dbErr;
      return noContent();
    }

    return error('Método não permitido', 405);
  } catch (err) {
    console.error('[character-by-id]', err);
    return serverError();
  }
};
