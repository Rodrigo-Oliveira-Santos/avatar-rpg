/**
 * Status Effects catalog
 *
 * Pre-defined buffs/debuffs the GM can apply to players or monsters.
 *
 * Shape:
 *   - id                 stable identifier saved in storage (kebab-case, ASCII)
 *   - name               human-readable label
 *   - type               'positive' (buff) | 'negative' (debuff)
 *   - icon               single-char emoji for chips/tooltips
 *   - description        one-line explanation
 *   - default_duration   default number of turns the effect lasts (null = until removed)
 *   - tick_when          'start' | 'end' — when (relative to the target's
 *                        turn) the engine ticks duration & applies damage
 *   - damage_per_turn    optional dice expression evaluated each tick
 *                        (e.g. '1d4', '2d6+1'). Frontend lets the GM
 *                        roll or input the amount manually before HP loss.
 *   - attribute_mod      flat modifiers applied to the target's effective
 *                        attribute totals (informational; GM applies them
 *                        manually at the table for now). Example: { AGI: -2 }.
 *
 * Custom effects created at runtime follow the same shape but
 * `id: 'custom-<slug>'` and `custom: true`.
 */

export const STATUS_EFFECTS = [
  // ── Negative (debuffs) ────────────────────────────────────
  { id: 'sangrando',    name: 'Sangrando',    type: 'negative', icon: '🩸', description: 'Perde HP por turno até ser curado.',
    default_duration: 3, tick_when: 'start', damage_per_turn: '1d4' },
  { id: 'atordoado',    name: 'Atordoado',    type: 'negative', icon: '💫', description: 'Perde a próxima ação.',
    default_duration: 1, tick_when: 'start' },
  { id: 'cego',         name: 'Cego',         type: 'negative', icon: '🕶️', description: 'Desvantagem em ataques e perceção visual.',
    default_duration: 2, tick_when: 'end', attribute_mod: { PER: -2 } },
  { id: 'enjoado',      name: 'Enjoado',      type: 'negative', icon: '🤢', description: 'Não pode usar habilidades que custem chi.',
    default_duration: 2, tick_when: 'end' },
  { id: 'fatigado',     name: 'Fatigado',     type: 'negative', icon: '😩', description: 'Penalidade em ações físicas e velocidade.',
    default_duration: 3, tick_when: 'end', attribute_mod: { FOR: -1, AGI: -1 } },
  { id: 'paralisado',   name: 'Paralisado',   type: 'negative', icon: '⚡', description: 'Não pode mover-se nem agir.',
    default_duration: 1, tick_when: 'start' },
  { id: 'lentidao',     name: 'Lentidão',     type: 'negative', icon: '🐌', description: 'Movimento reduzido a metade.',
    default_duration: 2, tick_when: 'end', attribute_mod: { AGI: -2 } },
  { id: 'aterrorizado', name: 'Aterrorizado', type: 'negative', icon: '😱', description: 'Tem de afastar-se da fonte do medo.',
    default_duration: 2, tick_when: 'start' },
  { id: 'queimadura',   name: 'Queimadura',   type: 'negative', icon: '🔥', description: 'Sofre dano de fogo por turno.',
    default_duration: 3, tick_when: 'start', damage_per_turn: '1d6' },
  { id: 'congelado',    name: 'Congelado',    type: 'negative', icon: '❄️', description: 'Movimento bloqueado; vulnerável a contundente.',
    default_duration: 1, tick_when: 'start', attribute_mod: { AGI: -3 } },
  { id: 'envenenado',   name: 'Envenenado',   type: 'negative', icon: '☠️', description: 'Perde HP por turno; desvantagem em CON.',
    default_duration: 4, tick_when: 'end', damage_per_turn: '1d4', attribute_mod: { RES: -1 } },

  // ── Positive (buffs) ──────────────────────────────────────
  { id: 'regeneracao',  name: 'Regeneração',  type: 'positive', icon: '💚', description: 'Recupera HP por turno.',
    default_duration: 3, tick_when: 'start', damage_per_turn: '-1d4' /* negative = heal */ },
  { id: 'acelerado',    name: 'Acelerado',    type: 'positive', icon: '⚡', description: 'Movimento e ações extra.',
    default_duration: 2, tick_when: 'end', attribute_mod: { AGI: 2 } },
  { id: 'escudo',       name: 'Escudo',       type: 'positive', icon: '🛡️', description: 'Defesa temporária aumentada.',
    default_duration: 3, tick_when: 'end', attribute_mod: { RES: 2 } },
  { id: 'concentrado',  name: 'Concentrado',  type: 'positive', icon: '🎯', description: 'Vantagem na próxima ação.',
    default_duration: 1, tick_when: 'end', attribute_mod: { PER: 2 } },
  { id: 'inspirado',    name: 'Inspirado',    type: 'positive', icon: '✨', description: 'Reroll disponível por sessão.',
    default_duration: null /* until used */, tick_when: 'end' },
  { id: 'invisivel',    name: 'Invisível',    type: 'positive', icon: '👻', description: 'Inimigos têm desvantagem para te detetar.',
    default_duration: 2, tick_when: 'end' },
  { id: 'voando',       name: 'A Voar',       type: 'positive', icon: '🦅', description: 'Pode mover-se em 3D, fora de alcance corpo-a-corpo.',
    default_duration: null, tick_when: 'end' },
];

