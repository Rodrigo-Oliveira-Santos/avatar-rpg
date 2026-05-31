import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockCharacter, setupLocalStorage } from './helpers.js';

// Mock LogService before importing scrolls
vi.mock('../public/js/admin/LogService.js', () => ({
  log: vi.fn(),
}));

// Mock import/storage (no DOM/localStorage in test for imported skills)
vi.mock('../public/js/import/storage.js', () => ({
  getImportedSkills: () => [],
}));

const { applyScroll, getEligibleSkills } = await import('../public/js/items/scrolls.js');

describe('scrolls.js', () => {
  let character;

  beforeEach(() => {
    setupLocalStorage();
    character = createMockCharacter({
      habilidades: {
        fire_spirit_1: { active: true, activeSubSkills: [] },
        fire_brute_1: { active: true, activeSubSkills: ['sub1'], mastered: false },
        fire_inactive: { active: false, activeSubSkills: [] },
      },
      inventario: [
        { id: 'scroll_slot_1', name: 'Pergaminho de Expansão', type: 'scroll', scrollType: 'slot_expand', quantity: 2 },
        { id: 'scroll_mastery', name: 'Pergaminho de Maestria', type: 'scroll', scrollType: 'mastery', quantity: 1 },
      ],
      scrolls: {},
    });
  });

  describe('applyScroll — slot_expand', () => {
    it('increases scroll bonus for target skill', () => {
      const scroll = character.data.inventario[0];
      const result = applyScroll(character, scroll, 'fire_spirit_1');
      expect(result.success).toBe(true);
      expect(character.data.scrolls.fire_spirit_1).toBe(1);
    });

    it('consumes scroll from inventory', () => {
      const scroll = character.data.inventario[0];
      applyScroll(character, scroll, 'fire_spirit_1');
      const remaining = character.data.inventario.find(i => i.id === 'scroll_slot_1');
      expect(remaining.quantity).toBe(1);
    });

    it('respects scrollValue > 1', () => {
      character.data.inventario.push({
        id: 'scroll_big', name: 'Big', type: 'scroll', scrollType: 'slot_expand', scrollValue: 3, quantity: 1,
      });
      const scroll = character.data.inventario.find(i => i.id === 'scroll_big');
      applyScroll(character, scroll, 'fire_spirit_1');
      expect(character.data.scrolls.fire_spirit_1).toBe(3);
    });

    it('fails on inactive skill', () => {
      const scroll = character.data.inventario[0];
      const result = applyScroll(character, scroll, 'fire_inactive');
      expect(result.success).toBe(false);
    });
  });

  describe('applyScroll — mastery', () => {
    it('marks skill as mastered', () => {
      const scroll = character.data.inventario[1];
      const result = applyScroll(character, scroll, 'fire_spirit_1');
      expect(result.success).toBe(true);
      expect(character.data.habilidades.fire_spirit_1.mastered).toBe(true);
    });

    it('fails if already mastered', () => {
      character.data.habilidades.fire_brute_1.mastered = true;
      const scroll = character.data.inventario[1];
      const result = applyScroll(character, scroll, 'fire_brute_1');
      expect(result.success).toBe(false);
    });
  });

  describe('applyScroll — validation', () => {
    it('rejects non-scroll items', () => {
      const notScroll = { id: 'sword', type: 'weapon' };
      const result = applyScroll(character, notScroll, 'fire_spirit_1');
      expect(result.success).toBe(false);
    });

    it('rejects if scroll not in inventory', () => {
      const fakeScroll = { id: 'nonexistent', type: 'scroll', scrollType: 'slot_expand' };
      const result = applyScroll(character, fakeScroll, 'fire_spirit_1');
      expect(result.success).toBe(false);
    });
  });

  describe('getEligibleSkills', () => {
    it('returns only active skills', () => {
      const scroll = { type: 'scroll', scrollType: 'slot_expand' };
      const eligible = getEligibleSkills(character, scroll);
      const ids = eligible.map(s => s.skillId);
      expect(ids).toContain('fire_spirit_1');
      expect(ids).toContain('fire_brute_1');
      expect(ids).not.toContain('fire_inactive');
    });

    it('mastery scroll excludes already-mastered skills', () => {
      character.data.habilidades.fire_brute_1.mastered = true;
      const scroll = { type: 'scroll', scrollType: 'mastery' };
      const eligible = getEligibleSkills(character, scroll);
      const ids = eligible.map(s => s.skillId);
      expect(ids).not.toContain('fire_brute_1');
      expect(ids).toContain('fire_spirit_1');
    });

    it('returns empty for non-scroll', () => {
      expect(getEligibleSkills(character, { type: 'weapon' })).toEqual([]);
    });
  });
});
