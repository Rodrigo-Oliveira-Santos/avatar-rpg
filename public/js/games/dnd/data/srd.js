/**
 * D&D 5e — static SRD data tables used across the app.
 *
 * Kept intentionally lean: just enough to populate dropdowns and compute
 * derived bonuses. Class/race trait *text* is provided as a string so the
 * UI can show it, but the engine doesn't enforce any rule from it.
 */

export const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const ABILITY_NAMES = {
  STR: 'Força',
  DEX: 'Destreza',
  CON: 'Constituição',
  INT: 'Inteligência',
  WIS: 'Sabedoria',
  CHA: 'Carisma',
};

/**
 * 18 perícias do 5e SRD com a ability associada.
 * Chave em snake_case (estável para persistência).
 */
export const SKILLS = [
  { id: 'acrobatics', label: 'Acrobacia', ability: 'DEX' },
  { id: 'animal_handling', label: 'Lidar com Animais', ability: 'WIS' },
  { id: 'arcana', label: 'Arcano', ability: 'INT' },
  { id: 'athletics', label: 'Atletismo', ability: 'STR' },
  { id: 'deception', label: 'Enganação', ability: 'CHA' },
  { id: 'history', label: 'História', ability: 'INT' },
  { id: 'insight', label: 'Intuição', ability: 'WIS' },
  { id: 'intimidation', label: 'Intimidação', ability: 'CHA' },
  { id: 'investigation', label: 'Investigação', ability: 'INT' },
  { id: 'medicine', label: 'Medicina', ability: 'WIS' },
  { id: 'nature', label: 'Natureza', ability: 'INT' },
  { id: 'perception', label: 'Percepção', ability: 'WIS' },
  { id: 'performance', label: 'Atuação', ability: 'CHA' },
  { id: 'persuasion', label: 'Persuasão', ability: 'CHA' },
  { id: 'religion', label: 'Religião', ability: 'INT' },
  { id: 'sleight_of_hand', label: 'Prestidigitação', ability: 'DEX' },
  { id: 'stealth', label: 'Furtividade', ability: 'DEX' },
  { id: 'survival', label: 'Sobrevivência', ability: 'WIS' },
];

export const RACES = [
  'Humano', 'Elfo', 'Anão', 'Halfling', 'Meio-Elfo',
  'Meio-Orc', 'Tiefling', 'Dragonborn', 'Gnomo',
];

export const CLASSES = [
  { id: 'barbarian', label: 'Bárbaro', hit_die: 12, spell_ability: null },
  { id: 'bard',      label: 'Bardo',   hit_die: 8,  spell_ability: 'CHA' },
  { id: 'cleric',    label: 'Clérigo', hit_die: 8,  spell_ability: 'WIS' },
  { id: 'druid',     label: 'Druida',  hit_die: 8,  spell_ability: 'WIS' },
  { id: 'fighter',   label: 'Guerreiro', hit_die: 10, spell_ability: null },
  { id: 'monk',      label: 'Monge',   hit_die: 8,  spell_ability: null },
  { id: 'paladin',   label: 'Paladino', hit_die: 10, spell_ability: 'CHA' },
  { id: 'ranger',    label: 'Ranger',  hit_die: 10, spell_ability: 'WIS' },
  { id: 'rogue',     label: 'Ladino',  hit_die: 8,  spell_ability: null },
  { id: 'sorcerer',  label: 'Feiticeiro', hit_die: 6, spell_ability: 'CHA' },
  { id: 'warlock',   label: 'Bruxo',   hit_die: 8,  spell_ability: 'CHA' },
  { id: 'wizard',    label: 'Mago',    hit_die: 6,  spell_ability: 'INT' },
];

export const BACKGROUNDS = [
  'Acólito', 'Artesão', 'Charlatão', 'Criminoso', 'Eremita',
  'Forasteiro', 'Herói do Povo', 'Marinheiro', 'Nobre', 'Sábio', 'Soldado',
];

export const ALIGNMENTS = [
  'Leal e Bom', 'Neutro e Bom', 'Caótico e Bom',
  'Leal e Neutro', 'Neutro', 'Caótico e Neutro',
  'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau',
];

/**
 * Standard 5e XP-by-level table (1 → 20).
 * Index = level. Returns the minimum XP to be at that level.
 */
export const XP_TABLE = [
  0,        // unused slot for index 0
  0,        // lvl 1
  300,
  900,
  2700,
  6500,
  14000,
  23000,
  34000,
  48000,
  64000,    // lvl 10
  85000,
  100000,
  120000,
  140000,
  165000,
  195000,
  225000,
  265000,
  305000,
  355000,   // lvl 20
];

/** Modifier from an ability score (floor((s-10)/2)). */
export function abilityMod(score) {
  const v = Number(score);
  if (!Number.isFinite(v)) return 0;
  return Math.floor((v - 10) / 2);
}

/** Proficiency bonus from level (5e: +2 at 1-4, +3 at 5-8, …). */
export function profBonus(level) {
  const lvl = Math.max(1, Math.min(20, Number(level) || 1));
  return Math.ceil(lvl / 4) + 1;
}

/** Level for a given XP total (caps at 20). */
export function levelFromXp(xp) {
  const v = Math.max(0, Number(xp) || 0);
  for (let lvl = 20; lvl >= 1; lvl--) {
    if (v >= XP_TABLE[lvl]) return lvl;
  }
  return 1;
}

/** XP needed for the next level (returns null at 20). */
export function xpForNext(level) {
  const lvl = Number(level) || 1;
  if (lvl >= 20) return null;
  return XP_TABLE[lvl + 1];
}

export function getClass(id) {
  return CLASSES.find((c) => c.id === id) || null;
}
