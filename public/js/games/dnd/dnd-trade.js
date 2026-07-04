/**
 * D&D 5e — trade entre jogadores.
 *
 * Persistência: localStorage (`dnd_trades`). Estrutura de cada trade:
 *
 *   {
 *     id, from_user, to_user, status: 'pending'|'accepted'|'rejected'|'cancelled',
 *     give:  { items: [{ name, qty }], gold: number },  // o que `from_user` oferece
 *     want:  { items: [{ name, qty }], gold: number },  // o que pede em troca
 *     created_at, updated_at,
 *   }
 *
 * Quando aceite, a função `acceptTrade` aplica as transferências às
 * fichas das duas partes (via API D&D) e marca o trade como `accepted`.
 * Não valida posse: o GM/jogador é responsável por trades fair.
 */

import { load as loadChar, save as saveChar, ensureRegistered } from '../../api/dnd-characters.js';
import { DnDCharacter } from './dnd-character.js';

const STORAGE_KEY = 'dnd_trades';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function genId() {
  return `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function nowIso() { return new Date().toISOString(); }

function sanitizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      name: String(it?.name || '').trim(),
      qty: Math.max(0, Math.floor(Number(it?.qty) || 0)),
    }))
    .filter((it) => it.name && it.qty > 0);
}

function sanitizeGold(value) {
  const n = Math.floor(Number(value) || 0);
  return n > 0 ? n : 0;
}

// ─── Public API ────────────────────────────────────────────────────

export function listTrades(filter = {}) {
  const all = readAll();
  let out = all;
  if (filter.user) {
    out = out.filter((t) => t.from_user === filter.user || t.to_user === filter.user);
  }
  if (filter.status) {
    out = out.filter((t) => t.status === filter.status);
  }
  return out.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

export function listIncomingPending(user) {
  return readAll().filter((t) => t.to_user === user && t.status === 'pending');
}

export function listOutgoingPending(user) {
  return readAll().filter((t) => t.from_user === user && t.status === 'pending');
}

export function createTrade({ from_user, to_user, give, want }) {
  if (!from_user || !to_user) throw new Error('from_user e to_user são obrigatórios');
  if (from_user === to_user) throw new Error('Não podes negociar contigo próprio');

  const trade = {
    id: genId(),
    from_user,
    to_user,
    status: 'pending',
    give: {
      items: sanitizeItems(give?.items),
      gold:  sanitizeGold(give?.gold),
    },
    want: {
      items: sanitizeItems(want?.items),
      gold:  sanitizeGold(want?.gold),
    },
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  if (!trade.give.items.length && !trade.give.gold && !trade.want.items.length && !trade.want.gold) {
    throw new Error('A proposta de trade está vazia.');
  }

  const all = readAll();
  all.unshift(trade);
  writeAll(all);
  ensureRegistered(from_user);
  ensureRegistered(to_user);
  return trade;
}

export async function acceptTrade(tradeId, byUser) {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === tradeId);
  if (idx < 0) throw new Error('Trade não encontrado');
  const trade = all[idx];
  if (trade.status !== 'pending') throw new Error('Trade já foi processado');
  if (trade.to_user !== byUser) throw new Error('Só o destinatário pode aceitar');

  // Pre-validação: verifica que ambas as partes têm stock suficiente
  // ANTES de mexer em qualquer ficha. Evita o dupe-bug de aplicar
  // metade do trade e ficar sem rollback (multi-jogador local sem
  // locks — best-effort).
  await assertCanPay(trade.from_user, trade.give);
  await assertCanPay(trade.to_user,   trade.want);

  // Aplicar transferências em memória
  await applyTransfer(trade.from_user, trade.give, /* outgoing */ true);
  await applyTransfer(trade.from_user, trade.want, /* outgoing */ false);
  await applyTransfer(trade.to_user,   trade.want, /* outgoing */ true);
  await applyTransfer(trade.to_user,   trade.give, /* outgoing */ false);

  trade.status = 'accepted';
  trade.updated_at = nowIso();
  all[idx] = trade;
  writeAll(all);
  return trade;
}

/**
 * Verifica que `username` consegue pagar `payload` (gold + items).
 * Lança se a ficha não existir ou se não tiver stock suficiente.
 */
async function assertCanPay(username, payload) {
  if (!payload.gold && !payload.items?.length) return;
  const raw = await loadChar(username);
  if (!raw) throw new Error(`${username} não tem ficha — trade não pode prosseguir.`);
  const c = new DnDCharacter(raw);
  if (payload.gold > c.gold) {
    throw new Error(`${username} só tem ${c.gold} PO (precisa de ${payload.gold}).`);
  }
  for (const it of (payload.items || [])) {
    const key = it.name.trim().toLowerCase();
    const owned = c.inventory.find((x) => (x.name || '').trim().toLowerCase() === key);
    const have = Number(owned?.qty) || 0;
    if (have < it.qty) {
      throw new Error(`${username} só tem ${have} × ${it.name} (precisa de ${it.qty}).`);
    }
  }
}

export function rejectTrade(tradeId, byUser) {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === tradeId);
  if (idx < 0) throw new Error('Trade não encontrado');
  const trade = all[idx];
  if (trade.status !== 'pending') throw new Error('Trade já foi processado');
  if (trade.to_user !== byUser) throw new Error('Só o destinatário pode rejeitar');
  trade.status = 'rejected';
  trade.updated_at = nowIso();
  all[idx] = trade;
  writeAll(all);
  return trade;
}

export function cancelTrade(tradeId, byUser) {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === tradeId);
  if (idx < 0) throw new Error('Trade não encontrado');
  const trade = all[idx];
  if (trade.status !== 'pending') throw new Error('Trade já foi processado');
  if (trade.from_user !== byUser) throw new Error('Só o autor pode cancelar');
  trade.status = 'cancelled';
  trade.updated_at = nowIso();
  all[idx] = trade;
  writeAll(all);
  return trade;
}

// ─── Internals ─────────────────────────────────────────────────────

/**
 * Aplica `payload = { items: [...], gold }` na ficha de `username`.
 *   • `outgoing=true`: subtrai (sai da ficha)
 *   • `outgoing=false`: soma (entra na ficha)
 *
 * Itens são procurados pelo nome (case-insensitive). Se não existirem
 * na destinatária, são criados; na origem, se não houver stock
 * suficiente, vai a 0 (sem rollback — multi-jogador local não tem locks).
 */
async function applyTransfer(username, payload, outgoing) {
  const raw = await loadChar(username);
  const c = new DnDCharacter(raw || {});

  // Gold
  if (payload.gold) {
    c.addGold(outgoing ? -payload.gold : payload.gold);
  }

  // Items
  payload.items.forEach((it) => {
    const key = it.name.trim().toLowerCase();
    const existing = c.inventory.find((x) => (x.name || '').trim().toLowerCase() === key);
    if (outgoing) {
      if (!existing) return;
      existing.qty = Math.max(0, (Number(existing.qty) || 0) - it.qty);
      if (existing.qty === 0) {
        c.inventory = c.inventory.filter((x) => x !== existing);
      }
    } else {
      if (existing) {
        existing.qty = (Number(existing.qty) || 0) + it.qty;
      } else {
        c.inventory.push({ name: it.name, qty: it.qty, weight: 0, notes: '' });
      }
    }
  });

  await saveChar(username, c.toJSON());
}
