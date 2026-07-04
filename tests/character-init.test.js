/**
 * Tests for character initialization and element change behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../public/js/character/subclasses.js', () => ({
  findSubclassDefinition: (name, element) => {
    // Only return a match for 'Dragão Carmesim' on fire element
    if (name === 'Dragão Carmesim' && element === 'fire') {
      return { id: 'dragao_carmesim', name: 'Dragão Carmesim', bonus: { FOR: 2, CHI: 1 } };
    }
    return null;
  },
  getSubclassesForElement: (element) => {
    if (element === 'fire') {
      return [
        { id: 'dragao_carmesim', name: 'Dragão Carmesim', bonus: { FOR: 2, CHI: 1 }, requirements: { nivel: 10, FOR: 12 } },
        { id: 'sol_nascente', name: 'Sol Nascente', bonus: { CHI: 3 }, requirements: { nivel: 10, CHI: 14 } },
      ];
    }
    if (element === 'water') {
      return [
        { id: 'curandeiro_lunar', name: 'Curandeiro Lunar', bonus: { ESP: 3 }, requirements: { nivel: 10, ESP: 14 } },
      ];
    }
    return [];
  },
}));

const { Character } = await import('../public/js/character/Character.js');

describe('Character Initialization', () => {
  let character;

  beforeEach(() => {
    character = new Character();
  });

  it('creates with default values', () => {
    const data = character.getData();
    expect(data.identidade.elemento).toBe('fire');
    expect(data.identidade.nivel).toBe(1);
    expect(data.identidade.subclasse).toBe('');
    expect(data.ouro).toBe(0);
    expect(data.pontos_disponiveis).toBe(0);
  });

  it('has all 6 attributes at base value', () => {
    const attrs = character.getData().atributos;
    expect(attrs.FOR).toBe(8);
    expect(attrs.AGI).toBe(8);
    expect(attrs.CHI).toBe(8);
    expect(attrs.PER).toBe(8);
    expect(attrs.RES).toBe(8);
    expect(attrs.ESP).toBe(8);
  });

  it('has empty equipment slots', () => {
    const equip = character.getData().equipamentos;
    expect(equip.arma).toBeNull();
    expect(equip.armadura).toBeNull();
    expect(equip.acessorio).toBeNull();
  });

  it('has zero nation coins', () => {
    const coins = character.getNationCoins();
    expect(coins.fire_coins).toBe(0);
    expect(coins.water_coins).toBe(0);
    expect(coins.earth_coins).toBe(0);
    expect(coins.air_coins).toBe(0);
    expect(coins.universal_coins).toBe(0);
  });

  it('has empty scrolls and habilidades', () => {
    const data = character.getData();
    expect(data.scrolls).toEqual({});
    expect(data.habilidades).toEqual({});
  });
});

describe('Character Load (normalization)', () => {
  let character;

  beforeEach(() => {
    character = new Character();
  });

  it('fills missing fields with defaults', () => {
    character.load({ identidade: { nome: 'Minimal' } });
    const data = character.getData();
    expect(data.identidade.elemento).toBe('fire');
    expect(data.atributos.FOR).toBe(8);
    expect(data.ouro).toBe(0);
  });

  it('preserves existing data fields', () => {
    character.load({
      identidade: { nome: 'Rich', elemento: 'water', nivel: 15 },
      ouro: 999,
      atributos: { FOR: 20, AGI: 15, CHI: 12, PER: 10, RES: 8, ESP: 8 },
    });
    const data = character.getData();
    expect(data.identidade.nome).toBe('Rich');
    expect(data.identidade.elemento).toBe('water');
    expect(data.ouro).toBe(999);
    expect(data.atributos.FOR).toBe(20);
  });

  it('resolves subclass on load when valid', () => {
    character.load({
      identidade: { nome: 'Fire Master', elemento: 'fire', subclasse: 'Dragão Carmesim', nivel: 10 },
    });
    const data = character.getData();
    expect(data.identidade.subclasse).toBe('Dragão Carmesim');
    expect(data.subclass_bonus).toEqual({ FOR: 2, CHI: 1 });
  });

  it('clears subclass_bonus when subclass invalid for element', () => {
    character.load({
      identidade: { nome: 'Wrong', elemento: 'water', subclasse: 'Dragão Carmesim', nivel: 10 },
    });
    const data = character.getData();
    // findSubclassDefinition returns null for water+Dragão → subclasse stays but bonus not applied
    // The behavior depends on the else branch — if subclasse is not empty but definition is null,
    // subclass_bonus stays as loaded (which is empty by default)
    expect(data.subclass_bonus).toEqual({});
  });
});

describe('Element Change Clears Subclass', () => {
  let character;

  beforeEach(() => {
    character = new Character();
    character.load({
      identidade: { nome: 'Fire Hero', elemento: 'fire', subclasse: 'Dragão Carmesim', nivel: 15 },
      atributos: { FOR: 14, AGI: 10, CHI: 12, PER: 10, RES: 10, ESP: 10 },
    });
  });

  it('has subclass before element change', () => {
    expect(character.getData().identidade.subclasse).toBe('Dragão Carmesim');
    expect(character.getData().subclass_bonus).toEqual({ FOR: 2, CHI: 1 });
  });

  it('simulates element change clearing subclass', () => {
    // This simulates what app.js does in setupElementSelector
    const data = character.getData();
    data.identidade.elemento = 'water';
    data.identidade.subclasse = '';
    data.subclass_bonus = {};
    character.load(data);

    expect(character.getData().identidade.subclasse).toBe('');
    expect(character.getData().subclass_bonus).toEqual({});
    expect(character.getData().identidade.elemento).toBe('water');
  });
});

describe('Subclass Unlock', () => {
  let character;

  beforeEach(() => {
    character = new Character();
    character.load({
      identidade: { nome: 'Fire Student', elemento: 'fire', nivel: 10 },
      atributos: { FOR: 14, AGI: 10, CHI: 10, PER: 10, RES: 10, ESP: 10 },
    });
  });

  it('can unlock when requirements met', () => {
    const canUnlock = character.canUnlockSubclass({
      id: 'dragao_carmesim', name: 'Dragão Carmesim',
      bonus: { FOR: 2, CHI: 1 }, requirements: { nivel: 10, FOR: 12 },
    });
    expect(canUnlock).toBe(true);
  });

  it('cannot unlock when level too low', () => {
    character.load({
      identidade: { nome: 'Newbie', elemento: 'fire', nivel: 5 },
      atributos: { FOR: 14, AGI: 10, CHI: 10, PER: 10, RES: 10, ESP: 10 },
    });
    const canUnlock = character.canUnlockSubclass({
      id: 'dragao_carmesim', name: 'Dragão Carmesim',
      bonus: { FOR: 2, CHI: 1 }, requirements: { nivel: 10, FOR: 12 },
    });
    expect(canUnlock).toBe(false);
  });

  it('cannot unlock when attribute too low', () => {
    character.load({
      identidade: { nome: 'Weak', elemento: 'fire', nivel: 10 },
      atributos: { FOR: 8, AGI: 10, CHI: 10, PER: 10, RES: 10, ESP: 10 },
    });
    const canUnlock = character.canUnlockSubclass({
      id: 'dragao_carmesim', name: 'Dragão Carmesim',
      bonus: { FOR: 2, CHI: 1 }, requirements: { nivel: 10, FOR: 12 },
    });
    expect(canUnlock).toBe(false);
  });

  it('cannot unlock if already has subclass', () => {
    character.load({
      identidade: { nome: 'Already', elemento: 'fire', subclasse: 'Sol Nascente', nivel: 10 },
      atributos: { FOR: 14, AGI: 10, CHI: 10, PER: 10, RES: 10, ESP: 10 },
    });
    const canUnlock = character.canUnlockSubclass({
      id: 'dragao_carmesim', name: 'Dragão Carmesim',
      bonus: { FOR: 2, CHI: 1 }, requirements: { nivel: 10, FOR: 12 },
    });
    expect(canUnlock).toBe(false);
  });

  it('unlockSubclass sets name and bonus', () => {
    const result = character.unlockSubclass('dragao_carmesim');
    expect(result).toBe(true);
    expect(character.getData().identidade.subclasse).toBe('Dragão Carmesim');
    expect(character.getData().subclass_bonus).toEqual({ FOR: 2, CHI: 1 });
  });

  it('getTotalAttributes includes subclass bonus', () => {
    character.unlockSubclass('dragao_carmesim');
    const totals = character.getTotalAttributes();
    expect(totals.FOR).toBe(14 + 2); // base + bonus
    expect(totals.CHI).toBe(10 + 1);
    expect(totals.AGI).toBe(10); // no bonus
  });
});
