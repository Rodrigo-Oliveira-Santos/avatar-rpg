/**
 * Tests for the Minecraft Reactions API (like/dislike, mutuamente exclusivas).
 */

import { describe, it, expect, beforeEach } from 'vitest';

let reactions;

beforeEach(async () => {
  global.localStorage = {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; },
  };
  // Sessão simulada
  localStorage.setItem('mc_user', JSON.stringify({ username: 'alice', role: 'player' }));
  reactions = await import('../public/js/api/mc-reactions.js');
});

describe('react()', () => {
  it('like soma 1 e mine fica "like"', () => {
    const c = reactions.react('b1', 'like');
    expect(c.likes).toBe(1);
    expect(c.dislikes).toBe(0);
    expect(c.mine).toBe('like');
  });

  it('clicar like duas vezes retira (toggle off)', () => {
    reactions.react('b1', 'like');
    const c = reactions.react('b1', 'like');
    expect(c.likes).toBe(0);
    expect(c.mine).toBe(null);
  });

  it('like → dislike alterna sem deixar like', () => {
    reactions.react('b1', 'like');
    const c = reactions.react('b1', 'dislike');
    expect(c.likes).toBe(0);
    expect(c.dislikes).toBe(1);
    expect(c.mine).toBe('dislike');
  });

  it('reações de utilizadores diferentes acumulam', () => {
    reactions.react('b1', 'like'); // alice
    localStorage.setItem('mc_user', JSON.stringify({ username: 'bob', role: 'player' }));
    reactions.react('b1', 'like'); // bob
    const c = reactions.getCounts('b1');
    expect(c.likes).toBe(2);
  });

  it('sem sessão lança', () => {
    localStorage.removeItem('mc_user');
    expect(() => reactions.react('b1', 'like')).toThrow(/sessão/i);
  });

  it('kind inválido lança', () => {
    expect(() => reactions.react('b1', 'love')).toThrow(/inválido/i);
  });
});

describe('getCounts()', () => {
  it('devolve zeros para build sem reações', () => {
    const c = reactions.getCounts('unknown');
    expect(c).toEqual({ likes: 0, dislikes: 0, mine: null });
  });

  it('mine respeita o user em sessão', () => {
    reactions.react('b1', 'like');
    expect(reactions.getCounts('b1').mine).toBe('like');
    localStorage.setItem('mc_user', JSON.stringify({ username: 'bob', role: 'player' }));
    expect(reactions.getCounts('b1').mine).toBe(null);
  });
});

describe('clearReactionsForBuild()', () => {
  it('remove todas as reações de uma build', () => {
    reactions.react('b1', 'like');
    reactions.clearReactionsForBuild('b1');
    expect(reactions.getCounts('b1').likes).toBe(0);
  });
});
