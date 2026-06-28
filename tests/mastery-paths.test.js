/**
 * Mastery system + path selection tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupLocalStorage } from './helpers.js';
import { masteryLevelForUses } from '../public/js/character/Character.js';
import { MASTERY_THRESHOLDS } from '../public/js/utils/constants.js';

beforeEach(() => setupLocalStorage());

describe('masteryLevelForUses', () => {
  it('returns 0 when below the first threshold', () => {
    expect(masteryLevelForUses(0)).toBe(0);
    expect(masteryLevelForUses(14)).toBe(0);
  });

  it('returns 1 at 15 uses', () => {
    expect(masteryLevelForUses(15)).toBe(1);
    expect(masteryLevelForUses(49)).toBe(1);
  });

  it('returns 2 at 50 uses', () => {
    expect(masteryLevelForUses(50)).toBe(2);
    expect(masteryLevelForUses(149)).toBe(2);
  });

  it('returns 3 at 150 uses', () => {
    expect(masteryLevelForUses(150)).toBe(3);
    expect(masteryLevelForUses(99999)).toBe(3);
  });

  it('thresholds match canonical [0, 15, 50, 150]', () => {
    expect(MASTERY_THRESHOLDS).toEqual([0, 15, 50, 150]);
  });
});

describe('Character — mastery + paths', () => {
  it('recordSkillUse increments and getMasteryLevel returns the right band', async () => {
    const { Character } = await import('../public/js/character/Character.js');
    const ch = new Character();
    expect(ch.getMasteryLevel('fire-cb1a')).toBe(0);
    for (let i = 0; i < 15; i++) ch.recordSkillUse('fire-cb1a');
    expect(ch.getMasteryLevel('fire-cb1a')).toBe(1);
    for (let i = 0; i < 35; i++) ch.recordSkillUse('fire-cb1a');
    expect(ch.getMasteryLevel('fire-cb1a')).toBe(2);
  });

  it('setCombatPath only accepts precise/brute/null', async () => {
    const { Character } = await import('../public/js/character/Character.js');
    const ch = new Character();
    ch.setCombatPath('precise');
    expect(ch.getData().combat_path).toBe('precise');
    ch.setCombatPath(null);
    expect(ch.getData().combat_path).toBeNull();
    expect(() => ch.setCombatPath('spirit')).toThrow();
  });

  it('setNonBenderPath only accepts chiblocker/weapons/null', async () => {
    const { Character } = await import('../public/js/character/Character.js');
    const ch = new Character();
    ch.setNonBenderPath('chiblocker');
    expect(ch.getData().non_bender_path).toBe('chiblocker');
    ch.setNonBenderPath('weapons');
    expect(ch.getData().non_bender_path).toBe('weapons');
    expect(() => ch.setNonBenderPath('warrior')).toThrow();
  });
});
