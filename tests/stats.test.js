import { describe, it, expect } from 'vitest';
import {
  calculateMaxHP,
  calculateMaxSP,
  calculateMaxCP,
  calculateDefense,
  calculateDodge,
  calculateAllStats,
  calculateAttributeTotals,
  getEffectiveWeaponDamage,
  getEffectiveArmorDefense,
  getAccessoryDodgeBonus,
  parseDamageValue,
  normalizeRarity,
} from '../public/js/character/stats.js';

describe('stats.js', () => {
  describe('calculateMaxHP', () => {
    it('level 1, FOR 10 → 10 + 8 + 30 = 48', () => {
      expect(calculateMaxHP(1, 10)).toBe(48);
    });

    it('level 10, FOR 15 → 10 + 80 + 45 = 135', () => {
      expect(calculateMaxHP(10, 15)).toBe(135);
    });

    it('level 40, FOR 20 → 10 + 320 + 60 = 390', () => {
      expect(calculateMaxHP(40, 20)).toBe(390);
    });
  });

  describe('calculateMaxSP', () => {
    it('level 1, ESP 10 → 8 + 6 + 30 = 44', () => {
      expect(calculateMaxSP(1, 10)).toBe(44);
    });

    it('level 15, ESP 12 → 8 + 90 + 36 = 134', () => {
      expect(calculateMaxSP(15, 12)).toBe(134);
    });
  });

  describe('calculateMaxCP', () => {
    it('level 1, CHI 10 → 6 + 5 + 40 = 51', () => {
      expect(calculateMaxCP(1, 10)).toBe(51);
    });

    it('level 20, CHI 14 → 6 + 100 + 56 = 162', () => {
      expect(calculateMaxCP(20, 14)).toBe(162);
    });
  });

  describe('calculateDefense', () => {
    it('level 1, RES 10 → 20 + 1 = 21', () => {
      expect(calculateDefense(1, 10)).toBe(21);
    });

    it('level 10, RES 15 → 30 + 10 = 40', () => {
      expect(calculateDefense(10, 15)).toBe(40);
    });
  });

  describe('calculateDodge', () => {
    it('AGI 10, PER 10 → 10 + (20+10)*0.2 = 16', () => {
      expect(calculateDodge(10, 10)).toBe(16);
    });

    it('AGI 8, PER 8 → 10 + (16+8)*0.2 = 14.8 → 15', () => {
      expect(calculateDodge(8, 8)).toBe(15);
    });
  });

  describe('calculateAttributeTotals', () => {
    it('adds subclass bonus to base attributes', () => {
      const base = { FOR: 10, AGI: 8, CHI: 12, PER: 10, RES: 10, ESP: 10 };
      const bonus = { CHI: 2, FOR: 1 };
      const result = calculateAttributeTotals(base, bonus);
      expect(result.FOR).toBe(11);
      expect(result.CHI).toBe(14);
      expect(result.AGI).toBe(8);
    });

    it('handles missing bonus gracefully', () => {
      const base = { FOR: 10, AGI: 10, CHI: 10, PER: 10, RES: 10, ESP: 10 };
      const result = calculateAttributeTotals(base, {});
      expect(result.FOR).toBe(10);
    });
  });

  describe('parseDamageValue', () => {
    it('parses numeric value', () => {
      expect(parseDamageValue(8)).toBe(8);
      expect(parseDamageValue('12')).toBe(12);
    });

    it('parses dice notation (average)', () => {
      // 2d6 = 2 * (6+1)/2 = 7
      expect(parseDamageValue('2d6')).toBe(7);
      // 1d8+2 = 1 * (8+1)/2 + 2 = 4.5 + 2 = 6.5
      expect(parseDamageValue('1d8+2')).toBe(6.5);
    });

    it('returns 0 for invalid', () => {
      expect(parseDamageValue(null)).toBe(0);
      expect(parseDamageValue('')).toBe(0);
    });
  });

  describe('normalizeRarity', () => {
    it('returns valid rarities as-is', () => {
      expect(normalizeRarity('common')).toBe('common');
      expect(normalizeRarity('legendary')).toBe('legendary');
    });

    it('defaults invalid to common', () => {
      expect(normalizeRarity('invalid')).toBe('common');
      expect(normalizeRarity(undefined)).toBe('common');
    });
  });

  describe('rarity equipment bonuses', () => {
    it('common weapon: multiplier 1.0, +0', () => {
      expect(getEffectiveWeaponDamage({ damage: 10, rarity: 'common' })).toBe(10);
    });

    it('rare weapon: multiplier 1.15, +1', () => {
      // round(10 * 1.15) + 1 = 12
      expect(getEffectiveWeaponDamage({ damage: 10, rarity: 'rare' })).toBe(13);
    });

    it('legendary armor: multiplier 1.5, +3', () => {
      // round(8 * 1.5) + 3 = 12 + 3 = 15
      expect(getEffectiveArmorDefense({ defense: 8, rarity: 'legendary' })).toBe(15);
    });

    it('accessory only gives extraStat dodge bonus', () => {
      expect(getAccessoryDodgeBonus({ rarity: 'epic' })).toBe(2);
      expect(getAccessoryDodgeBonus(null)).toBe(0);
    });
  });

  describe('calculateAllStats', () => {
    it('computes all derived stats with equipment', () => {
      const charData = {
        identidade: { nivel: 5 },
        atributos: { FOR: 12, AGI: 10, CHI: 10, PER: 10, RES: 10, ESP: 10 },
        subclass_bonus: {},
        equipamentos: {
          arma: { damage: 6, rarity: 'rare' },
          armadura: { defense: 4, rarity: 'common' },
          acessorio: { rarity: 'rare' },
        },
      };

      const stats = calculateAllStats(charData);
      expect(stats.maxHP).toBe(10 + 40 + 36); // 86
      expect(stats.defense).toBe(20 + 5 + 4); // base + armor
      expect(stats.danoBase).toBeGreaterThan(6); // rare boosts it
      expect(stats.dodge).toBeGreaterThan(0);
    });

    it('handles empty character gracefully', () => {
      const stats = calculateAllStats({});
      expect(stats.maxHP).toBe(10 + 8 + 0); // level 1, FOR 0
      expect(stats.defense).toBe(0 + 1); // RES 0, level 1
    });
  });
});
