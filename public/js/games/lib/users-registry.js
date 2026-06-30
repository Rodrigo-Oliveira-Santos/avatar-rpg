/**
 * Per-app users registry + role / delete management.
 *
 * Each app owns an independent registry in localStorage:
 *   • avatar  → `avatar_users_registry`
 *   • dnd     → `dnd_users_registry`
 *   • mc      → `mc_users_registry`
 *
 * The same username can therefore exist as three completely separate
 * accounts (admin in Avatar, player in D&D, GM in MC, etc.). Deleting
 * a user in one app only removes that app's slice of the data;
 * roles / characters / builds in the other two stay untouched.
 *
 * Legacy migration
 * ----------------
 * Before 2026-06-30 there was a single cross-app key
 * `avatar_rpg_users_registry`. The first read of each per-app key
 * after the split copies the legacy entries into all three new keys
 * (only when the new key is empty), so existing installs migrate
 * losslessly. The legacy key is left in place so anything that still
 * reads it (e.g. external tooling, backups) keeps working.
 *
 * Public surface
 * --------------
 * Backwards-compatible exports (`readRegistry`, `writeRegistry`,
 * `getUsers`, `applyRoleChange`, `deleteUser`, …) default to the
 * Avatar app so the existing Avatar AdminPanel keeps working. The
 * D&D + MC admin panels (and the cross-app landing admin) use the
 * `createRegistryAPI(appId)` factory to get the same shape scoped to
 * their app — or `deleteUser(name, { app: 'dnd' })` style explicit
 * overrides for one-off calls.
 */

export const MAX_ADMINS = 3;

/** App ids used throughout the multi-game platform. */
export const APP_IDS = ['avatar', 'dnd', 'mc'];

/** localStorage key for each app's standalone registry. */
export const APP_REGISTRY_KEYS = {
  avatar: 'avatar_users_registry',
  dnd:    'dnd_users_registry',
  mc:     'mc_users_registry',
};

/** Pre-split key. Still read on first migration; never written. */
export const LEGACY_REGISTRY_KEY = 'avatar_rpg_users_registry';

/**
 * Kept for back-compat with callers that imported the old single-key
 * `STORAGE_KEY`. Always points at the Avatar registry now.
 */
export const STORAGE_KEY = APP_REGISTRY_KEYS.avatar;

export const ROLE_LABELS = {
  player: 'Jogador',
  gm: 'GM',
  admin: 'Admin',
};

export const ROLE_ORDER = { player: 0, gm: 1, admin: 2 };

export const APP_LABELS = {
  avatar: 'Avatar RPG',
  dnd:    'D&D 5e',
  mc:     'Minecraft Builds',
};

/**
 * Per-app session storage keys. Each app holds an independent session
 * object (see `shared-auth.js` / `api/auth.js`).
 */
export const APP_SESSION_KEYS = {
  avatar: 'avatar_rpg_user',
  dnd:    'dnd_user',
  mc:     'mc_user',
};

const ALL_SESSION_KEYS = [
  APP_SESSION_KEYS.avatar,
  APP_SESSION_KEYS.dnd,
  APP_SESSION_KEYS.mc,
  'landing_user',
];

/**
 * Default users seeded into every app's registry on first read. Each
 * app starts with the same 7 presets so the seed.sql / local-seed
 * test profiles work identically across apps. The admin can change
 * roles per-app afterwards.
 */
const DEFAULT_USERS = {
  zuko: 'player',
  katara: 'player',
  toph: 'player',
  aang: 'player',
  sokka: 'player',
  gm: 'gm',
  admin: 'admin',
};

// ──────────────────────────────────────────────────────────────────
// Tiny helpers
// ──────────────────────────────────────────────────────────────────

export function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

export function normalizeRole(role) {
  return ROLE_LABELS[role] ? role : 'player';
}

export function normalizeAppId(appId) {
  const id = String(appId || '').trim().toLowerCase();
  return APP_IDS.includes(id) ? id : 'avatar';
}

function safeJsonGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function safeJsonSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ──────────────────────────────────────────────────────────────────
// Per-app registry I/O (with legacy migration)
// ──────────────────────────────────────────────────────────────────

/**
 * Read one app's registry. On the very first read after the split we
 * copy the legacy cross-app registry into every per-app key that's
 * still empty, so the migration is transparent and idempotent.
 *
 * Returns a fresh object — mutate locally then call `writeAppRegistry`.
 */
export function readAppRegistry(appId = 'avatar') {
  const id = normalizeAppId(appId);
  const key = APP_REGISTRY_KEYS[id];
  let parsed = safeJsonGet(key);

  // First-time-after-split migration: copy legacy → this app key.
  if ((!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      && typeof localStorage !== 'undefined') {
    const legacy = safeJsonGet(LEGACY_REGISTRY_KEY);
    if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
      // Deep-clone so the three apps don't accidentally share references.
      try { parsed = JSON.parse(JSON.stringify(legacy)); }
      catch { parsed = {}; }
      safeJsonSet(key, parsed);
    } else {
      parsed = {};
    }
  }

  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

export function writeAppRegistry(appId, registry) {
  const id = normalizeAppId(appId);
  safeJsonSet(APP_REGISTRY_KEYS[id], registry);
}

/**
 * Seed an app's registry with the 7 default users (matching the
 * supabase/seed.sql roster). Idempotent: existing entries are left
 * alone, only missing usernames are added.
 *
 * @returns the full registry after seeding.
 */
export function ensureAppSeed(appId = 'avatar') {
  const id = normalizeAppId(appId);
  const reg = readAppRegistry(id);
  if (Object.keys(reg).length > 0) return reg;
  const createdAt = new Date().toISOString();
  const seeded = Object.fromEntries(
    Object.entries(DEFAULT_USERS).map(([u, r]) => [u, { role: r, created_at: createdAt }])
  );
  writeAppRegistry(id, seeded);
  return seeded;
}

// Back-compat: the old module-level helpers operate on the Avatar app.
export function readRegistry() { return readAppRegistry('avatar'); }
export function writeRegistry(registry) { writeAppRegistry('avatar', registry); }
function ensureSeed() { return ensureAppSeed('avatar'); }

// ──────────────────────────────────────────────────────────────────
// Sessions
// ──────────────────────────────────────────────────────────────────

/**
 * Read every active session across all four `*_user` localStorage
 * keys. Each entry carries the `app` it belongs to (or 'landing')
 * so consumers can group / route on it.
 */
export function getActiveSessions() {
  const out = [];
  if (typeof localStorage === 'undefined') return out;
  for (const key of ALL_SESSION_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed?.username) {
        out.push({
          key,
          app: key.replace(/_user$/, '').replace('avatar_rpg', 'avatar'),
          username: normalizeUsername(parsed.username),
          role: normalizeRole(parsed.role),
        });
      }
    } catch {}
  }
  return out;
}

export function hasAnyAdminSession() {
  return getActiveSessions().some((s) => s.role === 'admin');
}

export function getCurrentAdmin() {
  return getActiveSessions().find((s) => s.role === 'admin') || null;
}

// ──────────────────────────────────────────────────────────────────
// User listing
// ──────────────────────────────────────────────────────────────────

/**
 * Sort + project a registry map into the row shape the UIs render.
 */
function projectRegistry(reg) {
  return Object.entries(reg)
    .map(([username, data]) => ({
      username,
      role: normalizeRole(data?.role),
      created_at: data?.created_at || '',
    }))
    .sort((a, b) => {
      const byRole = ROLE_ORDER[b.role] - ROLE_ORDER[a.role];
      return byRole || a.username.localeCompare(b.username);
    });
}

/**
 * Return all users known to one app. Seeds the registry on first
 * call, folds in any active session whose user isn't yet listed,
 * and accepts an `extras` array of usernames the caller wants to
 * make sure show up (e.g. owners of orphan characters).
 */
