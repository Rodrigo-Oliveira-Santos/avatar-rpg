/**
 * Tests for the D&D trade module (storage + state transitions + transfer).
 *
 * Usa um localStorage in-memory para isolar cada teste.
 */

import { describe, it, expect, beforeEach } from 'vitest';

let trade;

beforeEach(async () => {
  global.localStorage = {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; },
  };
  // Re-import to reset module-level state (registry helpers, etc.)
  trade = await import('../public/js/games/dnd/dnd-trade.js');
});

describe('createTrade', () => {
  it('cria um trade pendente com items+gold sanitizados', () => {
    const t = trade.createTrade({
      from_user: 'alice',
      to_user: 'bob',
      give: { items: [{ name: 'Espada', qty: 1 }, { name: '', qty: 5 }], gold: 50 },
      want: { items: [], gold: 0 },
    });
    expect(t.status).toBe('pending');
    expect(t.give.items).toHaveLength(1);
    expect(t.give.gold).toBe(50);
    expect(t.from_user).toBe('alice');
  });

  it('rejeita trade vazio', () => {
    expect(() => trade.createTrade({
      from_user: 'a', to_user: 'b',
      give: { items: [], gold: 0 },
      want: { items: [], gold: 0 },
    })).toThrow(/vazia/i);
  });

  it('rejeita auto-trade', () => {
    expect(() => trade.createTrade({
      from_user: 'a', to_user: 'a',
      give: { items: [], gold: 10 },
      want: { items: [], gold: 0 },
    })).toThrow(/contigo/i);
  });
});

describe('listIncomingPending / listOutgoingPending', () => {
  it('filtra por user e estado', () => {
    trade.createTrade({ from_user: 'alice', to_user: 'bob', give: { gold: 10 }, want: { gold: 0 } });
    trade.createTrade({ from_user: 'carol', to_user: 'alice', give: { gold: 5 }, want: { gold: 0 } });
    expect(trade.listOutgoingPending('alice')).toHaveLength(1);
    expect(trade.listIncomingPending('alice')).toHaveLength(1);
    expect(trade.listIncomingPending('bob')).toHaveLength(1);
  });
});

describe('rejectTrade / cancelTrade', () => {
  it('apenas destinatário rejeita', () => {
    const t = trade.createTrade({ from_user: 'a', to_user: 'b', give: { gold: 5 }, want: { gold: 0 } });
    expect(() => trade.rejectTrade(t.id, 'a')).toThrow(/destinat/i);
    expect(trade.rejectTrade(t.id, 'b').status).toBe('rejected');
  });

  it('apenas autor cancela', () => {
    const t = trade.createTrade({ from_user: 'a', to_user: 'b', give: { gold: 5 }, want: { gold: 0 } });
    expect(() => trade.cancelTrade(t.id, 'b')).toThrow(/autor/i);
    expect(trade.cancelTrade(t.id, 'a').status).toBe('cancelled');
  });

  it('não permite rejeitar/cancelar quando não está pending', () => {
    const t = trade.createTrade({ from_user: 'a', to_user: 'b', give: { gold: 5 }, want: { gold: 0 } });
    trade.cancelTrade(t.id, 'a');
    expect(() => trade.rejectTrade(t.id, 'b')).toThrow(/processado/);
  });
});

describe('acceptTrade — transfere itens e ouro', () => {
  it('aplica gold e items às duas fichas', async () => {
    // Setup: alice tem 100 ouro + Sword(1); bob tem 50 ouro
    localStorage.setItem('dnd_character_alice', JSON.stringify({
      identity: { name: 'Alice' },
      gold: 100,
      inventory: [{ name: 'Sword', qty: 1 }],
    }));
    localStorage.setItem('dnd_character_bob', JSON.stringify({
      identity: { name: 'Bob' },
      gold: 50,
      inventory: [],
    }));

    const t = trade.createTrade({
      from_user: 'alice',
      to_user: 'bob',
      give: { items: [{ name: 'Sword', qty: 1 }], gold: 20 },
      want: { items: [], gold: 10 },
    });

    const result = await trade.acceptTrade(t.id, 'bob');
    expect(result.status).toBe('accepted');

    const alice = JSON.parse(localStorage.getItem('dnd_character_alice'));
    const bob = JSON.parse(localStorage.getItem('dnd_character_bob'));

    // alice deu 1 Sword + 20g, recebeu 10g → 100 - 20 + 10 = 90
    expect(alice.gold).toBe(90);
    expect(alice.inventory.find((i) => i.name === 'Sword')).toBeUndefined();
    // bob deu 10g, recebeu 1 Sword + 20g → 50 + 20 - 10 = 60
    expect(bob.gold).toBe(60);
    expect(bob.inventory.find((i) => i.name === 'Sword')?.qty).toBe(1);
  });

  it('só o destinatário pode aceitar', async () => {
    const t = trade.createTrade({
      from_user: 'a', to_user: 'b',
      give: { gold: 5 }, want: { gold: 0 },
    });
    await expect(trade.acceptTrade(t.id, 'a')).rejects.toThrow(/destinat/i);
  });

  it('pre-validação rejeita se o autor não tem ouro suficiente', async () => {
    localStorage.setItem('dnd_character_alice', JSON.stringify({ gold: 5, inventory: [] }));
    localStorage.setItem('dnd_character_bob', JSON.stringify({ gold: 50, inventory: [] }));
    const t = trade.createTrade({
      from_user: 'alice', to_user: 'bob',
      give: { gold: 100 }, want: { gold: 0 },
    });
    await expect(trade.acceptTrade(t.id, 'bob')).rejects.toThrow(/PO/);
    // Estado não foi modificado
    const alice = JSON.parse(localStorage.getItem('dnd_character_alice'));
    const bob = JSON.parse(localStorage.getItem('dnd_character_bob'));
    expect(alice.gold).toBe(5);
    expect(bob.gold).toBe(50);
  });

  it('pre-validação rejeita se o autor não tem o item', async () => {
    localStorage.setItem('dnd_character_alice', JSON.stringify({ gold: 100, inventory: [{ name: 'Sword', qty: 1 }] }));
    localStorage.setItem('dnd_character_bob', JSON.stringify({ gold: 50, inventory: [] }));
    const t = trade.createTrade({
      from_user: 'alice', to_user: 'bob',
      give: { items: [{ name: 'Spellbook', qty: 1 }] }, want: { gold: 5 },
    });
    await expect(trade.acceptTrade(t.id, 'bob')).rejects.toThrow(/Spellbook/);
    // Não tirou ouro a ninguém
    expect(JSON.parse(localStorage.getItem('dnd_character_alice')).gold).toBe(100);
    expect(JSON.parse(localStorage.getItem('dnd_character_bob')).gold).toBe(50);
  });
});
