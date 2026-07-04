/**
 * D&D 5e Character model.
 *
 * Tem três responsabilidades:
 *   1. Manter a estrutura de dados serializável (export/import JSON).
 *   2. Calcular bónus derivados (modificadores, save bonus, perícias, DC).
 *   3. Aplicar deltas (XP gain, HP changes, level-up) preservando invariantes.
 */

import {
  ABILITIES,
  SKILLS,
  XP_TABLE,
  CLASSES,
  abilityMod,
  profBonus,
  levelFromXp,
  xpForNext,
  getClass,
} from './data/srd.js';

const DEFAULT_ABILITIES = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };

function emptySaves() {
  return ABILITIES.reduce((acc, ab) => { acc[ab] = false; return acc; }, {});
}

function emptySkills() {
  return SKILLS.reduce((acc, sk) => { acc[sk.id] = { prof: false, expertise: false }; return acc; }, {});
}

function emptySpellSlots() {
  // 9 níveis de magia; o jogador define max manualmente conforme a sua
  // classe/nível (não calculamos slots progress aqui — fica flexível).
  const slots = {};
  for (let i = 1; i <= 9; i++) slots[i] = { max: 0, used: 0 };
  return slots;
}

export class DnDCharacter {
  constructor(data = {}) {
    this.id = data.id || null;
    this.identity = {
      name: '', race: '', class: '', subclass: '',
      background: '', alignment: '', age: '', gender: '',
      ...data.identity,
    };

    // ── Multiclass ────────────────────────────────────────────────
    // `classes` é a fonte canónica: array de { class, subclass, level }.
    // `identity.class` / `identity.subclass` espelham a primeira entrada
    // (compatibilidade com fichas single-class antigas e com a coluna
    // escalar `class` da DB).
    this.classes = normalizeClasses(data.classes, this.identity, Number(data.level) || 1);
    syncPrimaryClassToIdentity(this);

    // Nível total = soma dos níveis das classes ou (fallback) campo level.
    const summed = sumClassLevels(this.classes);
    this.level = summed > 0 ? summed : (Number(data.level) || 1);

    this.xp = Number(data.xp) || 0;
    this.gold = Number(data.gold) || 0;

    this.abilities = { ...DEFAULT_ABILITIES, ...data.abilities };
    this.saves = { ...emptySaves(), ...data.saves };
    this.skills = { ...emptySkills(), ...data.skills };

    this.combat = {
      hp_max: 10, hp_current: 10, hp_temp: 0,
      ac: 10, speed: 30, hit_dice_total: 1, hit_dice_used: 0,
      ...data.combat,
    };

    this.inventory = Array.isArray(data.inventory) ? data.inventory : [];

    this.spells = {
      cast_ability: '', // 'INT' | 'WIS' | 'CHA' | ''
      slots: emptySpellSlots(),
      known: [],
      prepared: [],
      ...data.spells,
    };
    // garantir estrutura completa dos slots após merge
    this.spells.slots = { ...emptySpellSlots(), ...this.spells.slots };

    this.features = Array.isArray(data.features) ? data.features : [];
    this.notes = data.notes || '';
  }

  // ─── Multiclass helpers (mutadores) ────────────────────────────
  addClass(classId, level = 1, subclass = '') {
    this.classes.push({ class: classId, subclass, level: Math.max(1, Math.min(20, Number(level) || 1)) });
    this._recomputeAfterClassChange();
  }

  removeClassAt(index) {
    if (index < 0 || index >= this.classes.length) return;
    this.classes.splice(index, 1);
    this._recomputeAfterClassChange();
  }

  updateClassAt(index, patch) {
    if (index < 0 || index >= this.classes.length) return;
    const cur = this.classes[index];
    if (patch.class !== undefined) cur.class = String(patch.class || '');
    if (patch.subclass !== undefined) cur.subclass = String(patch.subclass || '');
    if (patch.level !== undefined) cur.level = Math.max(1, Math.min(20, Number(patch.level) || 1));
    this._recomputeAfterClassChange();
  }

  _recomputeAfterClassChange() {
    syncPrimaryClassToIdentity(this);
    const summed = sumClassLevels(this.classes);
    if (summed > 0) this.level = summed;
  }

  // ─── Derived stats ───────────────────────────────────────────────

  mod(ab) { return abilityMod(this.abilities[ab]); }
  get prof() { return profBonus(this.level); }
  get initiative() { return this.mod('DEX'); }
  get passivePerception() {
    return 10 + this.skillBonus('perception');
  }

