/**
 * Character Class
 * Main character state management with reactive updates
 */

import { GAME, NATION_CURRENCIES, MASTERY_THRESHOLDS } from '../utils/constants.js';
import { calculateAllStats } from './stats.js';
import { getMilestone, getXPProgress, calculateXPForLevel } from './xp.js';
import { getAvailableSlots } from './slots.js';
import { findSubclassDefinition, getSubclassesForElement } from './subclasses.js';

/**
 * Map a usage counter (number of times a skill was used in play) to the
 * unlocked mastery level (0..3). Thresholds come from the canonical
 * skill trees: 15 / 50 / 150 uses.
 *
 * @param {number} uses
 * @returns {number} mastery level 0-3
 */
export function masteryLevelForUses(uses) {
  const n = Number(uses) || 0;
  let level = 0;
  for (let i = 0; i < MASTERY_THRESHOLDS.length; i++) {
    if (n >= MASTERY_THRESHOLDS[i]) level = i;
  }
  return level;
}

/**
 * Create default character structure
 */
function createDefaultNationCoins() {
  return Object.values(NATION_CURRENCIES).reduce((coins, currency) => {
    coins[currency.id] = 0;
    return coins;
  }, {});
}

function createDefaultCharacter() {
  return {
    id: null,
    identidade: {
      nome: '',
      elemento: 'fire',
      subclasse: '',
      nivel: 1,
      xp_atual: 0,
      xp_proximo_nivel: 0,
      marco: 'Iniciante',
      idade: '',
      genero: '',
      alinhamento: '',
      aparncia: '',
      historia: '',
    },
    atributos: {
      FOR: 8,
      AGI: 8,
      CHI: 8,
      PER: 8,
      RES: 8,
      ESP: 8,
    },
    pontos_disponiveis: 0,
    stats_derived: {},
    habilidades: {},
    itens: [],
    equipamentos: {
      arma: null,
      armadura: null,
      acessorio: null,
    },
    status_effects: [],
    inventario: [],
    ouro: 0,
    moedas: createDefaultNationCoins(),
    scrolls: {},
    anotacoes: '',
    subclass_bonus: {},
    /** 'precise' | 'brute' | null — locked at tier 3 in each skill tree. */
    combat_path: null,
    /** 'chiblocker' | 'weapons' | null — used when elemento === 'none'. */
    non_bender_path: null,
    /** { [skill_id]: usage_count } — drives mastery level (see masteryLevelForUses). */
    skill_uses: {},
  };
}

function normalizeCharacterData(data = {}) {
  const defaults = createDefaultCharacter();
  const normalized = {
    ...defaults,
    ...data,
    identidade: {
      ...defaults.identidade,
      ...(data.identidade || {}),
    },
    atributos: {
      ...defaults.atributos,
      ...(data.atributos || {}),
    },
    stats_derived: {
      ...defaults.stats_derived,
      ...(data.stats_derived || {}),
    },
    habilidades: data.habilidades || defaults.habilidades,
    itens: data.itens || defaults.itens,
    equipamentos: {
      ...defaults.equipamentos,
      ...(data.equipamentos || {}),
    },
    status_effects: data.status_effects || defaults.status_effects,
    inventario: data.inventario || defaults.inventario,
    moedas: {
      ...defaults.moedas,
      ...(data.moedas || {}),
    },
    scrolls: data.scrolls || defaults.scrolls,
    subclass_bonus: {
      ...defaults.subclass_bonus,
      ...(data.subclass_bonus || {}),
    },
  };

  const subclass = findSubclassDefinition(
    normalized.identidade.subclasse,
    normalized.identidade.elemento
  );

  if (subclass) {
    normalized.identidade.subclasse = subclass.name;
    normalized.subclass_bonus = { ...subclass.bonus };
  } else if (!normalized.identidade.subclasse) {
    normalized.subclass_bonus = {};
  }

  return normalized;
}

/**
 * Character Class
 */
export class Character {
  constructor() {
    this.data = createDefaultCharacter();
    this.listeners = [];
    this.lastSavedState = null;
    this.initialize();
  }

  /**
   * Initialize character with calculated values
   */
  initialize() {
    this.recalculateAll();
  }

  /**
   * Recalculate all derived values
   */
  recalculateAll() {
    const { nivel } = this.data.identidade;

    // Calculate derived stats
    this.data.stats_derived = calculateAllStats(this.data);

    // Update milestone
    this.data.identidade.marco = getMilestone(nivel);

    // Update XP for next level
    this.data.identidade.xp_proximo_nivel = calculateXPForLevel(nivel + 1);

    // Recalculate available points
    this.recalculatePoints();
  }

