/**
 * Trade notifications helpers
 *
 * `updateTradeBadge` re-counts pending trades aimed at `username` and
 * paints the nav badge. With the move to Supabase-backed trades we now
 * do the count asynchronously through `api/trades.getPendingCount` —
 * the function stays synchronous-callable for back-compat but kicks off
 * the fetch and patches the badge when the result arrives.
 *
 * `getTradeNotificationCount` keeps its synchronous signature by
 * reading the local mirror; the async truth lives in `getPendingCount`.
 */

import * as TradesApi from '../api/trades.js';

const STORAGE_KEY = 'avatar_rpg_trades';

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const readLocal = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

export function getTradeNotificationCount(username) {
  const key = normalizeName(username);
  if (!key) return 0;
  return readLocal().filter((t) => t.status === 'pending'
    && normalizeName(t.to_username || t.to) === key).length;
}

export function updateTradeBadge(username) {
  const badge = document.querySelector('[data-trade-badge]');
  if (!badge) return 0;

  const paint = (count) => {
    badge.textContent = String(count);
    badge.hidden = count <= 0;
    badge.classList.toggle('has-notifications', count > 0);
  };

  // Optimistic paint from local cache so the badge isn't blank.
  paint(getTradeNotificationCount(username));

  // Async refresh from Supabase — fixes the cross-browser case where
  // the local cache is stale.
  TradesApi.getPendingCount(username).then((count) => paint(Number(count) || 0)).catch(() => {});
}

