import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupLocalStorage, createMockCharacterData } from './helpers.js';

// Mock LogService
vi.mock('../public/js/admin/LogService.js', () => ({
  log: vi.fn(),
}));

// Mock window for CustomEvent dispatch
globalThis.window = {
  dispatchEvent: vi.fn(),
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options) {
    this.type = type;
    this.detail = options?.detail;
  }
};
// Node already provides crypto.randomUUID(), no mock needed

const { TradeManager } = await import('../public/js/trade/TradeManager.js');

describe('TradeManager', () => {
  let tm;
  let storage;

  beforeEach(() => {
    storage = setupLocalStorage();
    tm = new TradeManager();

    // Setup two characters
    const char1 = createMockCharacterData({
      identidade: { nome: 'Zuko', elemento: 'fire', nivel: 10 },
      ouro: 500,
      inventario: [
        { id: 'sword1', name: 'Espada de Fogo', type: 'weapon', quantity: 1 },
        { id: 'potion1', name: 'Poção', type: 'consumable', quantity: 5 },
      ],
    });
    const char2 = createMockCharacterData({
      identidade: { nome: 'Katara', elemento: 'water', nivel: 12 },
      ouro: 300,
      inventario: [
        { id: 'staff1', name: 'Cajado de Gelo', type: 'weapon', quantity: 1 },
      ],
    });

    storage.setItem('avatar_rpg_character_zuko', JSON.stringify(char1));
    storage.setItem('avatar_rpg_character_katara', JSON.stringify(char2));
  });

  describe('createTrade', () => {
    it('creates a pending trade', () => {
      const trade = tm.createTrade('zuko', 'katara', { gold: 50, items: [] }, { items: [] });
      expect(trade.status).toBe('pending');
      expect(trade.from).toBe('zuko');
      expect(trade.to).toBe('katara');
    });

    it('sanitizes offer gold', () => {
      const trade = tm.createTrade('zuko', 'katara', { gold: 100 }, { gold: 0 });
      expect(trade.offer.gold).toBe(100);
    });

    it('throws on self-trade', () => {
      expect(() => tm.createTrade('zuko', 'zuko', { gold: 10 }, {})).toThrow();
    });

    it('throws if proposer lacks gold', () => {
      expect(() => tm.createTrade('zuko', 'katara', { gold: 9999 }, {})).toThrow();
    });

    it('throws if proposer lacks items', () => {
      expect(() => tm.createTrade('zuko', 'katara', {
        items: [{ name: 'Espada de Fogo', quantity: 5 }],
      }, {})).toThrow();
    });

    it('throws on empty trade (no items or gold)', () => {
      expect(() => tm.createTrade('zuko', 'katara', {}, {})).toThrow();
    });
  });

  describe('acceptTrade', () => {
    it('transfers gold between players', () => {
      const trade = tm.createTrade('zuko', 'katara', { gold: 100 }, { gold: 50 });
      tm.acceptTrade(trade.id, 'katara');

      const zuko = JSON.parse(storage.getItem('avatar_rpg_character_zuko'));
      const katara = JSON.parse(storage.getItem('avatar_rpg_character_katara'));

      expect(zuko.ouro).toBe(450); // 500 - 100 + 50
      expect(katara.ouro).toBe(350); // 300 - 50 + 100
    });

    it('transfers items between players', () => {
      const trade = tm.createTrade(
        'zuko', 'katara',
        { items: [{ name: 'Poção', quantity: 2 }] },
        { items: [{ name: 'Cajado de Gelo', quantity: 1 }] },
      );
      tm.acceptTrade(trade.id, 'katara');

      const zuko = JSON.parse(storage.getItem('avatar_rpg_character_zuko'));
      const katara = JSON.parse(storage.getItem('avatar_rpg_character_katara'));

      // Zuko gave 2 potions, received staff
      const zukoPotion = zuko.inventario.find(i => i.name === 'Poção');
      expect(zukoPotion.quantity).toBe(3); // had 5, gave 2
      const zukoStaff = zuko.inventario.find(i => i.name === 'Cajado de Gelo');
      expect(zukoStaff).toBeTruthy();

      // Katara received 2 potions, gave staff
      const kataraPotion = katara.inventario.find(i => i.name === 'Poção');
      expect(kataraPotion.quantity).toBe(2);
      const kataraStaff = katara.inventario.find(i => i.name === 'Cajado de Gelo');
      expect(kataraStaff).toBeFalsy();
    });

    it('marks trade as accepted', () => {
      const trade = tm.createTrade('zuko', 'katara', { gold: 10 }, {});
      tm.acceptTrade(trade.id, 'katara');
      const trades = tm.getTrades();
      expect(trades.find(t => t.id === trade.id).status).toBe('accepted');
    });

    it('only target can accept', () => {
      const trade = tm.createTrade('zuko', 'katara', { gold: 10 }, {});
      expect(() => tm.acceptTrade(trade.id, 'zuko')).toThrow();
    });
  });

  describe('rejectTrade', () => {
    it('marks trade as rejected', () => {
      const trade = tm.createTrade('zuko', 'katara', { gold: 10 }, {});
      tm.rejectTrade(trade.id, 'katara');
      const trades = tm.getTrades();
      expect(trades.find(t => t.id === trade.id).status).toBe('rejected');
    });
  });
});