  /**
   * Recalculate available attribute points
   */
  recalculatePoints() {
    const { nivel } = this.data.identidade;
    const totalPoints = (nivel - 1) * GAME.POINTS_PER_LEVEL;
    const spentPoints = Object.values(this.data.atributos).reduce((sum, val) => sum + (val - 8), 0);
    this.data.pontos_disponiveis = totalPoints - spentPoints;
  }

  /**
   * Update attribute value
   * @param {string} attr - Attribute name (FOR, AGI, etc.)
   * @param {number} delta - Change amount (+1 or -1)
   * @returns {boolean} Success
   */
  updateAttribute(attr, delta) {
    const validAttrs = Object.keys(this.data.atributos);
    if (!validAttrs.includes(attr)) return false;

    const current = this.data.atributos[attr];
    const newValue = current + delta;

    // Check limits
    if (newValue < 1) return false;
    if (delta > 0 && this.data.pontos_disponiveis <= 0) return false;

    this.data.atributos[attr] = newValue;
    this.recalculateAll();
    this.notify();
    return true;
  }

  /**
   * Set attribute to specific value
   * @param {string} attr - Attribute name
   * @param {number} value - New value
   * @returns {boolean} Success
   */
  setAttribute(attr, value) {
    const validAttrs = Object.keys(this.data.atributos);
    if (!validAttrs.includes(attr)) return false;

    if (value < 1) return false;

    this.data.atributos[attr] = value;
    this.recalculateAll();
    this.notify();
    return true;
  }

  /**
   * Update level
   * @param {number} newLevel - New level
   * @returns {boolean} Success
   */
  setLevel(newLevel) {
    if (newLevel < 1 || newLevel > GAME.MAX_LEVEL) return false;

    this.data.identidade.nivel = newLevel;
    this.recalculateAll();
    this.notify();
    return true;
  }

  /**
   * Add XP and handle automatic level-ups
   * @param {number} amount - XP to add
   */
  addXP(amount) {
    this.data.identidade.xp_atual += amount;

    // Check for level-ups
    let nivel = this.data.identidade.nivel;
    while (nivel < GAME.MAX_LEVEL) {
      const xpNeeded = calculateXPForLevel(nivel + 1);
      if (this.data.identidade.xp_atual >= xpNeeded) {
        this.data.identidade.xp_atual -= xpNeeded;
        nivel++;
      } else {
        break;
      }
    }
    this.data.identidade.nivel = nivel;

    this.recalculateAll();
    this.notify();
  }

  /**
   * Toggle skill activation
   * @param {string} skillId - Skill identifier
   * @param {boolean} active - Activation state
   */
  toggleSkill(skillId, active) {
    if (!this.data.habilidades[skillId]) {
      this.data.habilidades[skillId] = {
        active: false,
        activeSubSkills: [],
      };
    }
    this.data.habilidades[skillId].active = active;
    this.notify();
  }

  /**
   * Increment the usage counter for a skill. Drives the mastery system
   * (M0..M3 unlocked at MASTERY_THRESHOLDS).
   * @param {string} skillId
   * @param {number} amount
   * @returns {number} new use count
   */
  recordSkillUse(skillId, amount = 1) {
    if (!this.data.skill_uses || typeof this.data.skill_uses !== 'object') {
      this.data.skill_uses = {};
    }
    const current = Number(this.data.skill_uses[skillId]) || 0;
    const next = Math.max(0, current + amount);
    this.data.skill_uses[skillId] = next;
    this.notify();
    return next;
  }

  /**
   * Compute the current mastery level (0..3) for a skill from its use count.
   * @param {string} skillId
   * @returns {number}
   */
  getMasteryLevel(skillId) {
    return masteryLevelForUses(this.data.skill_uses?.[skillId] || 0);
  }

  /**
   * Lock the combat path (precise vs brute). Once set, the player cannot
   * unlock tier 3+ skills from the other branch.
   * @param {'precise'|'brute'|null} path
   */
  setCombatPath(path) {
    if (path !== null && path !== 'precise' && path !== 'brute') {
      throw new Error(`Invalid combat_path: ${path}`);
    }
    this.data.combat_path = path;
    this.notify();
  }

  /**
   * Choose a non-bender path (only meaningful when elemento === 'none').
   * @param {'chiblocker'|'weapons'|null} path
   */
  setNonBenderPath(path) {
    if (path !== null && path !== 'chiblocker' && path !== 'weapons') {
      throw new Error(`Invalid non_bender_path: ${path}`);
    }
    this.data.non_bender_path = path;
    this.notify();
  }

  getCurrentSubclassDefinition() {
    return findSubclassDefinition(
      this.data.identidade.subclasse,
      this.data.identidade.elemento
    );
  }

  getSubclassBonus() {
    const currentSubclass = this.getCurrentSubclassDefinition();
    if (currentSubclass) {
      return { ...currentSubclass.bonus };
    }

    return { ...(this.data.subclass_bonus || {}) };
  }

