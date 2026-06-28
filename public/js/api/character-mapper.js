/**
 * Maps the frontend character shape (`identidade`, `atributos`, …) to the
 * flat columns used by the `characters` table in Supabase, and back.
 *
 * The Supabase row keeps the rich client state in JSONB blobs
 * (`skills_data`, `inventory_data`, `equipment_data`) so the migration to
 * relational tables can happen incrementally without breaking the UI.
 */

const ATTR_KEYS = ['FOR', 'AGI', 'CHI', 'PER', 'RES', 'ESP'];

function toAttributeColumns(atributos = {}) {
  return ATTR_KEYS.reduce((acc, key) => {
    acc[`attr_${key.toLowerCase()}`] = atributos[key] ?? 8;
    return acc;
  }, {});
}

function fromAttributeColumns(row = {}) {
  return ATTR_KEYS.reduce((acc, key) => {
    acc[key] = row[`attr_${key.toLowerCase()}`] ?? 8;
    return acc;
  }, {});
}

export function characterToRow(userId, character = {}) {
  const identity = character.identidade || {};
  return {
    user_id: userId,
    name: identity.nome || '',
    element: identity.elemento || 'none',
    subclass: identity.subclasse || null,
    level: identity.nivel || 1,
    xp: identity.xp_atual || 0,
    gold: character.ouro || 0,
    age: identity.idade || null,
    gender: identity.genero || null,
    alignment: identity.alinhamento || null,
    notes: character.anotacoes || null,
    combat_path: character.combat_path || null,
    non_bender_path: character.non_bender_path || null,
    ...toAttributeColumns(character.atributos),
    points_available: character.pontos_disponiveis || 0,
    skills_data: character.habilidades || {},
    inventory_data: character.inventario || [],
    equipment_data: {
      equipamentos: character.equipamentos || {},
      moedas: character.moedas || {},
      scrolls: character.scrolls || {},
      status_effects: character.status_effects || [],
      subclass_bonus: character.subclass_bonus || {},
      itens: character.itens || [],
      skill_uses: character.skill_uses || {},
    },
  };
}

export function rowToCharacter(row = {}) {
  const equipmentBlob = row.equipment_data || {};
  return {
    id: row.id,
    identidade: {
      nome: row.name || '',
      elemento: row.element || 'none',
      subclasse: row.subclass || '',
      nivel: row.level || 1,
      xp_atual: row.xp || 0,
      idade: row.age || '',
      genero: row.gender || '',
      alinhamento: row.alignment || '',
    },
    atributos: fromAttributeColumns(row),
    pontos_disponiveis: row.points_available || 0,
    combat_path: row.combat_path || null,
    non_bender_path: row.non_bender_path || null,
    habilidades: row.skills_data || {},
    inventario: row.inventory_data || [],
    equipamentos: equipmentBlob.equipamentos || {},
    moedas: equipmentBlob.moedas || {},
    scrolls: equipmentBlob.scrolls || {},
    status_effects: equipmentBlob.status_effects || [],
    subclass_bonus: equipmentBlob.subclass_bonus || {},
    itens: equipmentBlob.itens || [],
    skill_uses: equipmentBlob.skill_uses || {},
    anotacoes: row.notes || '',
  };
}