const BY_ID = new Map(STATUS_EFFECTS.map((e) => [e.id, e]));

/** Lookup a built-in effect by id. Returns null for unknown ids (custom). */
export function getStatusEffect(id) {
  return BY_ID.get(id) || null;
}

/** Filter the catalog by polarity. */
export function getStatusEffectsByType(type) {
  return STATUS_EFFECTS.filter((e) => e.type === type);
}

/**
 * Normalise an entry stored on character/monster `status_effects`.
 *
 * Accepts the historical shapes (object with name/type, string label, or
 * already-normalised entry) and returns the full shape including
 * mechanical fields and per-application instance data:
 *   - `applied_at_turn`   — when (encounter `current_turn_index`) it was applied
 *   - `duration_turns`    — turns remaining (decremented each tick)
 *   - `tick_when`         — overridden tick timing (defaults to catalog)
 *   - `damage_per_turn`   — overridden damage expression (defaults to catalog)
 *
 * `custom` is true for entries that aren't in the built-in catalog.
 */
export function normalizeStatusEffect(raw) {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const built = BY_ID.get(raw);
    if (built) return { ...built, custom: false };
    return { id: raw, name: raw, type: 'negative', icon: '•', custom: true };
  }

  if (typeof raw !== 'object') return null;

  const id = raw.id || raw.name;
  if (!id) return null;
  const built = BY_ID.get(String(id).toLowerCase());

  // Merge per-application overrides on top of the catalog defaults.
  const base = built ? { ...built, custom: false } : {
    id: String(id),
    name: raw.name || raw.nome || raw.label || String(id),
    type: raw.type === 'positive' || raw.positive === true ? 'positive' : 'negative',
    icon: raw.icon || '•',
    description: raw.description || '',
    custom: true,
  };

  // Mechanical / instance fields the catalog doesn't own.
  const overrides = {};
  if ('duration_turns'  in raw) overrides.duration_turns  = raw.duration_turns;
  if ('applied_at_turn' in raw) overrides.applied_at_turn = raw.applied_at_turn;
  if ('tick_when'       in raw) overrides.tick_when       = raw.tick_when;
  if ('damage_per_turn' in raw) overrides.damage_per_turn = raw.damage_per_turn;
  if ('attribute_mod'   in raw) overrides.attribute_mod   = raw.attribute_mod;

  return { ...base, ...overrides };
}

/**
 * Serialise back into the persisted shape (small, lossless).
 *
 * For built-ins we keep only the per-application instance fields plus
 * id+type (so the catalog drives name/icon/description). For custom
 * effects we persist the full record.
 */
export function serializeStatusEffect(effect) {
  if (!effect) return null;
  const instance = {};
  ['duration_turns', 'applied_at_turn', 'tick_when', 'damage_per_turn', 'attribute_mod'].forEach((k) => {
    if (effect[k] !== undefined && effect[k] !== null) instance[k] = effect[k];
  });
  if (!effect.custom) return { id: effect.id, type: effect.type, ...instance };
  return {
    id: effect.id,
    name: effect.name,
    type: effect.type,
    icon: effect.icon,
    description: effect.description || '',
    custom: true,
    ...instance,
  };
}