export function getAppUsers(appId = 'avatar', extras = []) {
  const id = normalizeAppId(appId);
  const reg = { ...ensureAppSeed(id) };
  const sessions = getActiveSessions().filter((s) => s.app === id);
  let dirty = false;

  const wanted = new Set([
    ...sessions.map((s) => s.username),
    ...extras.map(normalizeUsername).filter(Boolean),
  ]);

  for (const username of wanted) {
    if (!username) continue;
    if (!reg[username]) {
      const sess = sessions.find((s) => s.username === username);
      reg[username] = {
        role: sess?.role || DEFAULT_USERS[username] || 'player',
        created_at: new Date().toISOString(),
      };
      dirty = true;
    }
  }

  if (dirty) writeAppRegistry(id, reg);
  return projectRegistry(reg);
}

/** Back-compat: defaults to Avatar. */
export function getUsers(extras = []) {
  return getAppUsers('avatar', extras);
}

export function getAdminCount(registry) {
  const reg = registry || readAppRegistry('avatar');
  return Object.values(reg).filter((e) => normalizeRole(e?.role) === 'admin').length;
}

// ──────────────────────────────────────────────────────────────────
// Role transitions (per app)
// ──────────────────────────────────────────────────────────────────

/**
 * Validate a role change inside one app's registry.
 *
 * Rules (per-app):
 *   • Player only moves up to GM.
 *   • GM moves down to Player or up to Admin.
 *   • Admin only moves down to GM.
 *   • Max MAX_ADMINS admins per app.
 *   • At least 1 admin must remain per app.
 *   • The acting session (`actor.username`) cannot demote itself.
 */
export function validateAppRoleChange({ appId = 'avatar', username, fromRole, toRole, actor }) {
  const id = normalizeAppId(appId);
  const reg = readAppRegistry(id);
  const adminCount = getAdminCount(reg);
  const target = normalizeUsername(username);
  const actorName = normalizeUsername(actor?.username);

  if (!target || fromRole === toRole) {
    return { allowed: false, reason: 'Alteração inválida.' };
  }

  if (target === actorName && ROLE_ORDER[toRole] < ROLE_ORDER[fromRole]) {
    return { allowed: false, reason: 'Não podes rebaixar a tua própria conta.' };
  }

  if (fromRole === 'player' && toRole !== 'gm') {
    return { allowed: false, reason: 'Jogadores só podem ser promovidos a GM.' };
  }
  if (fromRole === 'gm' && !['player', 'admin'].includes(toRole)) {
    return { allowed: false, reason: 'GMs só podem mudar para jogador ou admin.' };
  }
  if (fromRole === 'admin' && toRole !== 'gm') {
    return { allowed: false, reason: 'Admins só podem ser rebaixados a GM.' };
  }

  if (fromRole === 'gm' && toRole === 'admin' && adminCount >= MAX_ADMINS) {
    return { allowed: false, reason: `Já existem ${MAX_ADMINS} contas admin nesta app.` };
  }
  if (fromRole === 'admin' && toRole === 'gm' && adminCount <= 1) {
    return { allowed: false, reason: 'Tem de existir pelo menos 1 admin nesta app.' };
  }

  return { allowed: true, reason: '' };
}

/** Back-compat: Avatar-scoped role validation. */
export function validateRoleChange(args) {
  return validateAppRoleChange({ ...args, appId: 'avatar' });
}

/**
 * Sync ONLY the session key for the target app. Used by
 * applyAppRoleChange so changing a user's role in Avatar doesn't leak
 * into the D&D session (and vice-versa). The accounts are now
 * independent.
 */
function syncAppSession(appId, username, nextRole) {
  if (typeof localStorage === 'undefined') return;
  const key = APP_SESSION_KEYS[appId];
  if (!key) return;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (normalizeUsername(parsed?.username) !== username) return;
    parsed.role = nextRole;
    localStorage.setItem(key, JSON.stringify(parsed));
  } catch {}
}

