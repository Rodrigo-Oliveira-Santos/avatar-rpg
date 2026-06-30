/**
 * Avatar RPG — Game Constants
 */

export const GAME = {
  MAX_LEVEL: 40,
  POINTS_PER_LEVEL: 3,
  BASE_SUB_SKILL_SLOTS: 2,
  SUB_SKILL_SLOT_EVERY: 3, // +1 slot every 3 levels
  MAX_SUB_SKILLS_PER_SKILL: 3, // Cap per skill (scrolls can override)
};

export const XP = {
  FORMULA_EXPONENT: 1.55,
  FORMULA_BASE: 200,
};

export const MILESTONES = {
  5: 'Aprendiz',
  10: 'Discípulo',
  15: 'Praticante',
  20: 'Veterano',
  25: 'Especialista',
  30: 'Mestre',
  35: 'Grande Mestre',
  40: 'Lendário',
};

export const ATTRIBUTES = {
  FOR: { label: 'Força', class: 'cFOR' },
  AGI: { label: 'Agilidade', class: 'cAGI' },
  CHI: { label: 'Chi', class: 'cCHI' },
  PER: { label: 'Percepção', class: 'cPER' },
  RES: { label: 'Resistência', class: 'cRES' },
  ESP: { label: 'Espírito', class: 'cESP' },
};

export const ELEMENTS = ['fire', 'water', 'earth', 'air', 'none'];

/**
 * For `element === 'none'`, the player picks a non-bender path that
 * determines which skill tree is available. Mirrors the data in
 * docs/skill-trees/{chiblocker,weapons}.html.
 */
export const NON_BENDER_PATHS = {
  chiblocker: 'Bloqueador de Chi',
  weapons: 'Utilizador de Armas',
};

/**
 * Skill tree branches (mirrors the canonical HTML trees).
 *  - sp/ag: per-character branches available from tier 1
 *  - cb:    combat shared at tiers 1-2
 *  - pr/br: mutually exclusive paths unlocked at tier 3 (combat_path lock)
 */
export const SKILL_BRANCHES = {
  sp: { label: 'Espírito',  exclusive: false },
  ag: { label: 'Agilidade', exclusive: false },
  cb: { label: 'Combate',   exclusive: false },
  pr: { label: 'Preciso',   exclusive: true  },
  br: { label: 'Bruto',     exclusive: true  },
};

/**
 * Mastery progression — number of uses required to reach each mastery
 * level. M0 is the baseline; M1/M2/M3 are unlocked at these thresholds.
 */
export const MASTERY_THRESHOLDS = [0, 15, 50, 150];

export const NATION_CURRENCIES = {
  fire: { id: 'fire_coins', label: 'Moedas de Fogo', icon: '🔥', color: '#e74c3c' },
  water: { id: 'water_coins', label: 'Moedas de Água', icon: '💧', color: '#3498db' },
  earth: { id: 'earth_coins', label: 'Moedas de Terra', icon: '🪨', color: '#27ae60' },
  air: { id: 'air_coins', label: 'Moedas do Ar', icon: '🌪', color: '#f39c12' },
  none: { id: 'universal_coins', label: 'Moedas Universais', icon: '⭐', color: '#9b59b6' },
};

export const CATEGORIES = {
  spirit:  'Espiritualidade',
  agility: 'Agilidade',
  combat:  'Combate (N1-N2)',
  precise: 'Combate Preciso',
  brute:   'Combate Bruto',
};

/**
 * Hard caps for derived stats. `null` means "no cap".
 * Values to be defined later (decision pending). The dodge cap is fixed at 15.
 */
export const STAT_CAPS = {
  maxHP: null,
  maxSP: null,
  maxCP: null,
  defense: null,
  dodge: 15,
};

export const RARITY_BONUSES = {
  common: { multiplier: 1.0, extraStat: 0 },
  rare: { multiplier: 1.15, extraStat: 1 },
  epic: { multiplier: 1.3, extraStat: 2 },
  legendary: { multiplier: 1.5, extraStat: 3 },
};

export const TIERS = {
  1: 'Tier 1',
  2: 'Tier 2',
  3: 'Tier 3',
  4: 'Tier 4',
  5: 'Lendário',
};

export const POSITIONS = {
  def: 'Defensivo',
  off: 'Ofensivo',
  pass: 'Passivo',
  any: 'Qualquer',
};

export const STATUS_EFFECTS = {
  burn: { label: 'Queimadura', desc: 'Causa 1d4 dano no início de cada turno. Dura 2 turnos.' },
  freeze: { label: 'Congelamento', desc: 'Reduz velocidade de iniciativa a metade. Dura 2 turnos.' },
  shock: { label: 'Choque', desc: 'Causa 1d4 dano e 25% de saltar para aliados. Dura 1 turno.' },
  blind: { label: 'Cegueira', desc: 'Ataques têm 50% de falhar. Dura 2 turnos.' },
  slow: { label: 'Lentidão', desc: 'Reduz Esquiva em 4. Dura 2 turnos.' },
  stun: { label: 'Atordoado', desc: 'Perde a próxima ação. Defesa -5.' },
  poison: { label: 'Veneno', desc: 'Causa 1d6 dano por 3 turnos.' },
  regen: { label: 'Regeneração', desc: 'Restaura 1d4 PV ou Chi por turno.' },
  shield: { label: 'Escudo', desc: 'Absorve próxima fonte de dano.' },
  silence: { label: 'Silêncio', desc: 'Não pode usar habilidades de dobra. Dura 2 turnos.' },
  root: { label: 'Enraizado', desc: 'Impossível mover-se. Esquiva = 0.' },
  bleed: { label: 'Sangramento', desc: 'Causa 1d4 dano por 3 turnos.' },
  fear: { label: 'Medo', desc: 'Reduz dano em 1d4. 20% de fugir.' },
};

export const AUTOSAVE = {
  DEBOUNCE_MS: 2000,
  ENABLE_DIFF_CHECK: true,
  ENABLE_BEFOREUNLOAD: true,
  LOG_LEVEL: 'info', // 'debug' | 'info' | 'warn' | 'error'
};
