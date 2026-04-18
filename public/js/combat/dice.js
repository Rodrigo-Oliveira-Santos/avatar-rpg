/**
 * Dice Rolling System
 */

/**
 * Roll a die with n sides
 * @param {number} sides - Number of sides
 * @returns {number} Roll result
 */
export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll multiple dice
 * @param {number} count - Number of dice
 * @param {number} sides - Sides per die
 * @returns {object} { rolls: number[], total: number }
 */
export function rollDice(count, sides) {
  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides));
  }
  return {
    rolls,
    total: rolls.reduce((a, b) => a + b, 0),
  };
}

/**
 * Parse and roll dice notation (e.g., "2d6+3")
 * @param {string} notation - Dice notation
 * @returns {object} { rolls: number[], modifier: number, total: number }
 */
export function rollNotation(notation) {
  const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  const [, countStr, sidesStr, modStr] = match;
  const count = parseInt(countStr, 10);
  const sides = parseInt(sidesStr, 10);
  const modifier = modStr ? parseInt(modStr, 10) : 0;

  const { rolls, total } = rollDice(count, sides);

  return {
    rolls,
    modifier,
    total: total + modifier,
  };
}

/**
 * Roll with advantage (take higher)
 * @param {number} sides - Die sides
 * @returns {number} Higher roll
 */
export function rollAdvantage(sides = 20) {
  return Math.max(rollDie(sides), rollDie(sides));
}

/**
 * Roll with disadvantage (take lower)
 * @param {number} sides - Die sides
 * @returns {number} Lower roll
 */
export function rollDisadvantage(sides = 20) {
  return Math.min(rollDie(sides), rollDie(sides));
}
