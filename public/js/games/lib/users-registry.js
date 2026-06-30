/**
 * Shared users registry (cross-app role management).
 *
 * O registry vive em `avatar_rpg_users_registry` (chave herdada do
 * Avatar) e é consultado por:
 *  • Avatar AdminPanel (legacy) — usa o seu próprio código mas a mesma
 *    chave.
 *  • Painel admin global da landing page.
 *  • Tab Admin do D&D 5e.
 *  • Tab Admin do Minecraft Builds.
 *  • `lib/shared-auth.js` para inferir o role em D&D/MC.
 *
 * Este módulo:
 *  • Devolve os utilizadores ordenados (admin → gm → player) para UI.
 *  • Aplica as mesmas regras de validação do Avatar AdminPanel
 *    (transições permitidas, limite de admins, não rebaixar a própria
 *    sessão activa).
 *  • Quando uma role muda sincroniza as 3 chaves de sessão
 *    (`avatar_rpg_user`, `dnd_user`, `mc_user`) se o utilizador
 *    afectado for o mesmo username da sessão respectiva.
 */

export const STORAGE_KEY = 'avatar_rpg_users_registry';
export const MAX_ADMINS = 3;

export const ROLE_LABELS = {
  player: 'Jogador',
  gm: 'GM',
  admin: 'Admin',
};

export const ROLE_ORDER = { player: 0, gm: 1, admin: 2 };

const SESSION_KEYS = ['avatar_rpg_user', 'dnd_user', 'mc_user', 'landing_user'];

const DEFAULT_USERS = {
  zuko: 'player',
  katara: 'player',
  toph: 'player',
  aang: 'player',
  sokka: 'player',
  gm: 'gm',
  admin: 'admin',
};

export function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

export function normalizeRole(role) {
  return ROLE_LABELS[role] ? role : 'player';
}

export function readRegistry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function writeRegistry(registry) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
}

function ensureSeed() {
  const reg = readRegistry();
  if (Object.keys(reg).length > 0) return reg;
  const createdAt = new Date().toISOString();
  const seeded = Object.fromEntries(
    Object.entries(DEFAULT_USERS).map(([u, r]) => [u, { role: r, created_at: createdAt }])
  );
  writeRegistry(seeded);
  return seeded;
}

/**
 * Lê todas as sessões activas (sem assumir que existe DOM/window).
 * Em ambientes de teste sem localStorage devolve [].
 */
