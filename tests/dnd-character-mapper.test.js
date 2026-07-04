/**
 * Tests for the D&D character mapper (flat Supabase row ↔ nested model).
 *
 * Garante que o round-trip não perde dados — em particular `gold`,
 * `classes` (multiclass), `subclass`, `hp_temp`, `hit_dice_*`, que
 * antes do mapper eram silenciosamente descartados ao gravar e
 * substituídos por defaults ao ler do Supabase.
 */

import { describe, it, expect } from 'vitest';
import {
  rowToCharacter, characterToRow,
} from '../public/js/api/dnd-character-mapper.js';

describe('rowToCharacter', () => {
  it('mapeia colunas flat para shape nested do modelo', () => {
    const row = {
      id: 'c1',
      name: 'Gandalf', race: 'Humano', class: 'wizard', subclass: 'Evocation',
      background: 'Sábio', alignment: 'Neutro', age: '2019', gender: 'M',
      classes: [{ class: 'wizard', subclass: 'Evocation', level: 5 }],
      level: 5, xp: 6500, gold: 250,
      hp_max: 30, hp_current: 28, hp_temp: 5,
      ac: 12, speed: 30, hit_dice_total: 5, hit_dice_used: 2,
      abilities: { INT: 18 }, saves: { INT: true }, skills: { arcana: { prof: true } },
      inventory: [{ name: 'Wand', qty: 1 }],
      spells: { cast_ability: 'INT', known: ['Fireball'] },
      features: ['Arcane Recovery'], notes: 'wise',
    };
    const c = rowToCharacter(row);
    expect(c.identity.name).toBe('Gandalf');
    expect(c.identity.race).toBe('Humano');
    expect(c.identity.subclass).toBe('Evocation');
    expect(c.identity.age).toBe('2019');
    expect(c.classes).toHaveLength(1);
    expect(c.classes[0].level).toBe(5);
    expect(c.level).toBe(5);
    expect(c.gold).toBe(250);
    expect(c.combat.hp_max).toBe(30);
    expect(c.combat.hp_temp).toBe(5);
    expect(c.combat.hit_dice_total).toBe(5);
    expect(c.combat.hit_dice_used).toBe(2);
    expect(c.spells.cast_ability).toBe('INT');
    expect(c.notes).toBe('wise');
  });

  it('preenche defaults para colunas em falta', () => {
    const c = rowToCharacter({ name: 'X', level: 1 });
    expect(c.combat.hp_max).toBe(10);
    expect(c.combat.ac).toBe(10);
    expect(c.combat.speed).toBe(30);
    expect(c.gold).toBe(0);
    expect(c.classes).toEqual([]);
  });

  it('devolve null para input null', () => {
    expect(rowToCharacter(null)).toBe(null);
  });
});

describe('characterToRow', () => {
  it('inclui TODOS os campos persistíveis (sem perdas vs. localStorage)', () => {
    const character = {
      identity: {
        name: 'Aria', race: 'Elfo', class: 'rogue', subclass: 'Assassin',
        background: 'Criminoso', alignment: 'Caótico e Neutro',
        age: '120', gender: 'F',
      },
      classes: [{ class: 'rogue', subclass: 'Assassin', level: 3 }],
      level: 3, xp: 900, gold: 75,
      combat: { hp_max: 24, hp_current: 18, hp_temp: 2, ac: 15, speed: 35, hit_dice_total: 3, hit_dice_used: 1 },
      abilities: { DEX: 18 }, saves: { DEX: true },
      skills: { stealth: { prof: true, expertise: true } },
      inventory: [{ name: 'Daggers', qty: 2 }],
      spells: {}, features: ['Sneak Attack'], notes: '',
    };
    const row = characterToRow('user-1', character);
    expect(row.user_id).toBe('user-1');
    expect(row.name).toBe('Aria');
    expect(row.race).toBe('Elfo');
    expect(row.class).toBe('rogue');
    expect(row.subclass).toBe('Assassin');
    expect(row.classes).toHaveLength(1);
    expect(row.gold).toBe(75);
    expect(row.hp_temp).toBe(2);
    expect(row.hit_dice_total).toBe(3);
    expect(row.hit_dice_used).toBe(1);
    expect(row.age).toBe('120');
    expect(row.gender).toBe('F');
  });

  it('round-trip rowToCharacter(characterToRow(c)) preserva campos chave', () => {
    const original = {
      identity: { name: 'Bron', race: 'Anão', class: 'fighter', subclass: 'Champion', background: '', alignment: '', age: '', gender: '' },
      classes: [{ class: 'fighter', subclass: 'Champion', level: 5 }],
      level: 5, xp: 6500, gold: 300,
      combat: { hp_max: 50, hp_current: 50, hp_temp: 0, ac: 18, speed: 25, hit_dice_total: 5, hit_dice_used: 0 },
      abilities: { STR: 18, CON: 16 }, saves: { STR: true, CON: true }, skills: {},
      inventory: [{ name: 'Longsword', qty: 1, weight: 3 }],
      spells: { slots: {} }, features: [], notes: '',
    };
    const row = characterToRow('user-1', original);
    const back = rowToCharacter(row);
    expect(back.identity.name).toBe(original.identity.name);
    expect(back.gold).toBe(original.gold);
    expect(back.classes).toEqual(original.classes);
    expect(back.combat.hp_max).toBe(original.combat.hp_max);
    expect(back.combat.hit_dice_total).toBe(original.combat.hit_dice_total);
    expect(back.combat.ac).toBe(original.combat.ac);
  });
});
