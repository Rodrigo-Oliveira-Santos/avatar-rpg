import { log } from '../admin/LogService.js';

const STORAGE_KEY = 'avatar_rpg_trades';
const CHARACTER_KEY_PREFIX = 'avatar_rpg_character_';
const MAX_TRADES = 100;
export const TRADE_UPDATED_EVENT = 'avatar-rpg:trades-updated';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const sanitizeGold = (value) => {
  const amount = Number.parseInt(value, 10);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const sanitizeItems = (items = []) => {
  const grouped = new Map();

  items.forEach((item) => {
    const name = String(item?.name || '').trim();
    const quantity = Number.parseInt(item?.quantity, 10);

    if (!name || !Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    const key = normalizeName(name);
    const existing = grouped.get(key);

    if (existing) {
      existing.quantity += quantity;
      return;
    }

    grouped.set(key, { name, quantity });
  });

  return Array.from(grouped.values());
};

const cloneItem = (item, quantity) => ({
  ...item,
  quantity,
  id: item?.id || crypto.randomUUID()
});

const ensureInventory = (character) => {
  if (!Array.isArray(character.inventario)) {
    character.inventario = [];
  }

  return character.inventario;
};

const loadCharacter = (username) => readJson(`${CHARACTER_KEY_PREFIX}${username}`, null);

const saveCharacter = (username, character) => {
  writeJson(`${CHARACTER_KEY_PREFIX}${username}`, character);
};

const getTradeSummaryTotal = (tradeSide = {}) => sanitizeGold(tradeSide.gold) + sanitizeItems(tradeSide.items).length;

const getInventoryQuantity = (inventory, name) => {
  const key = normalizeName(name);
  return inventory
    .filter((item) => normalizeName(item?.name) === key)
    .reduce((total, item) => total + Math.max(0, Number.parseInt(item?.quantity, 10) || 0), 0);
};

const verifyInventory = (character, items = []) => {
  const inventory = ensureInventory(character);

  items.forEach((item) => {
    const available = getInventoryQuantity(inventory, item.name);

    if (available < item.quantity) {
      throw new Error(`Item indisponível: ${item.name} (${available}/${item.quantity})`);
    }
  });
};

const removeItems = (character, items = []) => {
  const inventory = ensureInventory(character);
  const transferred = [];

  items.forEach((requestedItem) => {
    let remaining = requestedItem.quantity;
    const key = normalizeName(requestedItem.name);

    for (let index = 0; index < inventory.length && remaining > 0; index += 1) {
      const currentItem = inventory[index];
      if (normalizeName(currentItem?.name) !== key) {
        continue;
      }

      const currentQuantity = Math.max(0, Number.parseInt(currentItem?.quantity, 10) || 0);
      if (currentQuantity <= 0) {
        continue;
      }

      const taken = Math.min(currentQuantity, remaining);
      transferred.push(cloneItem(currentItem, taken));
      remaining -= taken;

      if (taken === currentQuantity) {
        inventory.splice(index, 1);
        index -= 1;
      } else {
        currentItem.quantity = currentQuantity - taken;
      }
    }

    if (remaining > 0) {
      throw new Error(`Item indisponível: ${requestedItem.name}`);
    }
  });

  return transferred;
};

const addItems = (character, items = []) => {
  const inventory = ensureInventory(character);

  items.forEach((incomingItem) => {
    const key = normalizeName(incomingItem.name);
    const existing = inventory.find((item) => normalizeName(item?.name) === key);

    if (existing) {
      existing.quantity = (Number.parseInt(existing.quantity, 10) || 0) + (Number.parseInt(incomingItem.quantity, 10) || 0);
      return;
    }

    inventory.push({ ...incomingItem });
  });
};

const emitTradeUpdate = (type, trade) => {
  window.dispatchEvent(new CustomEvent(TRADE_UPDATED_EVENT, {
    detail: { type, trade }
  }));
};

export class TradeManager {
  getTrades() {
    return readJson(STORAGE_KEY, []);
  }

  saveTrades(trades) {
    const cappedTrades = [...trades]
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, MAX_TRADES);

    writeJson(STORAGE_KEY, cappedTrades);
    return cappedTrades;
  }

  createTrade(from, to, offer = {}, request = {}) {
    const proposer = String(from || '').trim();
    const target = String(to || '').trim();

    if (!proposer || !target) {
      throw new Error('Utilizadores inválidos para a troca.');
    }

    if (normalizeName(proposer) === normalizeName(target)) {
      throw new Error('Não podes propor uma troca a ti próprio.');
    }

    const proposerCharacter = loadCharacter(proposer);
    const targetCharacter = loadCharacter(target);

    if (!proposerCharacter || !targetCharacter) {
      throw new Error('Ambos os personagens têm de existir neste navegador.');
    }

    const sanitizedOffer = {
      items: sanitizeItems(offer.items),
      gold: sanitizeGold(offer.gold)
    };

    const sanitizedRequest = {
      items: sanitizeItems(request.items),
      gold: sanitizeGold(request.gold)
    };

    if (getTradeSummaryTotal(sanitizedOffer) === 0 && getTradeSummaryTotal(sanitizedRequest) === 0) {
      throw new Error('A proposta tem de incluir pelo menos um item ou ouro.');
    }

    verifyInventory(proposerCharacter, sanitizedOffer.items);
    verifyInventory(targetCharacter, sanitizedRequest.items);

    if ((Number.parseInt(proposerCharacter.ouro, 10) || 0) < sanitizedOffer.gold) {
      throw new Error('Não tens ouro suficiente para esta oferta.');
    }

    if ((Number.parseInt(targetCharacter.ouro, 10) || 0) < sanitizedRequest.gold) {
      throw new Error('O alvo não tem ouro suficiente para este pedido.');
    }

    const trade = {
      id: crypto.randomUUID(),
      from: proposer,
      to: target,
      status: 'pending',
      created_at: new Date().toISOString(),
      offer: sanitizedOffer,
      request: sanitizedRequest
    };

    const trades = this.saveTrades([trade, ...this.getTrades()]);
    emitTradeUpdate('created', trade);
    return trades.find((entry) => entry.id === trade.id) || trade;
  }

  acceptTrade(tradeId, username) {
    const trades = this.getTrades();
    const trade = trades.find((entry) => entry.id === tradeId);

    if (!trade || trade.status !== 'pending') {
      throw new Error('Esta proposta já não está disponível.');
    }

    if (normalizeName(trade.to) !== normalizeName(username)) {
      throw new Error('Só o destinatário pode aceitar esta troca.');
    }

    const proposerCharacter = loadCharacter(trade.from);
    const targetCharacter = loadCharacter(trade.to);

    if (!proposerCharacter || !targetCharacter) {
      throw new Error('Um dos personagens já não existe neste navegador.');
    }

    verifyInventory(proposerCharacter, trade.offer.items);
    verifyInventory(targetCharacter, trade.request.items);

    const proposerGold = Number.parseInt(proposerCharacter.ouro, 10) || 0;
    const targetGold = Number.parseInt(targetCharacter.ouro, 10) || 0;

    if (proposerGold < sanitizeGold(trade.offer.gold)) {
      throw new Error('O proponente já não tem o ouro oferecido.');
    }

    if (targetGold < sanitizeGold(trade.request.gold)) {
      throw new Error('Já não tens o ouro pedido.');
    }

    const offeredItems = removeItems(proposerCharacter, trade.offer.items);
    const requestedItems = removeItems(targetCharacter, trade.request.items);

    addItems(targetCharacter, offeredItems);
    addItems(proposerCharacter, requestedItems);

    proposerCharacter.ouro = proposerGold - sanitizeGold(trade.offer.gold) + sanitizeGold(trade.request.gold);
    targetCharacter.ouro = targetGold - sanitizeGold(trade.request.gold) + sanitizeGold(trade.offer.gold);

    if (proposerCharacter.ouro < 0 || targetCharacter.ouro < 0) {
      throw new Error('A troca deixaria um dos jogadores com ouro negativo.');
    }

    saveCharacter(trade.from, proposerCharacter);
    saveCharacter(trade.to, targetCharacter);

    trade.status = 'accepted';
    this.saveTrades(trades);

    log('trade', {
      tradeId: trade.id,
      from: trade.from,
      to: trade.to,
      offer: trade.offer,
      request: trade.request,
      status: 'accepted'
    }, username);

    emitTradeUpdate('accepted', trade);
    return trade;
  }

  rejectTrade(tradeId, username) {
    const trades = this.getTrades();
    const trade = trades.find((entry) => entry.id === tradeId);

    if (!trade || trade.status !== 'pending') {
      throw new Error('Esta proposta já não está disponível.');
    }

    if (normalizeName(trade.to) !== normalizeName(username)) {
      throw new Error('Só o destinatário pode recusar esta troca.');
    }

    trade.status = 'rejected';
    this.saveTrades(trades);
    emitTradeUpdate('rejected', trade);
    return trade;
  }

  cancelTrade(tradeId, username) {
    const trades = this.getTrades();
    const trade = trades.find((entry) => entry.id === tradeId);

    if (!trade || trade.status !== 'pending') {
      throw new Error('Esta proposta já não está disponível.');
    }

    if (normalizeName(trade.from) !== normalizeName(username)) {
      throw new Error('Só o proponente pode cancelar esta troca.');
    }

    trade.status = 'cancelled';
    this.saveTrades(trades);
    emitTradeUpdate('cancelled', trade);
    return trade;
  }

  getPendingTrades(username) {
    const key = normalizeName(username);
    return this.getTrades().filter((trade) => trade.status === 'pending' && (normalizeName(trade.from) === key || normalizeName(trade.to) === key));
  }

  getAllTrades(username) {
    const key = normalizeName(username);
    return this.getTrades().filter((trade) => normalizeName(trade.from) === key || normalizeName(trade.to) === key);
  }

  getPendingCount(username) {
    return this.getPendingTrades(username).length;
  }
}