export function getActiveSessions() {
  const out = [];
  if (typeof localStorage === 'undefined') return out;
  for (const key of SESSION_KEYS) {
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

/**
 * Devolve true se alguma das sessões activas tem role admin.
 * Usado pela landing para decidir se mostra o botão de admin global.
 */
export function hasAnyAdminSession() {
  return getActiveSessions().some((s) => s.role === 'admin');
}

/**
 * Devolve a primeira sessão admin encontrada (para identificar quem
 * está a operar). Preferimos Avatar > D&D > MC pela ordem natural.
 */
export function getCurrentAdmin() {
  return getActiveSessions().find((s) => s.role === 'admin') || null;
}

/**
 * Constrói a lista de utilizadores conhecidos, garantindo seed e
 * incorporando sessões activas que ainda não estejam registadas.
 * `extras` é uma lista de usernames adicionais a garantir (ex: donos
 * de fichas / builds que possam não estar no registry ainda).
 */
export function getUsers(extras = []) {
  const reg = { ...ensureSeed() };
  const sessions = getActiveSessions();
  let dirty = false;

  const knownExtras = new Set([
    ...sessions.map((s) => s.username),
    ...extras.map(normalizeUsername).filter(Boolean),
  ]);

  for (const username of knownExtras) {
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

  if (dirty) writeRegistry(reg);

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

export function getAdminCount(registry = readRegistry()) {
  return Object.values(registry).filter((e) => normalizeRole(e?.role) === 'admin').length;
}

/**
 * Valida uma transição de role com as mesmas regras do Avatar
 * AdminPanel.
 *
 *   • Player só sobe para GM.
 *   • GM pode descer a Player ou subir a Admin.
 *   • Admin só desce a GM.
 *   • Máximo de MAX_ADMINS admins.
 *   • Tem de existir sempre pelo menos 1 admin.
 *   • Quem está a executar a acção (`actor.username`) não pode
 *     rebaixar a sua própria conta.
 */
export function validateRoleChange({ username, fromRole, toRole, actor }) {
  const reg = readRegistry();
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
    return { allowed: false, reason: `Já existem ${MAX_ADMINS} contas admin.` };
  }
  if (fromRole === 'admin' && toRole === 'gm' && adminCount <= 1) {
    return { allowed: false, reason: 'Tem de existir pelo menos 1 admin.' };
  }

  return { allowed: true, reason: '' };
}

/**
 * Sincroniza as 3 chaves de sessão se o username afectado for o que
 * está activo nessa app (caso contrário não toca em nada).
 */
function syncSessions(username, nextRole) {
  if (typeof localStorage === 'undefined') return;
  for (const key of SESSION_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (normalizeUsername(parsed?.username) !== username) continue;
      parsed.role = nextRole;
      localStorage.setItem(key, JSON.stringify(parsed));
    } catch {}
  }
}

/**
 * Aplica a mudança (sem confirmação UI — quem chamar é responsável
 * por pedir confirmação ao utilizador). Devolve `{ ok, reason }`.
 *
 * `actor` é a sessão que está a executar (usado para a regra de
 * "não rebaixar a si próprio").
 */
export function applyRoleChange({ username, fromRole, toRole, actor }) {
  const validation = validateRoleChange({ username, fromRole, toRole, actor });
  if (!validation.allowed) return { ok: false, reason: validation.reason };

  const reg = readRegistry();
  const target = normalizeUsername(username);
  const existing = reg[target] || {};
  reg[target] = {
    ...existing,
    role: toRole,
    created_at: existing.created_at || new Date().toISOString(),
  };
  writeRegistry(reg);
  syncSessions(target, toRole);
  return { ok: true, reason: '' };
}

/**
 * Pequena helper para UIs (gera lista de acções permitidas a um user
 * com base no seu role actual, replicando o Avatar AdminPanel).
 */
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
// Apagar conta (cascata)
// ──────────────────────────────────────────────────────────────────

const AVATAR_CHARACTER_PREFIX = 'avatar_rpg_character_';
const DND_CHARACTER_PREFIX = 'dnd_character_';
const DND_REGISTRY_KEY = 'dnd_characters_registry';
const MC_BUILDS_KEY = 'mc_builds';
const MC_REACTIONS_KEY = 'mc_reactions';
const MC_LISTS_PREFIX = 'mc_lists_';

function safeJsonGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function safeJsonSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/**
 * Valida se podemos apagar a conta `username`. As mesmas regras
 * conceptuais que a mudança de role: não apagar a si próprio, não
 * apagar o último admin.
 */
export function validateDeleteUser({ username, actor }) {
  const reg = readRegistry();
  const target = normalizeUsername(username);
  const actorName = normalizeUsername(actor?.username);

  if (!target) return { allowed: false, reason: 'Username inválido.' };
  if (target === actorName) {
    return { allowed: false, reason: 'Não podes apagar a tua própria conta.' };
  }

  const entry = reg[target];
  const targetRole = normalizeRole(entry?.role);
  if (targetRole === 'admin' && getAdminCount(reg) <= 1) {
    return { allowed: false, reason: 'Tem de existir pelo menos 1 admin.' };
  }

  return { allowed: true, reason: '' };
}

/**
 * Apaga uma conta de utilizador e todos os dados associados em
 * localStorage (ficha Avatar, ficha D&D, builds Minecraft, reações,
 * listas), limpa sessões activas e remove a entrada do registry.
 *
 * Devolve `{ ok, reason, removed }` onde `removed` é um objecto com
 * contagens para feedback ao admin.
 *
 * Esta é uma operação **destrutiva e irreversível** — quem chama é
 * responsável por pedir confirmação ao utilizador antes.
 *
 * Nota: as APIs específicas (`api/dnd-characters.deleteCharacter`,
 * `api/mc-builds.deleteBuild`) são importadas dinamicamente para
 * evitar dependências circulares e para que possam disparar a remoção
 * no Supabase quando este estiver activo. Em modo local toda a
 * cascata é resolvida aqui directamente em localStorage.
 */
export async function deleteUser(username, { actor } = {}) {
  const validation = validateDeleteUser({ username, actor });
  if (!validation.allowed) return { ok: false, reason: validation.reason, removed: null };

  const target = normalizeUsername(username);
  const removed = {
    registry: false,
    avatarCharacter: false,
    dndCharacter: false,
    mcBuilds: 0,
    mcReactions: 0,
    mcLists: false,
    sessions: 0,
  };

  // 1) Registry
  const reg = readRegistry();
  if (reg[target]) {
    delete reg[target];
    writeRegistry(reg);
    removed.registry = true;
  }

  // 2) Ficha Avatar
  const avatarKey = `${AVATAR_CHARACTER_PREFIX}${target}`;
  if (localStorage.getItem(avatarKey) != null) {
    localStorage.removeItem(avatarKey);
    removed.avatarCharacter = true;
  }

  // 3) Ficha D&D (chama API dedicada — também trata de Supabase e do
  //    registry secundário `dnd_characters_registry`)
  try {
    const mod = await import('../../api/dnd-characters.js');
    const r = await mod.deleteCharacter(target);
    if (r) removed.dndCharacter = true;
  } catch (err) {
    console.warn('[users-registry.deleteUser] dnd cleanup failed', err);
    // Fallback puro local
    const dndKey = `${DND_CHARACTER_PREFIX}${target}`;
    if (localStorage.getItem(dndKey) != null) {
      localStorage.removeItem(dndKey);
      removed.dndCharacter = true;
    }
    const dndReg = safeJsonGet(DND_REGISTRY_KEY);
    if (dndReg && dndReg[target]) {
      delete dndReg[target];
      safeJsonSet(DND_REGISTRY_KEY, dndReg);
    }
  }

  // 4) Builds Minecraft (todas onde owner == username)
  const builds = safeJsonGet(MC_BUILDS_KEY);
  if (Array.isArray(builds)) {
    const ownedIds = builds
      .filter((b) => normalizeUsername(b?.owner_username) === target)
      .map((b) => b.id);
    if (ownedIds.length) {
      try {
        const mod = await import('../../api/mc-builds.js');
        for (const id of ownedIds) {
          try {
            await mod.deleteBuild(id);
            removed.mcBuilds += 1;
          } catch {
            // continua mesmo se uma falhar
          }
        }
      } catch (err) {
        console.warn('[users-registry.deleteUser] mc cleanup failed', err);
        // Fallback: limpa só localmente
        const remaining = builds.filter((b) => !ownedIds.includes(b.id));
        safeJsonSet(MC_BUILDS_KEY, remaining);
        removed.mcBuilds = ownedIds.length;
      }
    }
  }

  // 5) Reactions Minecraft — remove a entrada do user em todos os builds
  const reactions = safeJsonGet(MC_REACTIONS_KEY);
  if (reactions && typeof reactions === 'object') {
    let changed = false;
    for (const buildId of Object.keys(reactions)) {
      const per = reactions[buildId];
      if (per && typeof per === 'object' && per[target] != null) {
        delete per[target];
        removed.mcReactions += 1;
        changed = true;
        // Se ficou vazio, remove a entrada do build
        if (Object.keys(per).length === 0) delete reactions[buildId];
      }
    }
    if (changed) safeJsonSet(MC_REACTIONS_KEY, reactions);
  }

  // 6) Listas Minecraft do user
  const listsKey = `${MC_LISTS_PREFIX}${target}`;
  if (localStorage.getItem(listsKey) != null) {
    localStorage.removeItem(listsKey);
    removed.mcLists = true;
  }

  // 7) Sessões activas: para cada SESSION_KEY, remover se username bater
  for (const key of SESSION_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (normalizeUsername(parsed?.username) === target) {
        localStorage.removeItem(key);
        removed.sessions += 1;
      }
    } catch {}
  }

  // 8) Token Avatar (não-crítico)
  try {
    const sess = safeJsonGet('avatar_rpg_user');
    if (!sess || normalizeUsername(sess.username) !== target) {
      // se a sessão Avatar não é deste user, não toca no token
    } else {
      localStorage.removeItem('avatar_rpg_token');
    }
  } catch {}

  return { ok: true, reason: '', removed };
}