  saveBonus(ab) {
    return this.mod(ab) + (this.saves[ab] ? this.prof : 0);
  }

  skillBonus(skillId) {
    const sk = SKILLS.find((s) => s.id === skillId);
    if (!sk) return 0;
    const entry = this.skills[skillId] || { prof: false, expertise: false };
    let bonus = this.mod(sk.ability);
    if (entry.prof) bonus += this.prof * (entry.expertise ? 2 : 1);
    return bonus;
  }

  spellDC() {
    if (!this.spells.cast_ability) return null;
    return 8 + this.prof + this.mod(this.spells.cast_ability);
  }

  spellAttack() {
    if (!this.spells.cast_ability) return null;
    return this.prof + this.mod(this.spells.cast_ability);
  }

  classInfo() {
    return getClass(this.identity.class);
  }

  // ─── Mutations ───────────────────────────────────────────────────

  addXp(delta) {
    const safe = Math.max(-this.xp, Math.floor(Number(delta) || 0));
    this.xp += safe;
    // Multiclass: o nível é gerido manualmente (soma das classes). Só
    // fazemos auto-bump pelo XP quando não há classes configuradas
    // (modo legacy single-class).
    if (!Array.isArray(this.classes) || this.classes.length === 0) {
      this.level = levelFromXp(this.xp);
    }
  }

  xpForNext() { return xpForNext(this.level); }
  xpProgress() {
    const cur = this.xp;
    const next = this.xpForNext();
    if (next == null) return { current: cur, next: cur, pct: 100 };
    const floor = XP_TABLE[Math.max(1, Math.min(20, this.level))] || 0;
    return {
      current: cur,
      next,
      pct: Math.min(100, Math.round(((cur - floor) / (next - floor)) * 100)),
    };
  }

  setHp(value) {
    const max = this.combat.hp_max;
    this.combat.hp_current = Math.max(-max, Math.min(max, Math.floor(value)));
  }
  addHp(delta) { this.setHp(this.combat.hp_current + Math.floor(Number(delta) || 0)); }
  hpToMax() { this.combat.hp_current = this.combat.hp_max; }

  addGold(delta) {
    const v = Math.floor(Number(delta) || 0);
    this.gold = Math.max(0, this.gold + v);
  }

  // ─── Serialization ───────────────────────────────────────────────

  toJSON() {
    return {
      id: this.id,
      identity: this.identity,
      classes: this.classes,
      level: this.level,
      xp: this.xp,
      gold: this.gold,
      abilities: this.abilities,
      saves: this.saves,
      skills: this.skills,
      combat: this.combat,
      inventory: this.inventory,
      spells: this.spells,
      features: this.features,
      notes: this.notes,
    };
  }
}

// ─── Module-level helpers exported for the UI ────────────────────

/** Total level = soma dos níveis por classe (com fallback). */
export function totalLevel(character) {
  if (!character) return 1;
  const summed = sumClassLevels(character.classes);
  return summed > 0 ? summed : (character.level || 1);
}

/** Resumo textual das classes (ex.: "Fighter 3 / Wizard 2"). */
export function classesSummary(character) {
  if (!character?.classes?.length) return '';
  return character.classes
    .filter((c) => c.class)
    .map((c) => {
      const label = CLASSES.find((cl) => cl.id === c.class)?.label || c.class;
      return `${label} ${c.level || 1}${c.subclass ? ` (${c.subclass})` : ''}`;
    })
    .join(' / ');
}

// ─── Internal multiclass helpers ─────────────────────────────────

function normalizeClasses(input, identity = {}, fallbackLevel = 1) {
  if (Array.isArray(input) && input.length) {
    return input.map((entry) => ({
      class: String(entry?.class || ''),
      subclass: String(entry?.subclass || ''),
      level: Math.max(1, Math.min(20, Number(entry?.level) || 1)),
    }));
  }
  // Fallback: construir a partir de identity.class (fichas antigas)
  if (identity?.class) {
    return [{
      class: identity.class,
      subclass: identity.subclass || '',
      level: Math.max(1, Math.min(20, Number(fallbackLevel) || 1)),
    }];
  }
  return [];
}

function sumClassLevels(classes) {
  if (!Array.isArray(classes)) return 0;
  return classes.reduce((sum, c) => sum + (Number(c.level) || 0), 0);
}

function syncPrimaryClassToIdentity(character) {
  const first = character.classes[0];
  if (first) {
    character.identity.class = first.class || '';
    character.identity.subclass = first.subclass || '';
  }
}
