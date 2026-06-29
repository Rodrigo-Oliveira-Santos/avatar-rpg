/**
 * TradeManager — wraps `api/trades` + reconciles inventories on accept.
 *
 * Differences from the previous implementation:
 *   - Trades live in Supabase (`trades` table). Cross-browser proposals
 *     work; the proposer's browser no longer needs the recipient's
 *     character in localStorage.
 *   - When Supabase is unavailable, the API falls back to localStorage
 *     and we degrade to the old single-browser behaviour.
 *   - Inventory + gold validation now reads from Supabase
 *     (`loadCharacter`) for the counterpart so we can sanity-check on
 *     either side; failures bubble up to the caller.
 *
 * Acceptance flow:
 *   1. recipient clicks Accept in their browser
 *   2. TradeManager.acceptTrade:
 *        - re-validates both sides via Supabase characters
 *        - mutates BOTH characters (removeItems + addItems + gold delta)
 *        - persists both via saveCharacter (full row)
 *        - sets the trade status to 'accepted' via api/trades
 *   3. Realtime push notifies the proposer's browser, which refreshes
 *      its inventory from Supabase on the next character load.
 */

import { log } from '../admin/LogService.js';
import { isSupabaseEnabled } from '../api/config.js';
import * as TradesApi from '../api/trades.js';
import {
  loadCharacter as loadCharFromSupabase,
  saveCharacter as saveCharToSupabase,
} from '../api/supabase-characters.js';

const STORAGE_KEY = 'avatar_rpg_trades'; // legacy mirror for offline mode
const CHARACTER_KEY_PREFIX = 'avatar_rpg_character_';
export const TRADE_UPDATED_EVENT = 'avatar-rpg:trades-updated';

const norm = (value) => String(value || '').trim().toLowerCase();
const num = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const sanitizeItems = (items = []) => {
  const grouped = new Map();
  items.forEach((item) => {
    const name = String(item?.name || '').trim();
    const quantity = num(item?.quantity);
    if (!name || quantity <= 0) return;
    const key = norm(name);
    if (grouped.has(key)) {
      grouped.get(key).quantity += quantity;
    } else {
      grouped.set(key, { name, quantity });
    }
  });
  return Array.from(grouped.values());
};

const inventoryQuantity = (inventory, name) => {
  const key = norm(name);
  return (inventory || []).filter((i) => norm(i?.name) === key)
    .reduce((t, i) => t + num(i?.quantity), 0);
};

const verifyInventory = (character, items = []) => {
  const inventory = Array.isArray(character?.inventario) ? character.inventario : [];
  items.forEach((item) => {
    const available = inventoryQuantity(inventory, item.name);
    if (available < item.quantity) {
      throw new Error(`Item indisponível: ${item.name} (${available}/${item.quantity})`);
    }
  });
};

const removeItems = (character, items = []) => {
  const inventory = Array.isArray(character.inventario) ? character.inventario : (character.inventario = []);
  const transferred = [];
  items.forEach((req) => {
    let remaining = req.quantity;
    const key = norm(req.name);
    for (let i = 0; i < inventory.length && remaining > 0; i++) {
      const cur = inventory[i];
      if (norm(cur?.name) !== key) continue;
      const q = num(cur?.quantity);
      if (q <= 0) continue;
      const taken = Math.min(q, remaining);
      transferred.push({ ...cur, quantity: taken });
      remaining -= taken;
      if (taken === q) {
        inventory.splice(i, 1);
        i -= 1;
      } else {
        cur.quantity = q - taken;
      }
    }
    if (remaining > 0) throw new Error(`Item indisponível: ${req.name}`);
  });
  return transferred;
};

const addItems = (character, items = []) => {
  if (!Array.isArray(character.inventario)) character.inventario = [];
  items.forEach((incoming) => {
    const key = norm(incoming.name);
    const existing = character.inventario.find((i) => norm(i?.name) === key);
    if (existing) {
      existing.quantity = num(existing.quantity) + num(incoming.quantity);
    } else {
      character.inventario.push({ ...incoming });
    }
  });
};

