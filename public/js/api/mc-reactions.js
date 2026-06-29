/**
 * Minecraft Builds — Reactions (like / dislike) API.
 *
 * Cada build aceita 1 reação por utilizador (mutuamente exclusiva
 * like/dislike). Toggle: clicar "like" quando já está liked → remove;
 * clicar "dislike" quando está liked → muda para dislike.
 *
 * Persistência: **localStorage apenas** (chave `mc_reactions`). A
 * migration `20260629200000_mc_reactions_and_lists.sql` tem o schema
 * Supabase pronto (tabela `mc_build_reactions`) mas a API ainda não
 * o usa — wirar exige passar os consumers (`components/reactions-
 * bookmarks.js`) de síncronos para assíncronos. Marcado como follow-up.
 *
 * Formato local:
 *
 *   { [buildId]: { [username]: 'like' | 'dislike' } }
 */

const STORAGE_KEY = 'mc_reactions';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function readCurrentUser() {
  try {
    // Sessão isolada por jogo — não usar `avatar_rpg_user` como fallback.
    const raw = localStorage.getItem('mc_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * Devolve os totais e a reação do utilizador atual para um build.
 *   { likes: number, dislikes: number, mine: 'like'|'dislike'|null }
 */
export function getCounts(buildId) {
  const all = readAll();
  const per = all[buildId] || {};
  const me = readCurrentUser()?.username || null;
  let likes = 0, dislikes = 0;
  Object.values(per).forEach((v) => {
    if (v === 'like') likes++;
    else if (v === 'dislike') dislikes++;
  });
  return {
    likes,
    dislikes,
    mine: me ? (per[me] || null) : null,
  };
}

/**
 * Aplica/toggle de uma reação para o user em sessão.
 *   • Se ainda não reagiu → grava `kind`.
 *   • Se já reagiu com o mesmo `kind` → remove (toggle off).
 *   • Se reagiu com o outro → muda para `kind`.
 * Lança se não houver sessão.
 */
export function react(buildId, kind) {
  if (kind !== 'like' && kind !== 'dislike') throw new Error('kind inválido');
  const user = readCurrentUser();
  if (!user?.username) throw new Error('Precisas de iniciar sessão para reagir.');

  const all = readAll();
  const per = all[buildId] || {};
  const current = per[user.username] || null;
  if (current === kind) {
    delete per[user.username]; // toggle off
  } else {
    per[user.username] = kind;
  }
  if (Object.keys(per).length) all[buildId] = per;
  else delete all[buildId];
  writeAll(all);
  return getCounts(buildId);
}

/**
 * Remove qualquer reação de um build (usado quando o dono apaga a build).
 */
export function clearReactionsForBuild(buildId) {
  const all = readAll();
  if (all[buildId]) {
    delete all[buildId];
    writeAll(all);
  }
}
