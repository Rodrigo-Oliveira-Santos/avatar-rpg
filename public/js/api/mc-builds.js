/**
 * Minecraft Builds API
 *
 * Mesmo padrão de fallback dos restantes APIs: usa Supabase quando
 * `useSupabase` está ligado; caso contrário guarda tudo em localStorage
 * sob a chave `mc_builds` (lista global porque a galeria é pública).
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';

const STORAGE_KEY = 'mc_builds';

export const CATEGORIES = [
  { id: 'survival',  label: 'Survival' },
  { id: 'redstone',  label: 'Redstone' },
  { id: 'farm',      label: 'Farms' },
  { id: 'aesthetic', label: 'Estético' },
  { id: 'adventure', label: 'Aventura' },
  { id: 'other',     label: 'Outro' },
];

function readCurrentUser() {
  try {
    // Minecraft usa exclusivamente a sua chave de sessão (não fazer
    // fallback para `avatar_rpg_user` — quebraria o isolamento entre
    // jogos: um user logado em Avatar passaria a "criar" builds em
    // nome dele aqui).
    const raw = localStorage.getItem('mc_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function readAllLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeAllLocal(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function genId() {
  return `mc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() { return new Date().toISOString(); }

function sanitizeTags(input) {
  if (!input) return [];
  let arr;
  if (Array.isArray(input)) arr = input;
  else if (typeof input === 'string') arr = input.split(',');
  else return [];
  return [...new Set(
    arr
      .map((t) => String(t).trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20)
  )];
}

export async function listBuilds(filter = {}) {
  let builds = [];
  // True quando os dados vêm do localStorage (modo local ou fallback
  // de Supabase). Determina se aplicamos os filtros do lado do cliente
  // — em modo Supabase puro os filtros vão na query e não os
  // duplicamos aqui.
  let usedLocalData = !isSupabaseEnabled();

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      let q = client.from('mc_builds')
        .select('*, users:users!mc_builds_owner_id_fkey(username, role)')
        .order('created_at', { ascending: false });
      if (filter.category === 'other') {
        // "Outro" engloba builds sem categoria definida (null/empty)
        q = q.or('category.eq.other,category.is.null');
      } else if (filter.category) {
        q = q.eq('category', filter.category);
      }
      const { data, error } = await q;
      if (error) throw error;
      builds = (data || []).map((row) => ({
        ...row,
        owner_username: row.users?.username || null,
      }));
    } catch (err) {
      console.warn('[mc-builds.listBuilds] Supabase failed, using local', err);
      builds = readAllLocal();
      usedLocalData = true;
    }
  } else {
    builds = readAllLocal();
  }

  // Filtros client-side adicionais
  if (filter.q) {
    const needle = filter.q.toLowerCase();
    builds = builds.filter((b) =>
      (b.title || '').toLowerCase().includes(needle)
      || (b.description || '').toLowerCase().includes(needle)
      || (Array.isArray(b.tags) && b.tags.some((t) => String(t).toLowerCase().includes(needle)))
    );
  }
  if (filter.owner) {
    builds = builds.filter((b) => b.owner_username === filter.owner);
  }
  if (filter.category && usedLocalData) {
    if (filter.category === 'other') {
      // "Outro" engloba builds sem categoria definida
      builds = builds.filter((b) => !b.category || b.category === 'other');
    } else {
      builds = builds.filter((b) => b.category === filter.category);
    }
  }
  if (filter.tag) {
    const t = String(filter.tag).toLowerCase();
    builds = builds.filter((b) => Array.isArray(b.tags) && b.tags.includes(t));
  }

  return builds;
}

export async function createBuild(data) {
  const user = readCurrentUser();
  if (!user?.username) throw new Error('Precisas de iniciar sessão para adicionar uma build.');

  const build = {
    id: genId(),
    owner_id: user.id || `user-${user.username}`,
    owner_username: user.username,
    title: data.title || 'Sem título',
    description: data.description || '',
    category: data.category || 'other',
    tags: sanitizeTags(data.tags),
    thumbnail_drive: data.thumbnail_drive || '',
    download_drive: data.download_drive || '',
    video_url: data.video_url || '',
    social_url: data.social_url || '',
    mc_version: data.mc_version || '',
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data: u } = await client.from('users').select('id').eq('username', user.username).maybeSingle();
      if (u?.id) {
        const { data: row, error } = await client.from('mc_builds').insert({
          owner_id: u.id,
          title: build.title,
          description: build.description,
          category: build.category,
          tags: build.tags,
          thumbnail_url: build.thumbnail_drive,
          download_url: build.download_drive,
          video_url: build.video_url,
          social_url: build.social_url,
          mc_version: build.mc_version,
        }).select('*').single();
        if (error) throw error;
        return { ...build, id: row.id };
      }
    } catch (err) {
      console.warn('[mc-builds.createBuild] Supabase failed, kept local', err);
    }
  }

  const all = readAllLocal();
  all.unshift(build);
  writeAllLocal(all);
  return build;
}

export async function updateBuild(id, data) {
  const user = readCurrentUser();
  if (!user?.username) throw new Error('Precisas de iniciar sessão.');

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const patch = {
        title: data.title,
        description: data.description,
        category: data.category,
        tags: sanitizeTags(data.tags),
        thumbnail_url: data.thumbnail_drive,
        download_url: data.download_drive,
        video_url: data.video_url,
        social_url: data.social_url,
        mc_version: data.mc_version,
        updated_at: nowIso(),
      };
      const { data: row, error } = await client.from('mc_builds').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return row;
    } catch (err) {
      console.warn('[mc-builds.updateBuild] Supabase failed, kept local', err);
    }
  }

  const all = readAllLocal();
  const idx = all.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error('Build não encontrada.');
  const isOwner = all[idx].owner_username === user.username;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) throw new Error('Sem permissão para editar esta build.');
  all[idx] = {
    ...all[idx],
    ...data,
    tags: sanitizeTags(data.tags),
    updated_at: nowIso(),
  };
  writeAllLocal(all);
  return all[idx];
}

export async function deleteBuild(id) {
  const user = readCurrentUser();
  if (!user?.username) throw new Error('Precisas de iniciar sessão.');

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { error } = await client.from('mc_builds').delete().eq('id', id);
      if (error) throw error;
      // Em Supabase, ON DELETE CASCADE limpa reactions e list-builds.
      return true;
    } catch (err) {
      console.warn('[mc-builds.deleteBuild] Supabase failed, kept local', err);
    }
  }

  const all = readAllLocal();
  const target = all.find((b) => b.id === id);
  if (!target) return false;
  const isOwner = target.owner_username === user.username;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) throw new Error('Sem permissão para apagar esta build.');
  writeAllLocal(all.filter((b) => b.id !== id));

  // Cleanup local: remove reações desta build e tira-a das listas do
  // utilizador atual. (Listas de outros users em modo local não são
  // acessíveis; o GalleryPage tolera referências orfãs.)
  try {
    const { clearReactionsForBuild } = await import('./mc-reactions.js');
    clearReactionsForBuild(id);
  } catch {}
  try {
    const { purgeBuildAcrossAllLists } = await import('./mc-lists.js');
    purgeBuildAcrossAllLists(id);
  } catch {}

  return true;
}

/**
 * Transfere a build para outro utilizador (apenas admin pode chamar
 * — a permissão é validada aqui mesmo). Actualiza `owner_username` e
 * `owner_id` em localStorage; em modo Supabase faz lookup do `id` do
 * novo dono na tabela `users` e actualiza a row de `mc_builds`.
 *
 * Devolve `{ ok, reason }`.
 */
