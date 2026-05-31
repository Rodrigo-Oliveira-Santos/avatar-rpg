import { describe, it, expect } from 'vitest';
import {
  calculateBaseSlots,
  calculateTotalSlots,
  canActivateSubSkill,
  getAvailableSlots,
} from '../public/js/character/slots.js';

describe('slots.js', () => {
  describe('calculateBaseSlots', () => {
    it('level 1 has 2 base slots', () => {
      expect(calculateBaseSlots(1)).toBe(2);
    });

    it('level 4 has 3 base slots (+1 at level 4)', () => {
      expect(calculateBaseSlots(4)).toBe(3);
    });

    it('level 7 has 4 base slots', () => {
      expect(calculateBaseSlots(7)).toBe(4);
    });

    it('level 40 has 2 + floor(39/3) = 15 slots', () => {
      expect(calculateBaseSlots(40)).toBe(15);
    });
  });

  describe('calculateTotalSlots (used for API compat)', () => {
    it('adds scroll bonus to base', () => {
      expect(calculateTotalSlots(1, 3)).toBe(5);
    });

    it('no scrolls = base only', () => {
      expect(calculateTotalSlots(10, 0)).toBe(calculateBaseSlots(10));
    });
  });

  describe('canActivateSubSkill', () => {
    it('allows activation when under cap', () => {
      const char = {
        habilidades: { skill1: { active: true, activeSubSkills: ['a', 'b'] } },
        scrolls: {},
      };
      expect(canActivateSubSkill(char, 'skill1')).toBe(true); // 2 < 3
    });

    it('blocks when at cap (3)', () => {
      const char = {
        habilidades: { skill1: { active: true, activeSubSkills: ['a', 'b', 'c'] } },
        scrolls: {},
      };
      expect(canActivateSubSkill(char, 'skill1')).toBe(false);
    });

    it('scrolls increase per-skill cap', () => {
      const char = {
        habilidades: { skill1: { active: true, activeSubSkills: ['a', 'b', 'c'] } },
        scrolls: { skill1: 2 },
      };
      expect(canActivateSubSkill(char, 'skill1')).toBe(true); // 3 < 5
    });
  });

  describe('getAvailableSlots', () => {
    it('no active sub-skills = all available', () => {
      const char = { identidade: { nivel: 4 }, habilidades: {}, scrolls: {} };
      const result = getAvailableSlots(char);
      expect(result.total).toBe(3); // base slots for level 4
      expect(result.used).toBe(0);
      expect(result.available).toBe(3);
    });

    it('counts used sub-skills', () => {
      const char = {
        identidade: { nivel: 7 },
        habilidades: {
          s1: { active: true, activeSubSkills: ['a', 'b'] },
          s2: { active: true, activeSubSkills: ['c'] },
        },
        scrolls: {},
      };
      const result = getAvailableSlots(char);
      expect(result.total).toBe(4); // base for level 7
      expect(result.used).toBe(3);
      expect(result.available).toBe(1);
    });

    it('scrolls do NOT inflate global pool (only per-skill)', () => {
      const char = {
        identidade: { nivel: 1 },
        habilidades: {},
        scrolls: { skill1: 5, skill2: 3 },
      };
      const result = getAvailableSlots(char);
      // Global total should be base only (2), not 2 + 8
      expect(result.total).toBe(2);
    });

    it('uses stored costs when definitions missing', () => {
      const char = {
        identidade: { nivel: 10 },
        habilidades: {
          s1: {
            active: true,
            activeSubSkills: ['expensive'],
            subSkillCosts: { expensive: 3 },
          },
        },
        scrolls: {},
      };
      const result = getAvailableSlots(char); // no definitions passed
      expect(result.used).toBe(3); // not 1
    });

    it('uses definitions when available for cost', () => {
      const char = {
        identidade: { nivel: 10 },
        habilidades: {
          s1: { active: true, activeSubSkills: ['sub1'] },
        },
        scrolls: {},
      };
      const definitions = [
        { id: 's1', sub_skills: [{ id: 'sub1', cost: 2 }] },
      ];
      const result = getAvailableSlots(char, definitions);
      expect(result.used).toBe(2);
    });
  });
});
