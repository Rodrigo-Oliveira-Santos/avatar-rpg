import { describe, it, expect } from 'vitest';
import {
  calculateXPForLevel,
  getMilestone,
  calculateTotalXP,
  calculateLevelFromXP,
  getXPProgress,
} from '../public/js/character/xp.js';

describe('xp.js', () => {
  describe('calculateXPForLevel', () => {
    it('level 1 needs 0 XP', () => {
      expect(calculateXPForLevel(1)).toBe(0);
    });

    it('level 2 needs round(200 * 1^1.55) = 200', () => {
      expect(calculateXPForLevel(2)).toBe(200);
    });

    it('level 3 needs round(200 * 2^1.55)', () => {
      const expected = Math.round(200 * Math.pow(2, 1.55));
      expect(calculateXPForLevel(3)).toBe(expected);
    });

    it('XP increases with level', () => {
      for (let i = 3; i <= 10; i++) {
        expect(calculateXPForLevel(i)).toBeGreaterThan(calculateXPForLevel(i - 1));
      }
    });
  });

  describe('getMilestone', () => {
    it('level 1 is Iniciante', () => {
      expect(getMilestone(1)).toBe('Iniciante');
    });

    it('level 5 is Aprendiz', () => {
      expect(getMilestone(5)).toBe('Aprendiz');
    });

    it('level 10 is Discípulo', () => {
      expect(getMilestone(10)).toBe('Discípulo');
    });

    it('level 40 is Lendário', () => {
      expect(getMilestone(40)).toBe('Lendário');
    });

    it('level 7 still shows Aprendiz (last milestone reached)', () => {
      expect(getMilestone(7)).toBe('Aprendiz');
    });
  });

  describe('calculateTotalXP', () => {
    it('level 1 has 0 total XP', () => {
      expect(calculateTotalXP(1)).toBe(0);
    });

    it('level 2 has 200 total XP', () => {
      expect(calculateTotalXP(2)).toBe(200);
    });

    it('cumulative: level 3 = XP(2) + XP(3)', () => {
      expect(calculateTotalXP(3)).toBe(calculateXPForLevel(2) + calculateXPForLevel(3));
    });
  });

  describe('calculateLevelFromXP', () => {
    it('0 XP is level 1', () => {
      expect(calculateLevelFromXP(0)).toBe(1);
    });

    it('200 XP is level 2', () => {
      expect(calculateLevelFromXP(200)).toBe(2);
    });

    it('caps at max level 40', () => {
      expect(calculateLevelFromXP(999999999)).toBe(40);
    });
  });

  describe('getXPProgress', () => {
    it('returns percentage towards next level', () => {
      const xpNeeded = calculateXPForLevel(2); // 200
      const progress = getXPProgress(100, 1);
      expect(progress.currentXP).toBe(100);
      expect(progress.nextLevelXP).toBe(xpNeeded);
      expect(progress.percentage).toBe(50);
    });

    it('caps percentage at 100', () => {
      const progress = getXPProgress(9999, 1);
      expect(progress.percentage).toBe(100);
    });

    it('0 XP is 0%', () => {
      const progress = getXPProgress(0, 5);
      expect(progress.percentage).toBe(0);
    });
  });
});
