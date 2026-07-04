/**
 * Mapeador entre o shape flat da tabela `dnd_characters` (Supabase) e o
 * shape nested usado pelo `DnDCharacter` em runtime.
 *
 * Sem este mapper, ler do Supabase devolve as colunas top-level (`name`,
 * `race`, `hp_max`, …) que o modelo ignora (espera `data.identity.name`,
 * `data.combat.hp_max`, …). O resultado é todos os campos caírem em
 * defaults e o próximo autosave grava esses defaults sobre os reais.
 *
 * O mapper preserva também:
 *   • `classes` (jsonb, multiclass, adicionado em `20260629240000_…`)
 *   • `gold` (não tem coluna própria; vive em jsonb? — guardamos no
 *     campo `notes` é mau; em vez disso espelhamos no `inventory[0]`?
 *     Decisão: adicionamos coluna `gold int` na migration de extras se
 *     ainda não estiver lá — está, ver `_…_extras.sql`).
 */

export function rowToCharacter(row) {
  if (!row) return null;
  return {
    id: row.id,
    identity: {
      name: row.name || '',
      race: row.race || '',
      class: row.class || '',
      subclass: row.subclass || '',
      background: row.background || '',
      alignment: row.alignment || '',
      age: row.age || '',
      gender: row.gender || '',
    },
    classes: Array.isArray(row.classes) ? row.classes : [],
    level: row.level || 1,
    xp: row.xp || 0,
    gold: row.gold || 0,
    abilities: row.abilities || {},
    saves: row.saves || {},
    skills: row.skills || {},
    combat: {
      hp_max: row.hp_max ?? 10,
      hp_current: row.hp_current ?? 10,
      hp_temp: row.hp_temp ?? 0,
      ac: row.ac ?? 10,
      speed: row.speed ?? 30,
      hit_dice_total: row.hit_dice_total ?? 1,
      hit_dice_used: row.hit_dice_used ?? 0,
    },
    inventory: Array.isArray(row.inventory) ? row.inventory : [],
    spells: row.spells || {},
    features: Array.isArray(row.features) ? row.features : [],
    notes: row.notes || '',
  };
}

/**
 * Inverso: do shape nested para colunas flat prontas a `upsert`.
 * Inclui TODOS os campos persistíveis (sem perdas vs. localStorage).
 */
export function characterToRow(userId, character) {
  if (!character) return null;
  const identity = character.identity || {};
  const combat = character.combat || {};
  return {
    user_id: userId,
    name: identity.name || '',
    race: identity.race || null,
    class: identity.class || null,
    subclass: identity.subclass || null,
    background: identity.background || null,
    alignment: identity.alignment || null,
    age: identity.age || null,
    gender: identity.gender || null,
    classes: Array.isArray(character.classes) ? character.classes : [],
    level: character.level || 1,
    xp: character.xp || 0,
    gold: character.gold || 0,
    hp_max: combat.hp_max ?? 10,
    hp_current: combat.hp_current ?? 10,
    hp_temp: combat.hp_temp ?? 0,
    ac: combat.ac ?? 10,
    speed: combat.speed ?? 30,
    hit_dice_total: combat.hit_dice_total ?? 1,
    hit_dice_used: combat.hit_dice_used ?? 0,
    abilities: character.abilities || {},
    saves: character.saves || {},
    skills: character.skills || {},
    inventory: Array.isArray(character.inventory) ? character.inventory : [],
    spells: character.spells || {},
    features: Array.isArray(character.features) ? character.features : [],
    notes: character.notes || '',
  };
}
