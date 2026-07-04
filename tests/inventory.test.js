import { describe, it, expect, beforeEach } from 'vitest';
import { createMockCharacter } from './helpers.js';
import {
  addItem,
  removeItem,
  equipItem,
  unequipItem,
  getInventory,
  getEquipped,
} from '../public/js/items/inventory.js';

describe('inventory.js', () => {
  let character;

  beforeEach(() => {
    character = createMockCharacter();
  });

  describe('addItem', () => {
    it('adds new item to inventory', () => {
      addItem(character, { id: 'sword1', name: 'Espada', type: 'weapon' });
      const inv = getInventory(character);
      expect(inv.length).toBe(1);
      expect(inv[0].name).toBe('Espada');
      expect(inv[0].quantity).toBe(1);
    });

    it('stacks duplicate items', () => {
      addItem(character, { id: 'potion1', name: 'Poção', type: 'consumable' });
      addItem(character, { id: 'potion1', name: 'Poção', type: 'consumable' });
      const inv = getInventory(character);
      expect(inv.length).toBe(1);
      expect(inv[0].quantity).toBe(2);
    });

    it('different items are separate entries', () => {
      addItem(character, { id: 'item1', name: 'A', type: 'weapon' });
      addItem(character, { id: 'item2', name: 'B', type: 'armor' });
      expect(getInventory(character).length).toBe(2);
    });
  });

  describe('removeItem', () => {
    it('removes item completely when quantity reaches 0', () => {
      addItem(character, { id: 'x', name: 'X', type: 'consumable' });
      removeItem(character, 'x', 1);
      expect(getInventory(character).length).toBe(0);
    });

    it('decrements quantity', () => {
      addItem(character, { id: 'x', name: 'X', type: 'consumable' });
      addItem(character, { id: 'x', name: 'X', type: 'consumable' });
      removeItem(character, 'x', 1);
      expect(getInventory(character)[0].quantity).toBe(1);
    });

    it('returns false for non-existent item', () => {
      expect(removeItem(character, 'nonexistent')).toBe(false);
    });
  });

  describe('equipItem', () => {
    it('equips weapon to arma slot', () => {
      addItem(character, { id: 'w1', name: 'Katana', type: 'weapon', damage: 8 });
      const result = equipItem(character, 'w1');
      expect(result.success).toBe(true);
      expect(getEquipped(character).arma.name).toBe('Katana');
    });

    it('equips armor to armadura slot', () => {
      addItem(character, { id: 'a1', name: 'Placa', type: 'armor', defense: 5 });
      const result = equipItem(character, 'a1');
      expect(result.success).toBe(true);
      expect(getEquipped(character).armadura.name).toBe('Placa');
    });

    it('removes item from inventory after equipping', () => {
      addItem(character, { id: 'w1', name: 'Katana', type: 'weapon' });
      equipItem(character, 'w1');
      expect(getInventory(character).length).toBe(0);
    });

    it('fails for non-existent item', () => {
      const result = equipItem(character, 'nope');
      expect(result.success).toBe(false);
    });

    it('fails for consumable (no slot)', () => {
      addItem(character, { id: 'c1', name: 'Poção', type: 'consumable' });
      const result = equipItem(character, 'c1');
      expect(result.success).toBe(false);
    });
  });

  describe('unequipItem', () => {
    it('returns item to inventory', () => {
      addItem(character, { id: 'w1', name: 'Katana', type: 'weapon' });
      equipItem(character, 'w1');
      const result = unequipItem(character, 'arma');
      expect(result.success).toBe(true);
      expect(getEquipped(character).arma).toBeNull();
      expect(getInventory(character).length).toBe(1);
    });

    it('fails for empty slot', () => {
      const result = unequipItem(character, 'arma');
      expect(result.success).toBe(false);
    });
  });
});
