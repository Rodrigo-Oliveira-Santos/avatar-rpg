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

export const CATEGORIES = {
  spirit: 'Espiritualidade',
  agility: 'Agilidade',
  precise: 'Combate Preciso',
  brute: 'Combate Bruto',
};

export const TIERS = {
  1: 'Iniciante',
  2: 'Avançado',
  3: 'Mestre',
  4: 'Lendário',
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
