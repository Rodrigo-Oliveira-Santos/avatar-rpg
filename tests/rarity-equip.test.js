/**
 * Tests for rarity equipment stat impact
 */

import { describe, it, expect } from 'vitest';

const {
  getEffectiveWeaponDamage,
  getEffectiveArmorDefense,
  getAccessoryDodgeBonus,
  getEquipmentBonuses,
  getEquipmentEffect,
  normalizeRarity,
  getRarityBonus,
} = await import('../public/js/character/stats.js');

describe('Rarity Normalization', () => {
  it('valid rarities pass through', () => {
    expect(normalizeRarity('common')).toBe('common');
    expect(normalizeRarity('rare')).toBe('rare');
    expect(normalizeRarity('epic')).toBe('epic');
    expect(normalizeRarity('legendary')).toBe('legendary');
  });

  it('unknown rarity defaults to common', () => {
    expect(normalizeRarity('mythical')).toBe('common');
    expect(normalizeRarity(undefined)).toBe('common');
    expect(normalizeRarity('')).toBe('common');
    expect(normalizeRarity(null)).toBe('common');
  });
});

describe('Rarity Bonuses', () => {
  it('common has no multiplier or extra', () => {
    const bonus = getRarityBonus('common');
    expect(bonus.multiplier).toBe(1.0);
    expect(bonus.extraStat).toBe(0);
  });

  it('rare has 1.15x multiplier and +1', () => {
    const bonus = getRarityBonus('rare');
    expect(bonus.multiplier).toBe(1.15);
    expect(bonus.extraStat).toBe(1);
  });

  it('epic has 1.3x multiplier and +2', () => {
    const bonus = getRarityBonus('epic');
    expect(bonus.multiplier).toBe(1.3);
    expect(bonus.extraStat).toBe(2);
  });

  it('legendary has 1.5x multiplier and +3', () => {
    const bonus = getRarityBonus('legendary');
    expect(bonus.multiplier).toBe(1.5);
    expect(bonus.extraStat).toBe(3);
  });
});

describe('Weapon Damage with Rarity', () => {
  const baseWeapon = { name: 'Sword', damage: 20, type: 'weapon' };

  it('common weapon: base damage only', () => {
    expect(getEffectiveWeaponDamage({ ...baseWeapon, rarity: 'common' })).toBe(20);
  });

  it('rare weapon: 20 × 1.15 rounded + 1 = 24', () => {
    expect(getEffectiveWeaponDamage({ ...baseWeapon, rarity: 'rare' })).toBe(24);
  });

  it('epic weapon: 20 × 1.3 rounded + 2 = 28', () => {
    expect(getEffectiveWeaponDamage({ ...baseWeapon, rarity: 'epic' })).toBe(28);
  });

  it('legendary weapon: 20 × 1.5 rounded + 3 = 33', () => {
    expect(getEffectiveWeaponDamage({ ...baseWeapon, rarity: 'legendary' })).toBe(33);
  });

  it('weapon with dice notation damage', () => {
    // 2d6 average = 7, × 1.5 = 10.5 rounded = 11, + 3 = 14
    const weapon = { name: 'Great Axe', damage: '2d6', rarity: 'legendary' };
    const dmg = getEffectiveWeaponDamage(weapon);
    expect(dmg).toBe(14); // round(7*1.5) + 3
  });
});

describe('Armor Defense with Rarity', () => {
  const baseArmor = { name: 'Plate', defense: 15, penalty: 3, type: 'armor' };

  it('common armor: base defense only', () => {
    expect(getEffectiveArmorDefense({ ...baseArmor, rarity: 'common' })).toBe(15);
  });

  it('rare armor: 15 × 1.15 rounded + 1 = 18', () => {
    expect(getEffectiveArmorDefense({ ...baseArmor, rarity: 'rare' })).toBe(18);
  });

  it('epic armor: 15 × 1.3 rounded + 2 = 22', () => {
    const effective = getEffectiveArmorDefense({ ...baseArmor, rarity: 'epic' });
    expect(effective).toBe(Math.round(15 * 1.3) + 2); // 20 + 2 = 22
  });

  it('legendary armor: 15 × 1.5 rounded + 3 = 26', () => {
    const effective = getEffectiveArmorDefense({ ...baseArmor, rarity: 'legendary' });
    expect(effective).toBe(Math.round(15 * 1.5) + 3); // 23 + 3 = 26
  });
});

describe('Accessory Dodge with Rarity', () => {
  it('common accessory: 0 dodge bonus', () => {
    expect(getAccessoryDodgeBonus({ name: 'Ring', rarity: 'common' })).toBe(0);
  });

  it('rare accessory: +1 dodge', () => {
    expect(getAccessoryDodgeBonus({ name: 'Ring', rarity: 'rare' })).toBe(1);
  });

  it('epic accessory: +2 dodge', () => {
    expect(getAccessoryDodgeBonus({ name: 'Ring', rarity: 'epic' })).toBe(2);
  });

  it('legendary accessory: +3 dodge', () => {
    expect(getAccessoryDodgeBonus({ name: 'Ring', rarity: 'legendary' })).toBe(3);
  });
});

describe('getEquipmentBonuses (integrated)', () => {
  it('empty equipment returns all zeros', () => {
    const bonuses = getEquipmentBonuses({});
    expect(bonuses.armorBonus).toBe(0);
    expect(bonuses.armorPenalty).toBe(0);
    expect(bonuses.weaponBonus).toBe(0);
    expect(bonuses.accessoryBonus).toBe(0);
  });

  it('full legendary equipment returns scaled values', () => {
    const bonuses = getEquipmentBonuses({
      arma: { damage: 20, rarity: 'legendary' },
      armadura: { defense: 15, penalty: 2, rarity: 'legendary' },
      acessorio: { name: 'Amulet', rarity: 'legendary' },
    });
    expect(bonuses.weaponBonus).toBe(33); // 20*1.5=30+3
    expect(bonuses.armorBonus).toBe(26); // round(15*1.5)+3=23+3
    expect(bonuses.armorPenalty).toBe(2);
    expect(bonuses.accessoryBonus).toBe(3);
  });
});

describe('getEquipmentEffect (detailed breakdown)', () => {
  it('weapon effect includes rarity breakdown', () => {
    const effect = getEquipmentEffect('arma', { damage: 10, rarity: 'epic' });
    expect(effect.slot).toBe('arma');
    expect(effect.rarityKey).toBe('epic');
    expect(effect.baseNumeric).toBe(10);
    expect(effect.scaledValue).toBe(13); // round(10*1.3)
    expect(effect.extraStat).toBe(2);
    expect(effect.finalValue).toBe(15); // 13+2
  });

  it('armor effect includes penalty', () => {
    const effect = getEquipmentEffect('armadura', { defense: 8, penalty: 1, rarity: 'rare' });
    expect(effect.slot).toBe('armadura');
    expect(effect.finalValue).toBe(Math.round(8 * 1.15) + 1); // 9+1=10
    expect(effect.penalty).toBe(1);
  });

  it('accessory effect is dodge-only', () => {
    const effect = getEquipmentEffect('acessorio', { name: 'Ring', rarity: 'legendary' });
    expect(effect.slot).toBe('acessorio');
    expect(effect.baseNumeric).toBe(0);
    expect(effect.finalValue).toBe(3);
  });

  it('returns null for unknown slot', () => {
    const effect = getEquipmentEffect('boots', { name: 'Boots', rarity: 'rare' });
    expect(effect).toBeNull();
  });

  it('returns null for null item', () => {
    const effect = getEquipmentEffect('arma', null);
    expect(effect).toBeNull();
  });
});
