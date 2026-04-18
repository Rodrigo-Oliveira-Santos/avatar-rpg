/**
 * XP and Level System
 */

import { GAME, XP, MILESTONES } from '../utils/constants.js';

/**
 * Calculate XP required for next level
 * @param {number} level - Current level
 * @returns {number} XP needed
 */
export function calculateXPForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(XP.FORMULA_BASE * Math.pow(level - 1, XP.FORMULA_EXPONENT));
}

/**
 * Get milestone title for a level
 * @param {number} level - Character level
 * @returns {string} Milestone title
 */
export function getMilestone(level) {
  const milestones = Object.keys(MILESTONES).map(Number).sort((a, b) => b - a);
  for (const milestone of milestones) {
    if (level >= milestone) {
      return MILESTONES[milestone];
    }
  }
  return 'Iniciante';
}

/**
 * Calculate total XP earned (cumulative)
 * @param {number} level - Current level
 * @returns {number} Total XP
 */
export function calculateTotalXP(level) {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += calculateXPForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total XP
 * @param {number} totalXP - Total XP earned
 * @returns {number} Level
 */
export function calculateLevelFromXP(totalXP) {
  let level = 1;
  while (totalXP >= calculateXPForLevel(level + 1)) {
    level++;
    if (level >= GAME.MAX_LEVEL) break;
  }
  return level;
}

/**
 * Get XP progress info
 * @param {number} currentXP - Current XP
 * @param {number} level - Current level
 * @returns {object} { currentXP, nextLevelXP, percentage }
 */
export function getXPProgress(currentXP, level) {
  const nextLevelXP = calculateXPForLevel(level + 1);
  const prevLevelXP = calculateXPForLevel(level);
  const range = nextLevelXP - prevLevelXP;
  const progress = currentXP - prevLevelXP;
  const percentage = range > 0 ? (progress / range) * 100 : 0;

  return {
    currentXP,
    nextLevelXP,
    percentage: Math.min(100, Math.max(0, percentage)),
  };
}