export function applyAppRoleChange({ appId = 'avatar', username, fromRole, toRole, actor }) {
  const validation = validateAppRoleChange({ appId, username, fromRole, toRole, actor });
  if (!validation.allowed) return { ok: false, reason: validation.reason };

  const id = normalizeAppId(appId);
  const reg = readAppRegistry(id);
  const target = normalizeUsername(username);
  const existing = reg[target] || {};
  reg[target] = {
    ...existing,
    role: toRole,
    created_at: existing.created_at || new Date().toISOString(),
  };
  writeAppRegistry(id, reg);
  syncAppSession(id, target, toRole);
  return { ok: true, reason: '' };
}

/** Back-compat: Avatar-scoped role change. */
export function applyRoleChange(args) {
  return applyAppRoleChange({ ...args, appId: 'avatar' });
}

export function getActionsFor(role) {
  if (role === 'player') return [{ label: 'Promover a GM', toRole: 'gm', variant: 'gm' }];
  if (role === 'gm') return [
    { label: 'Promover a Admin', toRole: 'admin', variant: 'admin' },
    { label: 'Rebaixar a Jogador', toRole: 'player', variant: 'muted' },
  ];
  if (role === 'admin') return [{ label: 'Rebaixar a GM', toRole: 'gm', variant: 'danger' }];
  return [];
}

// ──────────────────────────────────────────────────────────────────
// Per-app account deletion
// ──────────────────────────────────────────────────────────────────

const AVATAR_CHARACTER_PREFIX = 'avatar_rpg_character_';
const AVATAR_TRADES_KEY = 'avatar_rpg_trades';
const DND_CHARACTER_PREFIX = 'dnd_character_';
const DND_CHARACTERS_REGISTRY_KEY = 'dnd_characters_registry';
const MC_BUILDS_KEY = 'mc_builds';
const MC_REACTIONS_KEY = 'mc_reactions';
const MC_LISTS_PREFIX = 'mc_lists_';

/**
 * Validate whether `actor` may delete `username` from the app's
 * registry. Per-app rules: can't delete yourself; can't delete the
 * last admin in the app.
 */
export function validateAppDeleteUser({ appId = 'avatar', username, actor }) {
  const id = normalizeAppId(appId);
  const reg = readAppRegistry(id);
  const target = normalizeUsername(username);
  const actorName = normalizeUsername(actor?.username);

  if (!target) return { allowed: false, reason: 'Username inválido.' };
  if (target === actorName) {
    return { allowed: false, reason: 'Não podes apagar a tua própria conta.' };
  }

  const entry = reg[target];
  const targetRole = normalizeRole(entry?.role);
  if (targetRole === 'admin' && getAdminCount(reg) <= 1) {
    return { allowed: false, reason: 'Tem de existir pelo menos 1 admin nesta app.' };
  }

  return { allowed: true, reason: '' };
}

/** Back-compat: Avatar-scoped delete validation. */
export function validateDeleteUser(args) {
  return validateAppDeleteUser({ ...args, appId: 'avatar' });
}

/** Common helper: remove the entry from one app's registry. */
function removeFromRegistry(appId, target) {
  const id = normalizeAppId(appId);
  const reg = readAppRegistry(id);
  if (!reg[target]) return false;
  delete reg[target];
  writeAppRegistry(id, reg);
  return true;
}

/** Common helper: drop the app's session if it's the target user. */
function dropSessionIfMatches(appId, target) {
  if (typeof localStorage === 'undefined') return false;
  const key = APP_SESSION_KEYS[appId];
  if (!key) return false;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (normalizeUsername(parsed?.username) !== target) return false;
    localStorage.removeItem(key);
    if (appId === 'avatar') {
      try { localStorage.removeItem('avatar_rpg_token'); } catch {}
    }
    return true;
  } catch { return false; }
}

/**
 * Delete the user's data on a single app and remove them from that
 * app's registry. Other apps are NOT touched — that's the whole
 * point of the per-app split. The Avatar AdminPanel, the D&D
 * AdminPage and the MC AdminPage all use this through their own
 * `app` argument; only the cross-app landing admin explicitly opts
 * into deleting from every app via `app: 'all'`.
 */
