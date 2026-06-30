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

/**
 * The TradeManager refactor moved trades to Supabase, falling back to
 * localStorage when the client is disabled. In Node tests there's no
 * Supabase client, so every call goes through the local fallback and
 * the API now returns Promises.
 */

describe('TradeManager', () => {
  let tm;
  let storage;

  beforeEach(() => {
    storage = setupLocalStorage();
    tm = new TradeManager();

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
    it('creates a pending trade', async () => {
      const trade = await tm.createTrade('zuko', 'katara', { gold: 50, items: [] }, { items: [] });
      expect(trade.status).toBe('pending');
      expect(trade.from_username).toBe('zuko');
      expect(trade.to_username).toBe('katara');
    });

    it('sanitizes offer gold', async () => {
      const trade = await tm.createTrade('zuko', 'katara', { gold: 100 }, { gold: 0 });
      expect(trade.offer_gold).toBe(100);
    });

    it('throws on self-trade', async () => {
      await expect(tm.createTrade('zuko', 'zuko', { gold: 10 }, {})).rejects.toThrow();
    });

    it('throws if proposer lacks gold', async () => {
      await expect(tm.createTrade('zuko', 'katara', { gold: 9999 }, {})).rejects.toThrow();
    });

    it('throws if proposer lacks items', async () => {
      await expect(tm.createTrade('zuko', 'katara', {
        items: [{ name: 'Espada de Fogo', quantity: 5 }],
      }, {})).rejects.toThrow();
    });

    it('throws on empty trade (no items or gold)', async () => {
      await expect(tm.createTrade('zuko', 'katara', {}, {})).rejects.toThrow();
    });
  });

  describe('acceptTrade', () => {
    it('transfers gold between players', async () => {
      const trade = await tm.createTrade('zuko', 'katara', { gold: 100 }, { gold: 50 });
      await tm.acceptTrade(trade.id, 'katara');

      const zuko = JSON.parse(storage.getItem('avatar_rpg_character_zuko'));
      const katara = JSON.parse(storage.getItem('avatar_rpg_character_katara'));

      expect(zuko.ouro).toBe(450);   // 500 - 100 + 50
      expect(katara.ouro).toBe(350); // 300 - 50 + 100
    });

    it('transfers items between players', async () => {
      const trade = await tm.createTrade(
        'zuko', 'katara',
        { items: [{ name: 'Poção', quantity: 2 }] },
        { items: [{ name: 'Cajado de Gelo', quantity: 1 }] },
      );
      await tm.acceptTrade(trade.id, 'katara');

      const zuko = JSON.parse(storage.getItem('avatar_rpg_character_zuko'));
      const katara = JSON.parse(storage.getItem('avatar_rpg_character_katara'));

      const zukoPotion = zuko.inventario.find((i) => i.name === 'Poção');
      expect(zukoPotion.quantity).toBe(3);
      const zukoStaff = zuko.inventario.find((i) => i.name === 'Cajado de Gelo');
      expect(zukoStaff).toBeTruthy();

      const kataraPotion = katara.inventario.find((i) => i.name === 'Poção');
      expect(kataraPotion.quantity).toBe(2);
      const kataraStaff = katara.inventario.find((i) => i.name === 'Cajado de Gelo');
      expect(kataraStaff).toBeFalsy();
    });

    it('marks trade as accepted', async () => {
      const trade = await tm.createTrade('zuko', 'katara', { gold: 10 }, {});
      await tm.acceptTrade(trade.id, 'katara');
      const trades = await tm.getAllTradesAsync('katara');
      expect(trades.find((t) => t.id === trade.id).status).toBe('accepted');
    });

    it('only target can accept', async () => {
      const trade = await tm.createTrade('zuko', 'katara', { gold: 10 }, {});
      await expect(tm.acceptTrade(trade.id, 'zuko')).rejects.toThrow();
    });
  });

  describe('rejectTrade', () => {
    it('marks trade as rejected', async () => {
      const trade = await tm.createTrade('zuko', 'katara', { gold: 10 }, {});
      await tm.rejectTrade(trade.id, 'katara');
      const trades = await tm.getAllTradesAsync('katara');
      expect(trades.find((t) => t.id === trade.id).status).toBe('rejected');
    });
  });
});
