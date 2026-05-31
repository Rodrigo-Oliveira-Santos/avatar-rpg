const STORAGE_KEY = 'avatar_rpg_trades';

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const getTrades = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export function getTradeNotificationCount(username) {
  const key = normalizeName(username);
  if (!key) return 0;

  return getTrades().filter((trade) => trade.status === 'pending' && normalizeName(trade.to) === key).length;
}

export function updateTradeBadge(username) {
  const badge = document.querySelector('[data-trade-badge]');
  if (!badge) return 0;

  const count = getTradeNotificationCount(username);
  badge.textContent = String(count);
  badge.hidden = count <= 0;
  badge.classList.toggle('has-notifications', count > 0);

  return count;
}
