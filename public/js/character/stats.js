/**
 * Character Stats Calculator
 * Formulas for derived stats based on attributes, level, and equipment rarity
 */

import { RARITY_BONUSES } from '../utils/constants.js';

const ATTRIBUTE_KEYS = ['FOR', 'AGI', 'CHI', 'PER', 'RES', 'ESP'];
const DICE_NOTATION_REGEX = /^(\d+)d(\d+)([+-]\d+)?$/i;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeRarity(rarity) {
  return Object.prototype.hasOwnProperty.call(RARITY_BONUSES, rarity) ? rarity : 'common';
}

export function getRarityBonus(rarity) {
  return RARITY_BONUSES[normalizeRarity(rarity)];
}

export function parseDamageValue(damage) {
  if (typeof damage === 'number') return damage;
  if (typeof damage !== 'string') return 0;

  const trimmed = damage.trim();
  if (!trimmed) return 0;

  const numericDamage = Number(trimmed);
  if (Number.isFinite(numericDamage)) return numericDamage;

  const match = trimmed.match(DICE_NOTATION_REGEX);
  if (!match) return 0;

  const diceCount = Number(match[1]);
  const diceSides = Number(match[2]);
  const modifier = Number(match[3] || 0);
  return (diceCount * (diceSides + 1)) / 2 + modifier;
}

export function calculateAttributeTotals(atributos = {}, subclassBonus = {}) {
  return ATTRIBUTE_KEYS.reduce((totals, key) => {
    totals[key] = (atributos[key] || 0) + (subclassBonus[key] || 0);
    return totals;
  }, {});
}

export function getWeaponBaseDamage(item) {
  return parseDamageValue(item?.damage);
}

export function getArmorBaseDefense(item) {
  return toNumber(item?.defense ?? item?.defense_bonus, 0);
}

export function getArmorPenalty(item) {
  return toNumber(item?.penalty ?? item?.dodge_penalty, 0);
}

export function getEffectiveWeaponDamage(item) {
  if (!item) return 0;
  const rarity = getRarityBonus(item.rarity);
  return Math.round(getWeaponBaseDamage(item) * rarity.multiplier) + rarity.extraStat;
}

export function getEffectiveArmorDefense(item) {
  if (!item) return 0;
  const rarity = getRarityBonus(item.rarity);
  return Math.round(getArmorBaseDefense(item) * rarity.multiplier) + rarity.extraStat;
}

export function getAccessoryDodgeBonus(item) {
  if (!item) return 0;
  return getRarityBonus(item.rarity).extraStat;
}

export function getEquipmentBonuses(equipamentos = {}) {
  return {
    armorBonus: getEffectiveArmorDefense(equipamentos.armadura),
    armorPenalty: getArmorPenalty(equipamentos.armadura),
    weaponBonus: getEffectiveWeaponDamage(equipamentos.arma),
    accessoryBonus: getAccessoryDodgeBonus(equipamentos.acessorio),
  };
}

export function getEquipmentEffect(slot, item) {
  if (!item) return null;

  const rarityKey = normalizeRarity(item.rarity);
  const rarity = getRarityBonus(rarityKey);

  if (slot === 'arma') {
    const baseNumeric = getWeaponBaseDamage(item);
    const scaledValue = Math.round(baseNumeric * rarity.multiplier);
    return {
      slot,
      rarityKey,
      rarity,
      label: 'DMG',
      detailLabel: 'Dano',
      baseDisplay: item.damage ?? baseNumeric,
      baseNumeric,
      scaledValue,
      extraStat: rarity.extraStat,
      finalValue: scaledValue + rarity.extraStat,
    };
  }

  if (slot === 'armadura') {
    const baseNumeric = getArmorBaseDefense(item);
    const scaledValue = Math.round(baseNumeric * rarity.multiplier);
    return {
      slot,
      rarityKey,
      rarity,
      label: 'DEF',
      detailLabel: 'Defesa',
      baseDisplay: baseNumeric,
      baseNumeric,
      scaledValue,
      extraStat: rarity.extraStat,
      finalValue: scaledValue + rarity.extraStat,
      penalty: getArmorPenalty(item),
    };
  }

  if (slot === 'acessorio') {
    return {
      slot,
      rarityKey,
      rarity,
      label: 'ESQ',
      detailLabel: 'Esquiva',
      baseDisplay: 0,
      baseNumeric: 0,
      scaledValue: 0,
      extraStat: rarity.extraStat,
      finalValue: rarity.extraStat,
    };
  }

  return null;
}

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
 * @param {object} character - Character data with level, attributes, and equipment
 * @returns {object} Derived stats
 */
export function calculateAllStats(character = {}) {
  const { nivel = 1 } = character.identidade || {};
  const { FOR, AGI, CHI, PER, RES, ESP } = calculateAttributeTotals(
    character.atributos,
    character.subclass_bonus
  );
  const equipped = character.equipamentos || {};
  const { armorBonus, armorPenalty, weaponBonus, accessoryBonus } = getEquipmentBonuses(equipped);

  return {
    maxHP: calculateMaxHP(nivel, FOR),
    maxSP: calculateMaxSP(nivel, ESP),
    maxCP: calculateMaxCP(nivel, CHI),
    defense: calculateDefense(nivel, RES) + armorBonus,
    dodge: Math.max(0, calculateDodge(AGI, PER) - armorPenalty + accessoryBonus),
    danoBase: weaponBonus,
  };
}
