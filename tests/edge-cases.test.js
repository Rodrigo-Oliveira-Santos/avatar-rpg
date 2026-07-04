/**
 * Tests for boundary/edge cases in game formulas
 */

import { describe, it, expect } from 'vitest';

const {
  calculateMaxHP,
  calculateMaxSP,
  calculateMaxCP,
  calculateDefense,
  calculateDodge,
  getEffectiveWeaponDamage,
  getEffectiveArmorDefense,
  getAccessoryDodgeBonus,
} = await import('../public/js/character/stats.js');

const { calculateXPForLevel, calculateTotalXP } = await import('../public/js/character/xp.js');

describe('Edge Cases — Level Boundaries', () => {
  it('level 1 (minimum) produces valid stats', () => {
    expect(calculateMaxHP(1, 8)).toBe(10 + 8 + 24); // 42
    expect(calculateMaxCP(1, 8)).toBe(6 + 5 + 32); // 43
    expect(calculateMaxSP(1, 8)).toBe(8 + 6 + 24); // 38
  });

  it('level 40 (maximum) produces valid stats', () => {
    const hp = calculateMaxHP(40, 20);
    expect(hp).toBe(10 + 320 + 60); // 390
    const chi = calculateMaxCP(40, 20);
    expect(chi).toBe(6 + 200 + 80); // 286
    const spirit = calculateMaxSP(40, 20);
    expect(spirit).toBe(8 + 240 + 60); // 308
  });

  it('level 0 does not crash (theoretical edge)', () => {
    const hp = calculateMaxHP(0, 8);
    expect(hp).toBe(10 + 0 + 24); // 34
    expect(Number.isFinite(hp)).toBe(true);
  });
});

describe('Edge Cases — Zero Attributes', () => {
  it('all attributes at 0 produces base stats only', () => {
    expect(calculateMaxHP(1, 0)).toBe(10 + 8 + 0); // 18
    expect(calculateMaxCP(1, 0)).toBe(6 + 5 + 0); // 11
    expect(calculateMaxSP(1, 0)).toBe(8 + 6 + 0); // 14
    expect(calculateDefense(1, 0)).toBe(0 + 1); // 1
    expect(calculateDodge(0, 0)).toBe(10); // base only
  });

  it('dodge with zero AGI and PER', () => {
    const dodge = calculateDodge(0, 0);
    expect(dodge).toBe(10);
  });
});

describe('Edge Cases — Maximum Attributes', () => {
  it('high attributes (e.g. 50) produce scaled but finite results', () => {
    const hp = calculateMaxHP(40, 50);
    expect(Number.isFinite(hp)).toBe(true);
    expect(hp).toBe(10 + 320 + 150); // 480
  });

  it('all points invested in one attribute at max level', () => {
    // 40 levels × 3 points = 120 + base 8 = 128 in one attribute
    const hp = calculateMaxHP(40, 128);
    expect(hp).toBe(10 + 320 + 384); // 714
    expect(Number.isFinite(hp)).toBe(true);
  });
});

describe('Edge Cases — XP Formula', () => {
  it('XP for level 1 is 0 (no XP needed for first level)', () => {
    const xp = calculateXPForLevel(1);
    expect(xp).toBe(0);
  });

  it('XP for level 2 (minimum progression)', () => {
    const xp = calculateXPForLevel(2);
    expect(xp).toBe(Math.round(200 * Math.pow(1, 1.55)));
    expect(xp).toBeGreaterThan(0);
  });

  it('XP for level 40 (maximum) is finite and large', () => {
    const xp = calculateXPForLevel(40);
    expect(Number.isFinite(xp)).toBe(true);
    expect(xp).toBeGreaterThan(10000);
  });

  it('total XP to max level is cumulative', () => {
    const total = calculateTotalXP(40);
    expect(Number.isFinite(total)).toBe(true);
    expect(total).toBeGreaterThan(calculateXPForLevel(40));
  });
});

describe('Edge Cases — Equipment with null/undefined', () => {
  it('null weapon returns 0 damage', () => {
    expect(getEffectiveWeaponDamage(null)).toBe(0);
  });

  it('null armor returns 0 defense', () => {
    expect(getEffectiveArmorDefense(null)).toBe(0);
  });

  it('null accessory returns 0 dodge bonus', () => {
    expect(getAccessoryDodgeBonus(null)).toBe(0);
  });

  it('weapon with no damage field returns 0', () => {
    expect(getEffectiveWeaponDamage({ name: 'Broken Stick' })).toBe(0);
  });

  it('armor with no defense field returns 0', () => {
    expect(getEffectiveArmorDefense({ name: 'Torn Rags' })).toBe(0);
  });

  it('unknown rarity defaults to common (multiplier 1.0)', () => {
    const dmg = getEffectiveWeaponDamage({ damage: 10, rarity: 'mythical' });
    // common: multiplier 1.0, extraStat 0
    expect(dmg).toBe(10);
  });
});

describe('Edge Cases — Defense and Dodge', () => {
  it('defense with high RES and level', () => {
    // calculateDefense(level, RES) = RES*2 + level
    const def = calculateDefense(40, 50);
    expect(def).toBe(100 + 40); // 140
  });

  it('dodge stays at base with zero AGI/PER', () => {
    // calculateDodge(AGI, PER) = round(10 + ((AGI*2)+PER) * 0.2)
    const dodge = calculateDodge(0, 0);
    expect(dodge).toBe(10);
  });

  it('dodge formula applies correctly with high AGI', () => {
    // AGI=20, PER=10: round(10 + ((40 + 10) × 0.2)) = round(10 + 10) = 20
    const dodge = calculateDodge(20, 10);
    expect(dodge).toBe(20);
  });
});
