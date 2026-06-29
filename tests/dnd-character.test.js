/**
 * Tests for the D&D 5e character model + SRD helpers.
 */

import { describe, it, expect } from 'vitest';
import { DnDCharacter } from '../public/js/games/dnd/dnd-character.js';
import {
  abilityMod, profBonus, levelFromXp, xpForNext,
} from '../public/js/games/dnd/data/srd.js';

describe('SRD helpers', () => {
  it('abilityMod follows floor((s-10)/2)', () => {
    expect(abilityMod(10)).toBe(0);
    expect(abilityMod(16)).toBe(3);
    expect(abilityMod(8)).toBe(-1);
    expect(abilityMod(1)).toBe(-5);
    expect(abilityMod(30)).toBe(10);
  });

  it('profBonus matches 5e progression', () => {
    expect(profBonus(1)).toBe(2);
    expect(profBonus(4)).toBe(2);
    expect(profBonus(5)).toBe(3);
    expect(profBonus(12)).toBe(4);
    expect(profBonus(17)).toBe(6);
    expect(profBonus(20)).toBe(6);
  });

  it('levelFromXp finds the right level on table boundaries', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(299)).toBe(1);
    expect(levelFromXp(300)).toBe(2);
    expect(levelFromXp(2700)).toBe(4);
    expect(levelFromXp(355000)).toBe(20);
    expect(levelFromXp(9999999)).toBe(20);
  });

  it('xpForNext returns null at level 20', () => {
    expect(xpForNext(1)).toBe(300);
    expect(xpForNext(19)).toBe(355000);
    expect(xpForNext(20)).toBe(null);
  });
});

describe('DnDCharacter', () => {
  it('initializes with defaults when given empty data', () => {
    const c = new DnDCharacter();
    expect(c.level).toBe(1);
    expect(c.xp).toBe(0);
    expect(c.abilities.STR).toBe(10);
    expect(c.combat.ac).toBe(10);
    expect(c.combat.speed).toBe(30);
    expect(c.inventory).toEqual([]);
  });

  it('computes save bonus with and without proficiency', () => {
    const c = new DnDCharacter({ abilities: { STR: 16 } });
    expect(c.saveBonus('STR')).toBe(3); // no prof: just mod
    c.saves.STR = true;
    expect(c.saveBonus('STR')).toBe(5); // +2 prof
  });

  it('computes skill bonus with expertise doubling proficiency', () => {
    const c = new DnDCharacter({ abilities: { DEX: 16 } });
    expect(c.skillBonus('stealth')).toBe(3);
    c.skills.stealth = { prof: true, expertise: false };
    expect(c.skillBonus('stealth')).toBe(5);
    c.skills.stealth.expertise = true;
    expect(c.skillBonus('stealth')).toBe(7);
  });

  it('addXp updates the level when crossing thresholds', () => {
    const c = new DnDCharacter();
    c.addXp(300);
    expect(c.level).toBe(2);
    c.addXp(2400); // total 2700 → lvl 4
    expect(c.level).toBe(4);
  });

  it('hp helpers clamp to [-max, max]', () => {
    const c = new DnDCharacter({ combat: { hp_max: 20, hp_current: 20 } });
    c.addHp(-50);
    expect(c.combat.hp_current).toBe(-20); // hard floor at -max
    c.hpToMax();
    expect(c.combat.hp_current).toBe(20);
    c.addHp(99);
    expect(c.combat.hp_current).toBe(20); // capped at max
  });

  it('spellDC / spellAttack require a casting ability', () => {
    const c = new DnDCharacter({ abilities: { INT: 16 } });
    expect(c.spellDC()).toBe(null);
    c.spells.cast_ability = 'INT';
    // 8 + 2 (prof) + 3 (int mod) = 13
    expect(c.spellDC()).toBe(13);
    // prof + int mod = 2 + 3 = 5
    expect(c.spellAttack()).toBe(5);
  });

  it('toJSON round-trips identity, level and abilities', () => {
    const original = new DnDCharacter({
      identity: { name: 'Gandalf', race: 'Humano', class: 'wizard' },
      abilities: { INT: 18 },
      level: 5, xp: 6500,
    });
    const round = new DnDCharacter(original.toJSON());
    expect(round.identity.name).toBe('Gandalf');
    expect(round.identity.class).toBe('wizard');
    expect(round.level).toBe(5);
    expect(round.abilities.INT).toBe(18);
  });
});

describe('DnDCharacter — multiclass', () => {
  it('boots single-class from identity + level for legacy data', () => {
    const c = new DnDCharacter({ identity: { class: 'fighter' }, level: 4 });
    expect(c.classes).toHaveLength(1);
    expect(c.classes[0].class).toBe('fighter');
    expect(c.classes[0].level).toBe(4);
    expect(c.level).toBe(4);
  });

  it('uses classes[] when both classes and identity.class are present', () => {
    const c = new DnDCharacter({
      identity: { class: 'fighter' },
      classes: [{ class: 'wizard', level: 3 }, { class: 'rogue', level: 2 }],
    });
    expect(c.classes).toHaveLength(2);
    expect(c.level).toBe(5);
    // identity.class espelha a primária (primeira) → wizard
    expect(c.identity.class).toBe('wizard');
  });

  it('addClass / removeClassAt / updateClassAt mantêm o nível somado', () => {
    const c = new DnDCharacter();
    c.addClass('fighter', 3);
    c.addClass('rogue', 2);
    expect(c.level).toBe(5);
    c.updateClassAt(0, { level: 5 });
    expect(c.level).toBe(7);
    c.removeClassAt(1);
    expect(c.level).toBe(5);
    expect(c.classes).toHaveLength(1);
  });

  it('prof bonus calcula sobre o nível total', () => {
    const c = new DnDCharacter({
      classes: [{ class: 'fighter', level: 3 }, { class: 'wizard', level: 2 }],
    });
    expect(c.level).toBe(5);
    expect(c.prof).toBe(3); // lvl 5 → +3
  });

  it('addXp não auto-bump level quando há classes (mantém manual)', () => {
    const c = new DnDCharacter({ classes: [{ class: 'fighter', level: 3 }] });
    c.addXp(10000); // mais que suficiente para >3
    expect(c.level).toBe(3); // mantém-se manual
    expect(c.xp).toBe(10000);
  });
});
