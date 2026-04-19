/**
 * Character Stats Calculator
 * Formulas for derived stats based on attributes and level
 */

import { GAME } from '../utils/constants.js';

/**
 * Calculate maximum Health Points
 * @param {number} level - Character level
 * @param {number} FOR - Strength attribute
 * @returns {number} Max HP
 */
export function calculateMaxHP(level, FOR) {
  return 10 + (level * 8) + (FOR * 3);
}

/**
 * Calculate maximum Spirit Points
 * @param {number} level - Character level
 * @param {number} ESP - Spirit attribute
 * @returns {number} Max SP
 */
export function calculateMaxSP(level, ESP) {
  return 8 + (level * 6) + (ESP * 3);
}

/**
 * Calculate maximum Chi Points
 * @param {number} level - Character level
 * @param {number} CHI - Chi attribute
 * @returns {number} Max CP
 */
export function calculateMaxCP(level, CHI) {
  return 6 + (level * 5) + (CHI * 4);
}

/**
 * Calculate Defense
 * @param {number} level - Character level
 * @param {number} RES - Resistance attribute
 * @returns {number} Defense value
 */
export function calculateDefense(level, RES) {
  return (RES * 2) + level;
}

/**
 * Calculate Dodge (Esquiva)
 * @param {number} AGI - Agility attribute
 * @param {number} PER - Perception attribute
 * @returns {number} Dodge value
 */
export function calculateDodge(AGI, PER) {
  return Math.round(10 + ((AGI * 2) + PER) * 0.2);
}

/**
 * Calculate all derived stats at once
 * @param {object} character - Character object with level and attributes
 * @returns {object} Derived stats
 */
export function calculateAllStats(character) {
  const { nivel } = character.identidade;
  const { FOR, AGI, CHI, PER, RES, ESP } = character.atributos;

  return {
    maxHP: calculateMaxHP(nivel, FOR),
    maxSP: calculateMaxSP(nivel, ESP),
    maxCP: calculateMaxCP(nivel, CHI),
    defense: calculateDefense(nivel, RES),
    dodge: calculateDodge(AGI, PER),
  };
}
