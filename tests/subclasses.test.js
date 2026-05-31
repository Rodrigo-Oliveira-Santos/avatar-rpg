import { describe, it, expect } from 'vitest';
import {
  SUBCLASSES,
  getSubclassesForElement,
  findSubclassDefinition,
} from '../public/js/character/subclasses.js';

describe('subclasses.js', () => {
  describe('SUBCLASSES data', () => {
    it('has entries for all elements', () => {
      expect(SUBCLASSES.fire.length).toBeGreaterThanOrEqual(2);
      expect(SUBCLASSES.water.length).toBeGreaterThanOrEqual(2);
      expect(SUBCLASSES.earth.length).toBeGreaterThanOrEqual(2);
      expect(SUBCLASSES.air.length).toBeGreaterThanOrEqual(2);
      expect(SUBCLASSES.none.length).toBeGreaterThanOrEqual(2);
    });

    it('each subclass has required fields', () => {
      Object.values(SUBCLASSES).flat().forEach(sub => {
        expect(sub).toHaveProperty('id');
        expect(sub).toHaveProperty('name');
        expect(sub).toHaveProperty('requirements');
        expect(sub).toHaveProperty('bonus');
        expect(sub.requirements).toHaveProperty('nivel');
      });
    });
  });

  describe('getSubclassesForElement', () => {
    it('returns subclasses for fire', () => {
      const result = getSubclassesForElement('fire');
      expect(result.length).toBe(SUBCLASSES.fire.length);
    });

    it('returns empty array for unknown element', () => {
      expect(getSubclassesForElement('plasma')).toEqual([]);
    });
  });

  describe('findSubclassDefinition', () => {
    it('finds by id', () => {
      const result = findSubclassDefinition('blue_fire');
      expect(result).not.toBeNull();
      expect(result.name).toBe('Raio Azul');
    });

    it('finds by name', () => {
      const result = findSubclassDefinition('Dobra de Sangue');
      expect(result).not.toBeNull();
      expect(result.id).toBe('blood_bending');
    });

    it('returns null for non-existent', () => {
      expect(findSubclassDefinition('nonexistent')).toBeNull();
    });

    it('finds non-bender subclasses', () => {
      const result = findSubclassDefinition('strategist');
      expect(result).not.toBeNull();
      expect(result.name).toBe('Estrategista');
    });
  });

  describe('requirement checking logic', () => {
    it('subclass requirements include nivel and at least one attribute', () => {
      const blueFire = findSubclassDefinition('blue_fire');
      expect(blueFire.requirements.nivel).toBeGreaterThan(1);
      // Should have at least one attribute requirement
      const attrReqs = Object.keys(blueFire.requirements).filter(k => k !== 'nivel');
      expect(attrReqs.length).toBeGreaterThanOrEqual(1);
    });

    it('bonuses are attribute keys with positive values', () => {
      const validAttrs = ['FOR', 'AGI', 'CHI', 'PER', 'RES', 'ESP'];
      Object.values(SUBCLASSES).flat().forEach(sub => {
        Object.entries(sub.bonus).forEach(([key, value]) => {
          expect(validAttrs).toContain(key);
          expect(value).toBeGreaterThan(0);
        });
      });
    });
  });
});