async function deleteFromAvatar(target) {
  const removed = { avatarCharacter: false, avatarTradesCleaned: 0, session: false, registry: false };

  // Capture the "was the character present" snapshot BEFORE delegating
  // to the API helper, because that helper also clears the same key.
  const charKey = `${AVATAR_CHARACTER_PREFIX}${target}`;
  const hadCharacter = localStorage.getItem(charKey) != null;

  // Best-effort: route through `api/gm-characters.deletePlayerAccount`
  // when available so Supabase (cascade on users) + trades cleanup run.
  try {
    const mod = await import('../../api/gm-characters.js');
    if (typeof mod.deletePlayerAccount === 'function') {
      await mod.deletePlayerAccount(target);
    }
  } catch (err) {
    console.warn('[users-registry] avatar gm-characters cleanup failed', err);
  }

  // Local mirror: belt-and-braces removal in case the API path missed it.
  if (localStorage.getItem(charKey) != null) {
    localStorage.removeItem(charKey);
  }
  if (hadCharacter) removed.avatarCharacter = true;

  // Local trades: drop any rows mentioning this user (the Supabase
  // cleanup above handles the remote side).
  const trades = safeJsonGet(AVATAR_TRADES_KEY);
  if (Array.isArray(trades)) {
    const next = trades.filter((t) => {
      const from = normalizeUsername(t?.from_username);
      const to = normalizeUsername(t?.to_username);
      return from !== target && to !== target;
    });
    if (next.length !== trades.length) {
      safeJsonSet(AVATAR_TRADES_KEY, next);
      removed.avatarTradesCleaned = trades.length - next.length;
    }
  }

  removed.session = dropSessionIfMatches('avatar', target);
  removed.registry = removeFromRegistry('avatar', target);
  return removed;
}

async function deleteFromDnd(target) {
  const removed = { dndCharacter: false, session: false, registry: false };
  try {
    const mod = await import('../../api/dnd-characters.js');
    if (typeof mod.deleteCharacter === 'function') {
      const r = await mod.deleteCharacter(target);
      if (r) removed.dndCharacter = true;
    }
  } catch (err) {
    console.warn('[users-registry] dnd cleanup via API failed, falling back to local', err);
  }
  // Local mirror
  const charKey = `${DND_CHARACTER_PREFIX}${target}`;
  if (localStorage.getItem(charKey) != null) {
    localStorage.removeItem(charKey);
    removed.dndCharacter = true;
  }
  const dndReg = safeJsonGet(DND_CHARACTERS_REGISTRY_KEY);
  if (dndReg && dndReg[target]) {
    delete dndReg[target];
    safeJsonSet(DND_CHARACTERS_REGISTRY_KEY, dndReg);
  }
  removed.session = dropSessionIfMatches('dnd', target);
  removed.registry = removeFromRegistry('dnd', target);
  return removed;
}

async function deleteFromMc(target) {
  const removed = { mcBuilds: 0, mcReactions: 0, mcLists: false, session: false, registry: false };

  // Builds owned by user
  const builds = safeJsonGet(MC_BUILDS_KEY);
  if (Array.isArray(builds)) {
    const ownedIds = builds
      .filter((b) => normalizeUsername(b?.owner_username) === target)
      .map((b) => b.id);
    if (ownedIds.length) {
      try {
        const mod = await import('../../api/mc-builds.js');
        for (const id of ownedIds) {
          try { await mod.deleteBuild(id); removed.mcBuilds += 1; } catch {}
        }
      } catch (err) {
        console.warn('[users-registry] mc cleanup via API failed, falling back to local', err);
        const remaining = builds.filter((b) => !ownedIds.includes(b.id));
        safeJsonSet(MC_BUILDS_KEY, remaining);
        removed.mcBuilds = ownedIds.length;
      }
    }
  }

  // Reactions left by user across any build
  const reactions = safeJsonGet(MC_REACTIONS_KEY);
  if (reactions && typeof reactions === 'object') {
    let changed = false;
    for (const buildId of Object.keys(reactions)) {
      const node = reactions[buildId];
      if (node && typeof node === 'object' && node[target] !== undefined) {
        delete node[target];
        removed.mcReactions += 1;
        changed = true;
      }
    }
    if (changed) safeJsonSet(MC_REACTIONS_KEY, reactions);
  }

  // Personal playlists
  const listsKey = `${MC_LISTS_PREFIX}${target}`;
  if (localStorage.getItem(listsKey) != null) {
    localStorage.removeItem(listsKey);
    removed.mcLists = true;
  }

  removed.session = dropSessionIfMatches('mc', target);
  removed.registry = removeFromRegistry('mc', target);
  return removed;
}