  getTotalAttributes() {
    const subclassBonus = this.getSubclassBonus();
    return Object.keys(this.data.atributos).reduce((totals, attr) => {
      totals[attr] = (this.data.atributos[attr] || 0) + (subclassBonus[attr] || 0);
      return totals;
    }, {});
  }

  canUnlockSubclass(subclass) {
    const subclassDef = typeof subclass === 'string'
      ? findSubclassDefinition(subclass, this.data.identidade.elemento)
      : subclass;

    if (!subclassDef || this.data.identidade.subclasse) return false;

    const totalAttributes = this.getTotalAttributes();

    return Object.entries(subclassDef.requirements || {}).every(([key, requiredValue]) => {
      if (key === 'nivel') {
        return (this.data.identidade.nivel || 0) >= requiredValue;
      }

      return (totalAttributes[key] || 0) >= requiredValue;
    });
  }

  getAvailableSubclasses() {
    return getSubclassesForElement(this.data.identidade.elemento)
      .filter(subclass => this.canUnlockSubclass(subclass));
  }

  unlockSubclass(subclassId) {
    if (this.data.identidade.subclasse) return false;

    const subclass = getSubclassesForElement(this.data.identidade.elemento)
      .find(option => option.id === subclassId);

    if (!subclass || !this.canUnlockSubclass(subclass)) return false;

    this.data.identidade.subclasse = subclass.name;
    this.data.subclass_bonus = { ...subclass.bonus };
    this.recalculateAll();
    this.notify();
    return true;
  }

  /**
   * Get full character data
   * @returns {object} Character data
   */
  getData() {
    return { ...this.data };
  }

  /**
   * Get serialized data for save/export
   * @returns {object} Serializable data
   */
  serialize() {
    return JSON.parse(JSON.stringify(this.data));
  }

  /**
   * Load character from data
   * @param {object} data - Character data
   */
  load(data) {
    this.data = normalizeCharacterData(data);
    this.recalculateAll();
    this.notify();
  }

  /**
   * Reset character to defaults
   */
  reset() {
    this.data = createDefaultCharacter();
    this.initialize();
    this.notify();
  }

  /**
   * Subscribe to changes
   * @param {Function} callback - Listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of change
   */
  notify() {
    this.listeners.forEach(cb => cb(this.data));
  }

  /**
   * Get XP progress
   * @returns {object} XP progress info
   */
  getXPProgress() {
    return getXPProgress(
      this.data.identidade.xp_atual,
      this.data.identidade.nivel
    );
  }

  /**
   * Get available sub-skill slots
   * @returns {object} Slots info
   */
  getSlots() {
    return getAvailableSlots(this.data);
  }

  /**
   * Get derived stats
   * @returns {object} Derived stats
   */
  getStats() {
    return { ...this.data.stats_derived };
  }

  /**
   * Get current gold
   * @returns {number}
   */
  getGold() {
    return this.data.ouro || 0;
  }

  /**
   * Add gold to character
   * @param {number} amount - Amount to add
   * @returns {boolean} Success
   */
  addGold(amount) {
    if (amount <= 0) return false;
    this.data.ouro = (this.data.ouro || 0) + amount;
    this.notify();
    return true;
  }

  /**
   * Spend gold
   * @param {number} amount - Amount to spend
   * @returns {boolean} Success (false if insufficient)
   */
  spendGold(amount) {
    if (amount <= 0) return false;
    if ((this.data.ouro || 0) < amount) return false;
    this.data.ouro -= amount;
    this.notify();
    return true;
  }

  /**
   * Get nation currency balances
   * @returns {object}
   */
  getNationCoins() {
    const defaults = createDefaultNationCoins();
    return { ...defaults, ...(this.data.moedas || {}) };
  }

  /**
   * Add national currency to character
   * @param {string} currencyId - Currency identifier
   * @param {number} amount - Amount to add
   * @returns {boolean} Success
   */
  addNationCoins(currencyId, amount) {
    if (!Object.values(NATION_CURRENCIES).some(currency => currency.id === currencyId)) return false;
    if (amount <= 0) return false;
    this.data.moedas = this.getNationCoins();
    this.data.moedas[currencyId] += amount;
    this.notify();
    return true;
  }

  /**
   * Spend national currency
   * @param {string} currencyId - Currency identifier
   * @param {number} amount - Amount to spend
   * @returns {boolean} Success
   */
  spendNationCoins(currencyId, amount) {
    if (!Object.values(NATION_CURRENCIES).some(currency => currency.id === currencyId)) return false;
    if (amount <= 0) return false;
    this.data.moedas = this.getNationCoins();
    if ((this.data.moedas[currencyId] || 0) < amount) return false;
    this.data.moedas[currencyId] -= amount;
    this.notify();
    return true;
  }
}