const emit = (type, trade) => {
  window.dispatchEvent(new CustomEvent(TRADE_UPDATED_EVENT, { detail: { type, trade } }));
};

// Best-effort character load: prefer Supabase, fall back to localStorage.
async function loadAnyCharacter(username) {
  if (isSupabaseEnabled()) {
    try {
      const remote = await loadCharFromSupabase(username);
      if (remote) return remote;
    } catch (err) {
      console.warn('[TradeManager] Supabase load failed', err);
    }
  }
  try {
    const raw = localStorage.getItem(`${CHARACTER_KEY_PREFIX}${username}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function saveAnyCharacter(username, character) {
  // Always update localStorage as a backup.
  try { localStorage.setItem(`${CHARACTER_KEY_PREFIX}${username}`, JSON.stringify(character)); }
  catch (err) { console.warn('[TradeManager] localStorage save failed', err); }
  if (isSupabaseEnabled()) {
    try {
      await saveCharToSupabase(username, character, { omitStatusEffects: true, omitGmNotes: true, omitVitals: true });
    } catch (err) {
      console.warn('[TradeManager] Supabase save failed', err);
      throw err;
    }
  }
}

export class TradeManager {
  // ── Read helpers ────────────────────────────────────────────

  async getPendingTradesAsync(username) {
    return TradesApi.listForUser(username, { status: 'pending' });
  }

  async getAllTradesAsync(username) {
    return TradesApi.listForUser(username);
  }

  /** Synchronous mirror used by older UI code — reads the local cache. */
  getPendingTrades(username) {
    try {
      const rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const key = norm(username);
      return rows.filter((t) => t.status === 'pending'
        && (norm(t.from_username || t.from) === key || norm(t.to_username || t.to) === key))
        .map(legacyToNew);
    } catch { return []; }
  }

  async getPendingCountAsync(username) {
    return TradesApi.getPendingCount(username);
  }

  getPendingCount(username) { return this.getPendingTrades(username).length; }

  // ── Mutations ───────────────────────────────────────────────

  /**
   * Propose a trade. Validates the proposer's inventory locally; the
   * recipient's inventory is checked on accept (their side has the
   * authoritative copy).
   */
  async createTrade(from, to, offer = {}, request = {}) {
    const proposer = String(from || '').trim();
    const target = String(to || '').trim();
    if (!proposer || !target) throw new Error('Utilizadores inválidos para a troca.');
    if (norm(proposer) === norm(target)) throw new Error('Não podes propor uma troca a ti próprio.');

    const sanitizedOffer = { items: sanitizeItems(offer.items), gold: num(offer.gold) };
    const sanitizedRequest = { items: sanitizeItems(request.items), gold: num(request.gold) };
    if (sanitizedOffer.items.length + sanitizedOffer.gold + sanitizedRequest.items.length + sanitizedRequest.gold === 0) {
      throw new Error('A proposta tem de incluir pelo menos um item ou ouro.');
    }

    // Validate the proposer side (we ARE in the proposer's browser).
    const proposerCharacter = await loadAnyCharacter(proposer);
    if (proposerCharacter) {
      verifyInventory(proposerCharacter, sanitizedOffer.items);
      if (num(proposerCharacter.ouro) < sanitizedOffer.gold) {
        throw new Error('Não tens ouro suficiente para esta oferta.');
      }
    }

    const trade = await TradesApi.propose({
      from: proposer, to: target,
      offer: sanitizedOffer, request: sanitizedRequest,
      kind: 'trade',
    });
    emit('created', trade);
    log('trade', { tradeId: trade.id, from: proposer, to: target, status: 'pending' }, proposer);
    return trade;
  }

  /**
   * Accept a trade. We're in the recipient's browser so we own the
   * authoritative copy of both characters (we can read either from
   * Supabase). Mutates inventories + gold, persists, then flips the
   * trade status.
   */
  async acceptTrade(tradeId, username) {
    const all = await TradesApi.listForUser(username, { status: 'pending' });
    const trade = all.find((t) => t.id === tradeId);
    if (!trade) throw new Error('Esta proposta já não está disponível.');
    if (norm(trade.to_username) !== norm(username)) throw new Error('Só o destinatário pode aceitar esta troca.');

    const proposer = trade.from_username;
    const target = trade.to_username;
    const proposerCharacter = await loadAnyCharacter(proposer);
    const targetCharacter   = await loadAnyCharacter(target);
    if (!proposerCharacter || !targetCharacter) {
      throw new Error('Não foi possível carregar uma das fichas. Pede ao GM para verificar.');
    }

    const offerItems   = trade.offer_items   || [];
    const requestItems = trade.request_items || [];
    const offerGold    = num(trade.offer_gold);
    const requestGold  = num(trade.request_gold);

    verifyInventory(proposerCharacter, offerItems);
    verifyInventory(targetCharacter, requestItems);

    if (num(proposerCharacter.ouro) < offerGold) throw new Error('O proponente já não tem o ouro oferecido.');
    if (num(targetCharacter.ouro)   < requestGold) throw new Error('Já não tens o ouro pedido.');

    const offered = removeItems(proposerCharacter, offerItems);
    const requested = removeItems(targetCharacter, requestItems);

    addItems(targetCharacter, offered);
    addItems(proposerCharacter, requested);

    proposerCharacter.ouro = num(proposerCharacter.ouro) - offerGold + requestGold;
    targetCharacter.ouro   = num(targetCharacter.ouro)   - requestGold + offerGold;

    await Promise.all([
      saveAnyCharacter(proposer, proposerCharacter),
      saveAnyCharacter(target, targetCharacter),
    ]);

    const updated = await TradesApi.setStatus(tradeId, 'accepted');
    emit('accepted', updated || trade);
    log('trade', { tradeId, from: proposer, to: target, status: 'accepted' }, username);
    return updated;
  }

  async rejectTrade(tradeId, username) {
    const all = await TradesApi.listForUser(username, { status: 'pending' });
    const trade = all.find((t) => t.id === tradeId);
    if (!trade) throw new Error('Esta proposta já não está disponível.');
    if (norm(trade.to_username) !== norm(username)) throw new Error('Só o destinatário pode recusar esta troca.');
    const updated = await TradesApi.setStatus(tradeId, 'rejected');
    emit('rejected', updated || trade);
    return updated;
  }

  async cancelTrade(tradeId, username) {
    const all = await TradesApi.listForUser(username, { status: 'pending' });
    const trade = all.find((t) => t.id === tradeId);
    if (!trade) throw new Error('Esta proposta já não está disponível.');
    if (norm(trade.from_username) !== norm(username)) throw new Error('Só o proponente pode cancelar esta troca.');
    const updated = await TradesApi.setStatus(tradeId, 'cancelled');
    emit('cancelled', updated || trade);
    return updated;
  }

  /**
   * GM forced transfer logger: writes a "forced" trade entry so the
   * receiver sees it in their history. The actual inventory mutation
   * is done by the GiftTransfer module; this just records what
   * happened.
   */
  async logForcedTransfer({ from, to, items, gold, note }) {
    const row = await TradesApi.forced({ from, to, items, gold, note });
    emit('forced', row);
    return row;
  }

  /** Subscribe to realtime trade updates. Returns a cleanup function. */
  async subscribe(callback) {
    return TradesApi.subscribe(callback);
  }
}

// ── Legacy adapter ──────────────────────────────────────────
/**
 * Older code wrote trades with `{ from, to, offer, request }` shape.
 * Map to the new column-shaped row when reading from localStorage.
 */
function legacyToNew(row) {
  if (row.from_username) return row;
  return {
    id: row.id,
    from_username: row.from,
    to_username: row.to,
    offer_items: row.offer?.items || [],
    offer_gold:  row.offer?.gold  || 0,
    request_items: row.request?.items || [],
    request_gold:  row.request?.gold  || 0,
    status: row.status,
    kind: 'trade',
    created_at: row.created_at,
    decided_at: row.decided_at || null,
  };
}
