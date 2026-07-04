/**
 * Combat Resolver
 * Handles attack resolution, damage calculation, and defense
 */

import { rollNotation } from './dice.js';

/**
 * Resolve an attack roll
 * @param {number} attackBonus - Attacker's bonus
 * @param {number} dodge - Target's dodge value
 * @returns {object} { hit: boolean, roll: number, total: number }
 */
export function resolveAttack(attackBonus, dodge) {
  const d20 = rollNotation('1d20');
  const total = d20.total + attackBonus;

  return {
    hit: total > dodge,
    roll: d20.rolls[0],
    total,
    dodge,
  };
}

/**
 * Calculate damage after defense
 * @param {number} rawDamage - Raw damage rolled
 * @param {number} defense - Target's defense
 * @param {number} shield - Active shield absorption
 * @returns {number} Final damage
 */
export function calculateDamage(rawDamage, defense, shield = 0) {
  // Shield absorbs first
  let remaining = rawDamage - shield;
  if (remaining <= 0) return 0;

  // Defense reduces rest
  remaining = Math.max(0, remaining - defense);
  return remaining;
}

/**
 * Resolve full attack sequence
 * @param {object} attacker - Attacker data
 * @param {object} defender - Defender data
 * @param {object} attack - Attack definition
 * @returns {object} Attack result
 */
export function resolveFullAttack(attacker, defender, attack) {
  const result = {
    attack,
    hit: false,
    damage: 0,
    statuses: [],
    log: [],
  };

  // Roll attack
  const attackRoll = resolveAttack(attacker.attackBonus, defender.stats.dodge);
  result.attackRoll = attackRoll;

  if (!attackRoll.hit) {
    result.log.push(`Attack missed (rolled ${attackRoll.total} vs dodge ${attackRoll.dodge})`);
    return result;
  }

  result.hit = true;
  result.log.push(`Attack hit (rolled ${attackRoll.total} vs dodge ${attackRoll.dodge})`);

  // Roll damage
  if (attack.damage) {
    const damageRoll = rollNotation(attack.damage);
    const rawDamage = damageRoll.total;

    // Calculate final damage
    const finalDamage = calculateDamage(
      rawDamage,
      defender.stats.defense,
      defender.stats.shield || 0
    );

    result.damage = finalDamage;
    result.damageRoll = damageRoll;
    result.log.push(`Damage: ${rawDamage} - defense ${defender.stats.defense} - shield ${defender.stats.shield || 0} = ${finalDamage}`);
  }

  // Apply statuses
  if (attack.status && attack.status.length > 0) {
    result.statuses = attack.status;
    result.log.push(`Status effects: ${attack.status.join(', ')}`);
  }

  return result;
}

/**
 * Roll initiative for combat
 * @param {number} AGI - Agility attribute
 * @param {number} PER - Perception attribute
 * @returns {number} Initiative value
 */
export function rollInitiative(AGI, PER) {
  const base = (AGI * 2) + PER; // Same as dodge formula
  const d20 = rollNotation('1d20');
  return d20.total + base;
}
