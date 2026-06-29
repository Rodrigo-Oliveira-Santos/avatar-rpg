/**
 * Tests for the D&D pack import validators + storage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DOMAINS, DOMAIN_LABELS,
  validatePack, savePack, clearPack, loadPack, packStats, loadCombined,
} from '../public/js/games/dnd/dnd-import.js';

beforeEach(() => {
  // Ambiente node: emular localStorage
  global.localStorage = {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; },
  };
});

describe('DOMAINS / DOMAIN_LABELS', () => {
  it('expõe 4 domínios', () => {
    expect(DOMAINS).toEqual(['spells', 'subclasses', 'magic_items', 'races']);
    DOMAINS.forEach((d) => expect(DOMAIN_LABELS[d]).toBeTruthy());
  });
});

describe('validatePack — spells', () => {
  it('aceita um pack válido', () => {
    const res = validatePack('spells', JSON.stringify([
      { name: 'Fireball', level: 3, school: 'evocation', classes: ['wizard'] },
      { name: 'Mage Hand', level: 0, school: 'conjuration' },
    ]));
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.entries).toHaveLength(2);
  });

  it('rejeita JSON malformado', () => {
    const res = validatePack('spells', '{ this is not json');
    expect(res.valid).toBe(false);
    expect(res.errors[0].errors[0]).toMatch(/JSON inv/i);
  });

  it('rejeita quando não é array', () => {
    const res = validatePack('spells', JSON.stringify({ name: 'Fireball' }));
    expect(res.valid).toBe(false);
  });

  it('rejeita level fora de 0..9 e school inválida', () => {
    const res = validatePack('spells', JSON.stringify([
      { name: 'Bogus', level: 12, school: 'NONE' },
    ]));
    expect(res.valid).toBe(false);
    const errs = res.errors[0].errors;
    expect(errs.some((e) => /level/.test(e))).toBe(true);
    expect(errs.some((e) => /school/i.test(e))).toBe(true);
  });
});

describe('validatePack — subclasses', () => {
  it('exige class base', () => {
    const res = validatePack('subclasses', JSON.stringify([{ name: 'Champion' }]));
    expect(res.valid).toBe(false);
    expect(res.errors[0].errors[0]).toMatch(/class/);
  });
});

describe('validatePack — magic_items', () => {
  it('valida rarity enum', () => {
    const ok = validatePack('magic_items', JSON.stringify([{ name: 'Cloak of Protection', rarity: 'uncommon' }]));
    expect(ok.valid).toBe(true);
    const bad = validatePack('magic_items', JSON.stringify([{ name: 'X', rarity: 'mythic' }]));
    expect(bad.valid).toBe(false);
  });
});

describe('validatePack — races', () => {
  it('valida shape de ability_bonuses', () => {
    const res = validatePack('races', JSON.stringify([{ name: 'Aasimar', ability_bonuses: 'STR+2' }]));
    expect(res.valid).toBe(false);
    expect(res.errors[0].errors[0]).toMatch(/ability_bonuses/);
  });
});

describe('storage', () => {
  it('save/load/clear/packStats fluem em conjunto', () => {
    expect(packStats('spells').count).toBe(0);
    savePack('spells', [{ name: 'Fireball', level: 3 }]);
    expect(packStats('spells').count).toBe(1);
    expect(loadPack('spells')[0].name).toBe('Fireball');
    clearPack('spells');
    expect(packStats('spells').count).toBe(0);
  });

  it('savePack rejeita domínio desconhecido', () => {
    expect(() => savePack('weapons', [])).toThrow(/desconhecido/);
  });

  it('loadCombined inclui built-ins (vazios por ora) + importados', () => {
    savePack('spells', [{ name: 'Magic Missile', level: 1 }]);
    const combined = loadCombined('spells');
    expect(combined.map((s) => s.name)).toContain('Magic Missile');
  });
});
