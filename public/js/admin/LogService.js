/**
 * System log service backed by localStorage.
 */

const STORAGE_KEY = 'avatar_rpg_system_logs';
const MAX_ENTRIES = 1000;

function readLogs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const logs = JSON.parse(stored);
    return Array.isArray(logs) ? logs : [];
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function normalizePagination(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
}

export function log(action, details = {}, actor = 'unknown') {
  const logs = readLogs();
  const entry = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    action,
    actor,
    details,
  };

  logs.push(entry);

  if (logs.length > MAX_ENTRIES) {
    logs.splice(0, logs.length - MAX_ENTRIES);
  }

  writeLogs(logs);
  return entry;
}

export function getLogs(options = {}) {
  const { action, actor } = options;
  const limit = normalizePagination(options.limit, null);
  const offset = normalizePagination(options.offset, 0);

  let logs = readLogs();

  if (action) {
    logs = logs.filter(entry => entry.action === action);
  }

  if (actor) {
    logs = logs.filter(entry => entry.actor === actor);
  }

  if (offset > 0) {
    logs = logs.slice(offset);
  }

  if (limit !== null) {
    logs = logs.slice(0, limit);
  }

  return logs;
}

export function clearLogs() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getLogCount() {
  return readLogs().length;
}
