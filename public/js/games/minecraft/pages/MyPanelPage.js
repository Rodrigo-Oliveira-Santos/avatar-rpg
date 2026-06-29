/**
 * Minecraft — painel pessoal (auth obrigatória).
 *
 * Lista as builds do utilizador autenticado, com botões para Editar e
 * Apagar cada uma, e um botão "Adicionar Build" no topo.
 *
 * Admins veem todas as builds (com indicação do dono).
 */

import { createElement, on } from '../../../utils/dom.js';
import { listBuilds, deleteBuild, CATEGORIES } from '../../../api/mc-builds.js';
import { driveThumbnailUrl } from '../lib/drive.js';
import { detectPlatform } from '../lib/social.js';
import { toast, confirmDialog } from '../../../utils/toast.js';

export async function renderMyPanelPage(ctx) {
  const wrap = createElement('section', { class: 'mc-panel' });

  const head = createElement('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px' });
  head.appendChild(createElement('h2', {
    textContent: ctx.isAdmin ? 'Painel Pessoal (admin — vê tudo)' : `Painel Pessoal — ${ctx.user.username}`,
  }));
  const addBtn = createElement('button', { class: 'mc-btn primary', textContent: '+ Adicionar Build' });
  on(addBtn, 'click', () => ctx.onAdd?.());
  head.appendChild(addBtn);
  wrap.appendChild(head);

  // Lista
  const builds = ctx.isAdmin
    ? await listBuilds()
    : await listBuilds({ owner: ctx.user.username });

  if (!builds.length) {
    wrap.appendChild(createElement('div', {
      class: 'mc-empty',
      textContent: ctx.isAdmin
        ? 'Ainda não há builds.'
        : 'Ainda não adicionaste nenhuma build. Clica "+ Adicionar Build" para começar.',
    }));
    return wrap;
  }

  const list = createElement('div', { class: 'mc-panel-list' });
  builds.forEach((b) => list.appendChild(renderRow(b, ctx)));
  wrap.appendChild(list);

  return wrap;
}

function renderRow(b, ctx) {
  const row = createElement('div', { class: 'mc-panel-row' });

  const thumb = createElement('div', { class: 'thumb' });
  const url = driveThumbnailUrl(b.thumbnail_drive || b.thumbnail_url, 200);
  if (url) {
    const img = createElement('img', { alt: b.title, src: url });
    img.onerror = () => { thumb.innerHTML = '?'; thumb.style.color = '#777'; thumb.style.display='flex'; thumb.style.alignItems='center'; thumb.style.justifyContent='center'; };
    thumb.appendChild(img);
  } else {
    thumb.style.color = '#777';
    thumb.style.display='flex'; thumb.style.alignItems='center'; thumb.style.justifyContent='center';
    thumb.textContent = '—';
  }
  row.appendChild(thumb);

  const info = createElement('div', { class: 'info' });
  info.appendChild(createElement('div', { class: 'name', textContent: b.title || 'Sem título' }));
  const subParts = [
    CATEGORIES.find((c) => c.id === b.category)?.label || 'Outro',
  ];
  if (b.mc_version) subParts.push(`MC ${b.mc_version}`);
  if (Array.isArray(b.tags) && b.tags.length) {
    subParts.push(b.tags.slice(0, 3).map((t) => `#${t}`).join(' '));
  }
  if (detectPlatform(b.video_url)) subParts.push('▶ vídeo');
  if (detectPlatform(b.social_url)) subParts.push('🔗 social');
  if (ctx.isAdmin && b.owner_username && b.owner_username !== ctx.user.username) {
    subParts.push(`por ${b.owner_username}`);
  }
  info.appendChild(createElement('div', { class: 'sub', textContent: subParts.join(' · ') }));
  row.appendChild(info);

  const actions = createElement('div', { class: 'actions' });
  const editBtn = createElement('button', { class: 'mc-btn', textContent: '✎ Editar' });
  on(editBtn, 'click', () => ctx.onEdit?.(b));
  const delBtn = createElement('button', { class: 'mc-btn danger', textContent: '🗑 Apagar' });
  on(delBtn, 'click', async () => {
    const ok = await confirmDialog(`Apagar a build "${b.title || 'sem título'}"?`);
    if (!ok) return;
    try {
      await deleteBuild(b.id);
      toast('Build apagada', 'success');
      ctx.requestRender?.();
    } catch (err) {
      toast(err?.message || 'Falha ao apagar', 'error');
    }
  });
  actions.appendChild(editBtn);
  actions.appendChild(delBtn);
  row.appendChild(actions);

  return row;
}
