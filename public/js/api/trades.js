/**
 * Trades API
 *
 * Persistence + realtime façade for player trades. Supabase-first, with
 * a localStorage fallback so the UI keeps working offline (single-tab
 * notifications still fire via the in-window CustomEvent in TradeManager).
 *
 * Shape of a trade row (as stored / returned):
 *   { id, from_username, to_username,
 *     offer_items: [{ name, quantity }], offer_gold: int,
 *     request_items: [{ name, quantity }], request_gold: int,
 *     status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'forced',
 *     kind:   'trade' | 'forced' | 'loot' | 'reward',
 *     note: string | null,
 *     created_at, decided_at }
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';

const LOCAL_KEY = 'avatar_rpg_trades';

const norm = (s) => String(s || '').trim().toLowerCase();

// ── Local fallback ───────────────────────────────────────────
function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLocal(rows) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows)); }
  catch (err) { console.warn('[trades] localStorage write failed', err); }
}

function localId() { return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }

// ── Public API ───────────────────────────────────────────────

/**
 * List all trades involving `username` (as proposer OR recipient),
 * newest first. Pass `{ status: 'pending' }` to filter.
 */
export async function listForUser(username, { status } = {}) {
  const key = norm(username);
  if (!key) return [];
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      let query = client.from('trades').select('*')
        .or(`from_username.eq.${key},to_username.eq.${key}`)
        .order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[trades.listForUser] Supabase fetch failed', err);
    }
  }
  const local = readLocal();
  return local.filter((t) => (norm(t.from_username) === key || norm(t.to_username) === key)
    && (!status || t.status === status));
}

/** Number of trades pending acceptance by `username`. */
export async function getPendingCount(username) {
  const key = norm(username);
  if (!key) return 0;
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { count, error } = await client.from('trades')
        .select('id', { count: 'exact', head: true })
        .eq('to_username', key)
        .eq('status', 'pending');
      if (error) throw error;
      return Number(count) || 0;
    } catch (err) {
      console.warn('[trades.getPendingCount] Supabase failed', err);
    }
  }
  return readLocal().filter((t) => t.status === 'pending' && norm(t.to_username) === key).length;
}

/**
 * Create a proposal. Inventory / gold validation is the caller's
 * responsibility (TradeManager does the check before calling). On
 * Supabase failure we fall back to a local row so the user can still
 * see the attempt in their history.
 */
export async function propose({ from, to, offer, request, kind = 'trade', note = null }) {
  const payload = {
    from_username: norm(from),
    to_username:   norm(to),
    offer_items:   offer?.items   || [],
    offer_gold:    Number(offer?.gold)   || 0,
    request_items: request?.items || [],
    request_gold:  Number(request?.gold) || 0,
    status: 'pending',
    kind,
    note,
  };

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client.from('trades').insert(payload).select('*').single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[trades.propose] Supabase failed, falling back to local', err);
    }
  }
  const row = { ...payload, id: localId(), created_at: new Date().toISOString(), decided_at: null };
  writeLocal([row, ...readLocal()]);
  return row;
}

/**
 * Record a GM-forced transfer. Stored as `status='forced'` so it shows up
 * in the recipient's history without ever being "pending".
 */
export async function forced({ from, to, items = [], gold = 0, note = null, kind = 'forced' }) {
  const payload = {
    from_username: norm(from),
    to_username:   norm(to),
    offer_items:   items,
    offer_gold:    Number(gold) || 0,
    request_items: [],
    request_gold:  0,
    status: 'forced',
    kind,
    note,
  };

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client.from('trades')
        .insert({ ...payload, decided_at: new Date().toISOString() })
        .select('*').single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[trades.forced] Supabase failed, falling back to local', err);
    }
  }
  const row = { ...payload, id: localId(), created_at: new Date().toISOString(), decided_at: new Date().toISOString() };
  writeLocal([row, ...readLocal()]);
  return row;
}

/**
 * Patch a row to a terminal status (used internally by TradeManager
 * after it has applied the inventory/gold mutations atomically on the
 * local sheet, which then auto-saves to Supabase).
 */
export async function setStatus(tradeId, status) {
  const decidedAt = new Date().toISOString();
  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client.from('trades')
        .update({ status, decided_at: decidedAt })
        .eq('id', tradeId).select('*').single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[trades.setStatus] Supabase failed', err);
    }
  }
  const rows = readLocal();
  const idx = rows.findIndex((t) => t.id === tradeId);
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], status, decided_at: decidedAt };
    writeLocal(rows);
    return rows[idx];
  }
  return null;
}

/**
 * Realtime subscription. The callback fires (no payload) on any
 * INSERT/UPDATE/DELETE on `trades` so the caller can refresh.
 */
export async function subscribe(callback) {
  if (!isSupabaseEnabled()) return () => {};
  const client = await getSupabaseClient();
  const channel = client
    .channel('trades-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => {
      try { callback(); } catch (err) { console.warn('[trades.subscribe]', err); }
    })
    .subscribe();
  return () => { client.removeChannel(channel); };
}
