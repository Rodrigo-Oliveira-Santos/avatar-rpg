/**
 * Character Class
 * Main character state management with reactive updates
 */

import { GAME } from '../utils/constants.js';
import { calculateAllStats } from './stats.js';
import { getMilestone, getXPProgress } from './xp.js';
import { getAvailableSlots } from './slots.js';

/**
 * Create default character structure
 */
function createDefaultCharacter() {
  return {
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
    scrolls: {},
    anotacoes: '',
  };
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
    const { nivel, atributos } = this.data.identidade;

    // Calculate derived stats
    this.data.stats_derived = calculateAllStats(this.data.identidade);

    // Update milestone
    this.data.identidade.marco = getMilestone(nivel);

    // Update XP for next level
    this.data.identidade.xp_proximo_nivel = this.data.identidade.xp_atual + 1;

    // Recalculate available points
    this.recalculatePoints();
  }

  /**
   * Recalculate available attribute points
   */
  recalculatePoints() {
    const { nivel, atributos } = this.data.identidade;
    const totalPoints = (nivel - 1) * GAME.POINTS_PER_LEVEL;
    const spentPoints = Object.values(atributos).reduce((sum, val) => sum + (val - 8), 0);
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

    const current = this.data.identidade.atributos[attr];
    const newValue = current + delta;

    // Check limits
    if (newValue < 1) return false;
    if (this.data.pontos_disponiveis < -delta && delta > 0) return false;

    this.data.identidade.atributos[attr] = newValue;
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

    this.data.identidade.atributos[attr] = value;
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
   * Add XP
   * @param {number} amount - XP to add
   */
  addXP(amount) {
    this.data.identidade.xp_atual += amount;
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
    this.data = { ...createDefaultCharacter(), ...data };
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
}