/**
 * Public delete: scoped to one app by default. Pass `app: 'all'` to
 * cascade across the three apps (used by the cross-app landing
 * admin).
 *
 * Returns `{ ok, reason, removed }` where `removed` is a per-app
 * summary the caller can surface in the confirmation toast.
 */
export async function deleteUser(username, { actor, app = 'avatar' } = {}) {
  const target = normalizeUsername(username);
  if (!target) return { ok: false, reason: 'Username inválido.', removed: null };

  // Cross-app cascade: validate against EVERY app the user appears in
  // and propagate the strictest reason (we don't want to delete from
  // some apps and leave others mid-flight).
  if (app === 'all') {
    for (const id of APP_IDS) {
      const v = validateAppDeleteUser({ appId: id, username, actor });
      // Only block on critical invariants (self-delete, last admin).
      // It's OK if the user simply doesn't exist in one of the apps —
      // we just skip that one.
      if (!v.allowed && v.reason !== 'Username inválido.' && !v.reason.includes('Tem de existir pelo menos 1 admin')) {
        // self-delete check is global → block
        return { ok: false, reason: v.reason, removed: null };
      }
      if (!v.allowed && v.reason.includes('Tem de existir pelo menos 1 admin')) {
        return { ok: false, reason: `${APP_LABELS[id]}: ${v.reason}`, removed: null };
      }
    }
    const removed = {
      avatar: await deleteFromAvatar(target),
      dnd:    await deleteFromDnd(target),
      mc:     await deleteFromMc(target),
    };
    return { ok: true, reason: '', removed };
  }

  // Single-app delete.
  const id = normalizeAppId(app);
  const validation = validateAppDeleteUser({ appId: id, username, actor });
  if (!validation.allowed) return { ok: false, reason: validation.reason, removed: null };

  let removed;
  if (id === 'avatar') removed = { avatar: await deleteFromAvatar(target) };
  else if (id === 'dnd') removed = { dnd: await deleteFromDnd(target) };
  else if (id === 'mc') removed = { mc: await deleteFromMc(target) };
  else return { ok: false, reason: 'App desconhecida.', removed: null };

  return { ok: true, reason: '', removed };
}

// ──────────────────────────────────────────────────────────────────
// Per-app API factory
// ──────────────────────────────────────────────────────────────────

/**
 * Bundle every per-app helper behind a single object so consumers
 * (D&D AdminPage, MC AdminPage) can pass it around. The Avatar
 * AdminPanel keeps using the module-level back-compat exports.
 */
export function createRegistryAPI(appId) {
  const id = normalizeAppId(appId);
  return {
    appId: id,
    label: APP_LABELS[id],
    sessionKey: APP_SESSION_KEYS[id],
    storageKey: APP_REGISTRY_KEYS[id],
    read:        () => readAppRegistry(id),
    write:       (r) => writeAppRegistry(id, r),
    ensureSeed:  () => ensureAppSeed(id),
    list:        (extras) => getAppUsers(id, extras),
    adminCount:  () => getAdminCount(readAppRegistry(id)),
    validateRoleChange: (args) => validateAppRoleChange({ ...args, appId: id }),
    applyRoleChange:    (args) => applyAppRoleChange({ ...args, appId: id }),
    validateDeleteUser: (args) => validateAppDeleteUser({ ...args, appId: id }),
    deleteUser:         (username, opts = {}) => deleteUser(username, { ...opts, app: id }),
  };
}
