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

export function characterToRow(userId, character = {}, opts = {}) {
  const identity = character.identidade || {};
  const equipmentBlob = {
    equipamentos: character.equipamentos || {},
    moedas: character.moedas || {},
    scrolls: character.scrolls || {},
    subclass_bonus: character.subclass_bonus || {},
    itens: character.itens || [],
    skill_uses: character.skill_uses || {},
  };

  const row = {
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
    equipment_data: equipmentBlob,
  };

  // `status_effects` and the two note arrays live in their own columns so
  // their owners can update each independently of AutoSave (which writes
  // the full row otherwise).
  //   • status_effects → GM tooling
  //   • gm_notes       → GM tooling
  //   • player_notes   → player's own UI
  // AutoSave passes `omit*` flags to skip the columns it shouldn't touch.
  if (!opts.omitStatusEffects) {
    row.status_effects = Array.isArray(character.status_effects) ? character.status_effects : [];
  }
  if (!opts.omitGmNotes) {
    row.gm_notes = Array.isArray(character.gm_notes) ? character.gm_notes : [];
  }
  if (!opts.omitPlayerNotes) {
    row.player_notes = Array.isArray(character.player_notes) ? character.player_notes : [];
  }

  // Vitals (current HP/CP/SP) live on dedicated columns so the GM Control
  // panel can patch them with a targeted UPDATE without racing the
  // player's AutoSave. AutoSave passes `omitVitals: true` to skip them.
  if (!opts.omitVitals) {
    if (Number.isFinite(character.hp_current)) row.hp_current = character.hp_current;
    if (Number.isFinite(character.cp_current)) row.cp_current = character.cp_current;
    if (Number.isFinite(character.sp_current)) row.sp_current = character.sp_current;
  }

  return row;
}

export function rowToCharacter(row = {}) {
  const equipmentBlob = row.equipment_data || {};
  return {
    id: row.id,
    user_id: row.user_id || null,
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
    // Read status_effects from the dedicated column first (post-migration),
    // fall back to the legacy `equipment_data.status_effects` path for rows
    // that haven't been touched since the column was added.
    status_effects: Array.isArray(row.status_effects)
      ? row.status_effects
      : (Array.isArray(equipmentBlob.status_effects) ? equipmentBlob.status_effects : []),
    player_notes: Array.isArray(row.player_notes) ? row.player_notes : [],
    gm_notes:     Array.isArray(row.gm_notes)     ? row.gm_notes     : [],
    hp_current: Number.isFinite(row.hp_current) ? row.hp_current : null,
    cp_current: Number.isFinite(row.cp_current) ? row.cp_current : null,
    sp_current: Number.isFinite(row.sp_current) ? row.sp_current : null,
    subclass_bonus: equipmentBlob.subclass_bonus || {},
    itens: equipmentBlob.itens || [],
    skill_uses: equipmentBlob.skill_uses || {},
    anotacoes: row.notes || '',
  };
}
