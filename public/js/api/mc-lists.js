/**
 * Minecraft Builds — User Lists (estilo playlists do YouTube).
 *
 * Cada utilizador tem 0..N listas, cada lista contém 0..N IDs de builds.
 * Builds podem estar em várias listas em simultâneo.
 *
 * A primeira lista é auto-criada como "Favoritos" no primeiro uso
 * (`ensureDefaultList`) para que clicar no bookmark sem listas prévias
 * "just works".
 *
 * Persistência: **localStorage apenas** (chave `mc_lists_{username}`).
 * A migration `20260629200000_mc_reactions_and_lists.sql` tem o schema
 * Supabase pronto (`mc_lists` + `mc_list_builds`) mas a API ainda não
 * o usa — wirar exige passar os consumers de síncronos para assíncronos.
 * Marcado como follow-up.
 *
 * Forma de uma lista:
 *
 *   {
 *     id: 'list-xxxx',
 *     name: 'Favoritos',
 *     description: '',
 *     build_ids: ['build-id-1', ...],
 *     created_at, updated_at,
 *   }
 */

const DEFAULT_LIST_NAME = 'Favoritos';

function readCurrentUser() {
  try {
    // Sessão isolada por jogo — não usar `avatar_rpg_user` como fallback.
    const raw = localStorage.getItem('mc_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storageKey(username) {
  return `mc_lists_${username || 'default'}`;
}

function readAll(username) {
  if (!username) return [];
  try {
    const raw = localStorage.getItem(storageKey(username));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeAll(username, lists) {
  if (!username) return;
  localStorage.setItem(storageKey(username), JSON.stringify(lists));
}

function genId() {
  return `list-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function nowIso() { return new Date().toISOString(); }

function requireUser() {
  const user = readCurrentUser();
  if (!user?.username) throw new Error('Precisas de iniciar sessão.');
  return user;
}

// ─── Public API ────────────────────────────────────────────────────

export function listLists(username = readCurrentUser()?.username) {
  if (!username) return [];
  return readAll(username);
}

export function ensureDefaultList(username = readCurrentUser()?.username) {
  if (!username) return null;
  const lists = readAll(username);
  if (lists.length) return lists[0];
  const created = {
    id: genId(),
    name: DEFAULT_LIST_NAME,
    description: 'Lista por defeito.',
    build_ids: [],
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  writeAll(username, [created]);
  return created;
}

export function createList(name, description = '') {
  const user = requireUser();
  const lists = readAll(user.username);
  const cleanName = String(name || '').trim() || `Nova lista ${lists.length + 1}`;
  const list = {
    id: genId(),
    name: cleanName,
    description: String(description || ''),
    build_ids: [],
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  lists.push(list);
  writeAll(user.username, lists);
  return list;
}

export function renameList(listId, name) {
  const user = requireUser();
  const lists = readAll(user.username);
  const list = lists.find((l) => l.id === listId);
  if (!list) throw new Error('Lista não encontrada');
  list.name = String(name || '').trim() || list.name;
  list.updated_at = nowIso();
  writeAll(user.username, lists);
  return list;
}

export function deleteList(listId) {
  const user = requireUser();
  const lists = readAll(user.username);
  const next = lists.filter((l) => l.id !== listId);
  writeAll(user.username, next);
}

export function addBuildToList(listId, buildId) {
  const user = requireUser();
  const lists = readAll(user.username);
  const list = lists.find((l) => l.id === listId);
  if (!list) throw new Error('Lista não encontrada');
  if (!list.build_ids.includes(buildId)) {
    list.build_ids.push(buildId);
    list.updated_at = nowIso();
    writeAll(user.username, lists);
  }
  return list;
}

export function removeBuildFromList(listId, buildId) {
  const user = requireUser();
  const lists = readAll(user.username);
  const list = lists.find((l) => l.id === listId);
  if (!list) return;
  const idx = list.build_ids.indexOf(buildId);
  if (idx >= 0) {
    list.build_ids.splice(idx, 1);
    list.updated_at = nowIso();
    writeAll(user.username, lists);
  }
}

/**
 * Devolve array com os IDs das listas que contêm este build (do
 * utilizador em sessão). Útil para pré-marcar checkboxes no popover.
 */
export function listsContainingBuild(buildId, username = readCurrentUser()?.username) {
  if (!username) return [];
  return readAll(username).filter((l) => l.build_ids.includes(buildId)).map((l) => l.id);
}

/** True se o build estiver em pelo menos uma lista (=" bookmarked"). */
export function isBookmarked(buildId, username = readCurrentUser()?.username) {
  return listsContainingBuild(buildId, username).length > 0;
}

/**
 * Aplica em bulk: para um build, sincroniza as listas onde ele aparece
 * com `selectedListIds`. Listas que não estão em `selectedListIds`
 * deixam de o conter; as que estão e ainda não o tinham passam a conter.
 */
export function setListsForBuild(buildId, selectedListIds) {
  const user = requireUser();
  const lists = readAll(user.username);
  const set = new Set(selectedListIds);
  lists.forEach((l) => {
    const has = l.build_ids.includes(buildId);
    if (set.has(l.id) && !has) {
      l.build_ids.push(buildId);
      l.updated_at = nowIso();
    } else if (!set.has(l.id) && has) {
      l.build_ids = l.build_ids.filter((id) => id !== buildId);
      l.updated_at = nowIso();
    }
  });
  writeAll(user.username, lists);
}

/**
 * Hook para limpar referências quando uma build é apagada — chamado
 * pelo CRUD (mc-builds.deleteBuild).
 */
export function purgeBuildAcrossAllLists(buildId) {
  // Cleanup nas listas do utilizador atual (não temos acesso global no
  // modo localStorage; admins que apaguem build de outro user terão de
  // viver com referências orfãs nas listas alheias, mas o GalleryPage
  // já lida com IDs inexistentes ao desenhar).
  const user = readCurrentUser();
  if (!user?.username) return;
  const lists = readAll(user.username);
  let changed = false;
  lists.forEach((l) => {
    const before = l.build_ids.length;
    l.build_ids = l.build_ids.filter((id) => id !== buildId);
    if (l.build_ids.length !== before) {
      l.updated_at = nowIso();
      changed = true;
    }
  });
  if (changed) writeAll(user.username, lists);
}