export async function transferBuild(buildId, toUsername) {
  const actor = readCurrentUser();
  if (!actor?.username) return { ok: false, reason: 'Precisas de iniciar sessão.' };
  if (actor.role !== 'admin') return { ok: false, reason: 'Apenas admins podem transferir builds.' };

  const target = String(toUsername || '').trim().toLowerCase();
  if (!target) return { ok: false, reason: 'Username destino inválido.' };

  if (isSupabaseEnabled()) {
    try {
      const client = await getSupabaseClient();
      const { data: u, error: ue } = await client
        .from('users').select('id').eq('username', target).maybeSingle();
      if (ue) throw ue;
      if (!u?.id) return { ok: false, reason: `Utilizador "${target}" não existe.` };

      const { error } = await client.from('mc_builds')
        .update({ owner_id: u.id, updated_at: nowIso() })
        .eq('id', buildId);
      if (error) throw error;
      return { ok: true, reason: '' };
    } catch (err) {
      console.warn('[mc-builds.transferBuild] Supabase failed, falling back to local', err);
    }
  }

  const all = readAllLocal();
  const idx = all.findIndex((b) => b.id === buildId);
  if (idx < 0) return { ok: false, reason: 'Build não encontrada.' };
  if (all[idx].owner_username === target) {
    return { ok: false, reason: `Esta build já pertence a "${target}".` };
  }

  all[idx] = {
    ...all[idx],
    owner_username: target,
    owner_id: `user-${target}`,
    updated_at: nowIso(),
  };
  writeAllLocal(all);
  return { ok: true, reason: '' };
}

/**
 * Transfere TODAS as builds de `fromUsername` para `toUsername`.
 * Usa `transferBuild` por build para reutilizar a validação.
 * Devolve `{ ok, transferred, failed }`.
 */
export async function transferAllBuildsFromUser(fromUsername, toUsername) {
  const from = String(fromUsername || '').trim().toLowerCase();
  const to = String(toUsername || '').trim().toLowerCase();
  if (!from || !to) return { ok: false, transferred: 0, failed: 0, reason: 'Usernames inválidos.' };
  if (from === to) return { ok: false, transferred: 0, failed: 0, reason: 'Source e destino são o mesmo user.' };

  const builds = await listBuilds({ owner: from });
  let transferred = 0;
  let failed = 0;
  const errors = [];

  for (const b of builds) {
    const r = await transferBuild(b.id, to);
    if (r.ok) transferred += 1;
    else { failed += 1; errors.push(`${b.id}: ${r.reason}`); }
  }

  return {
    ok: failed === 0,
    transferred,
    failed,
    reason: failed ? `Algumas builds falharam: ${errors[0]}` : '',
  };
}
