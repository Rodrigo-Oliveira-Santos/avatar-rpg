/**
 * Tests for nation currency operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../public/js/character/subclasses.js', () => ({
  findSubclassDefinition: () => null,
  getSubclassesForElement: () => [],
}));

const { Character } = await import('../public/js/character/Character.js');
const { NATION_CURRENCIES } = await import('../public/js/utils/constants.js');

describe('Nation Currencies', () => {
  let character;

  beforeEach(() => {
    character = new Character();
    character.load({
      identidade: { nome: 'Test', elemento: 'fire', nivel: 5 },
      ouro: 500,
      moedas: { fire_coins: 50, water_coins: 0, earth_coins: 10, air_coins: 0, universal_coins: 5 },
    });
  });

  describe('getNationCoins', () => {
    it('returns current coin balances', () => {
      const coins = character.getNationCoins();
      expect(coins.fire_coins).toBe(50);
      expect(coins.earth_coins).toBe(10);
      expect(coins.universal_coins).toBe(5);
    });

    it('returns defaults for missing coins', () => {
      character.load({ identidade: { nome: 'New', elemento: 'water', nivel: 1 } });
      const coins = character.getNationCoins();
      expect(coins.fire_coins).toBe(0);
      expect(coins.water_coins).toBe(0);
    });
  });

  describe('addNationCoins', () => {
    it('adds coins to existing balance', () => {
      const result = character.addNationCoins('fire_coins', 25);
      expect(result).toBe(true);
      expect(character.getNationCoins().fire_coins).toBe(75);
    });

    it('adds coins from zero', () => {
      const result = character.addNationCoins('water_coins', 30);
      expect(result).toBe(true);
      expect(character.getNationCoins().water_coins).toBe(30);
    });

    it('rejects invalid currency id', () => {
      const result = character.addNationCoins('fake_coins', 10);
      expect(result).toBe(false);
    });

    it('handles adding zero coins', () => {
      character.addNationCoins('fire_coins', 0);
      expect(character.getNationCoins().fire_coins).toBe(50);
    });
  });

  describe('spendNationCoins', () => {
    it('spends coins when sufficient', () => {
      const result = character.spendNationCoins('fire_coins', 20);
      expect(result).toBe(true);
      expect(character.getNationCoins().fire_coins).toBe(30);
    });

    it('spends exact balance', () => {
      const result = character.spendNationCoins('fire_coins', 50);
      expect(result).toBe(true);
      expect(character.getNationCoins().fire_coins).toBe(0);
    });

    it('rejects when insufficient funds', () => {
      const result = character.spendNationCoins('fire_coins', 51);
      expect(result).toBe(false);
      expect(character.getNationCoins().fire_coins).toBe(50);
    });

    it('rejects spending from empty balance', () => {
      const result = character.spendNationCoins('water_coins', 1);
      expect(result).toBe(false);
    });

    it('rejects invalid currency id', () => {
      const result = character.spendNationCoins('fake_coins', 10);
      expect(result).toBe(false);
    });
  });

  describe('NATION_CURRENCIES constants', () => {
    it('has entries for all elements', () => {
      expect(NATION_CURRENCIES.fire).toBeDefined();
      expect(NATION_CURRENCIES.water).toBeDefined();
      expect(NATION_CURRENCIES.earth).toBeDefined();
      expect(NATION_CURRENCIES.air).toBeDefined();
      expect(NATION_CURRENCIES.none).toBeDefined();
    });

    it('each currency has id, label, icon, color', () => {
      Object.values(NATION_CURRENCIES).forEach(currency => {
        expect(currency.id).toBeTruthy();
        expect(currency.label).toBeTruthy();
        expect(currency.icon).toBeTruthy();
        expect(currency.color).toMatch(/^#/);
      });
    });
  });
});
