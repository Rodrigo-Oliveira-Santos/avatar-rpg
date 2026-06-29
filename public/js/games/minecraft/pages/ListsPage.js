/**
 * Minecraft — Página "Minhas Listas" (auth obrigatória).
 *
 * Layout 2 colunas:
 *   • Esquerda: sidebar de listas (criar, renomear, apagar, selecionar)
 *   • Direita:  grelha das builds que estão na lista selecionada (com
 *               botão para remover da lista; clique abre o detalhe)
 *
 * As alterações ficam guardadas via `api/mc-lists.js`. A página é
 * stateful (mantém `selectedListId` em closure).
 */

import { createElement, on } from '../../../utils/dom.js';
import { toast, confirmDialog, promptDialog } from '../../../utils/toast.js';
import {
  listLists, createList, renameList, deleteList, removeBuildFromList,
  ensureDefaultList,
} from '../../../api/mc-lists.js';
import { listBuilds } from '../../../api/mc-builds.js';
import { driveThumbnailUrl, driveDownloadUrl } from '../lib/drive.js';
import { detectPlatform } from '../lib/social.js';
import { renderReactions, renderBookmark } from '../components/reactions-bookmarks.js';

const STATE = {
  selectedListId: null,
};

export async function renderListsPage(ctx) {
  ensureDefaultList(); // garante pelo menos a lista "Favoritos"
  const wrap = createElement('section', { class: 'mc-panel' });

  const head = createElement('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px' });
  head.appendChild(createElement('h2', { textContent: `Minhas Listas — ${ctx.user.username}` }));
  const addBtn = createElement('button', { class: 'mc-btn primary', textContent: '+ Nova lista' });
  on(addBtn, 'click', async () => {
    const name = await promptDialog('Nome da nova lista:', { defaultValue: '' });
    if (name == null) return;
    const trimmed = String(name).trim();
    if (!trimmed) return;
    try {
      const l = createList(trimmed);
      STATE.selectedListId = l.id;
      ctx.requestRender?.();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
  head.appendChild(addBtn);
  wrap.appendChild(head);

  const lists = listLists();
  if (!lists.length) {
    wrap.appendChild(createElement('div', {
      class: 'mc-empty',
      textContent: 'Sem listas. Cria a primeira acima ou clica em "Guardar" numa build na galeria.',
    }));
    return wrap;
  }

  // Selecionar default
  if (!STATE.selectedListId || !lists.find((l) => l.id === STATE.selectedListId)) {
    STATE.selectedListId = lists[0].id;
  }

  const layout = createElement('div', { class: 'mc-lists-layout' });

  // Sidebar
  const sidebar = createElement('aside', { class: 'mc-lists-sidebar' });
  lists.forEach((l) => sidebar.appendChild(renderSidebarRow(l, ctx)));
  layout.appendChild(sidebar);

  // Builds grid (right)
  const detail = createElement('section', { class: 'mc-lists-detail' });
  const selected = lists.find((l) => l.id === STATE.selectedListId);
  detail.appendChild(await renderListContent(selected, ctx));
  layout.appendChild(detail);

  wrap.appendChild(layout);
  return wrap;
}

function renderSidebarRow(list, ctx) {
  const row = createElement('div', {
    class: 'mc-lists-sidebar-row' + (list.id === STATE.selectedListId ? ' on' : ''),
  });

  const main = createElement('button', {
    type: 'button',
    class: 'mc-lists-sidebar-main',
  });
  main.appendChild(createElement('div', { class: 'name', textContent: list.name }));
  main.appendChild(createElement('div', { class: 'count', textContent: `${list.build_ids.length} build${list.build_ids.length === 1 ? '' : 's'}` }));
  on(main, 'click', () => {
    STATE.selectedListId = list.id;
    ctx.requestRender?.();
  });
  row.appendChild(main);

  // Actions: rename + delete
  const actions = createElement('div', { class: 'mc-lists-sidebar-actions' });
  const rename = createElement('button', { type: 'button', class: 'mc-btn', textContent: '✎', title: 'Renomear' });
  on(rename, 'click', async (e) => {
    e.stopPropagation();
    const next = await promptDialog('Novo nome:', { defaultValue: list.name });
    if (next == null) return;
    const trimmed = String(next).trim();
    if (!trimmed) return;
    try {
      renameList(list.id, trimmed);
      ctx.requestRender?.();
    } catch (err) { toast(err.message, 'error'); }
  });
  const del = createElement('button', { type: 'button', class: 'mc-btn danger', textContent: '🗑', title: 'Apagar lista' });
  on(del, 'click', async (e) => {
    e.stopPropagation();
    const ok = await confirmDialog(`Apagar a lista "${list.name}"? (As builds em si não são apagadas.)`);
    if (!ok) return;
    try {
      deleteList(list.id);
      if (STATE.selectedListId === list.id) STATE.selectedListId = null;
      ctx.requestRender?.();
    } catch (err) { toast(err.message, 'error'); }
  });
  actions.appendChild(rename);
  actions.appendChild(del);
  row.appendChild(actions);

  return row;
}

async function renderListContent(list, ctx) {
  const wrap = createElement('div');
  if (!list) {
    wrap.appendChild(createElement('div', { class: 'mc-empty', textContent: 'Seleciona uma lista.' }));
    return wrap;
  }

  // Header da lista selecionada
  const head = createElement('div', { class: 'mc-lists-content-head' });
  head.appendChild(createElement('h3', { textContent: list.name }));
  head.appendChild(createElement('span', {
    style: 'font-size:11px;color:var(--text2,#aaa)',
    textContent: `${list.build_ids.length} build(s)`,
  }));
  wrap.appendChild(head);

  if (!list.build_ids.length) {
    wrap.appendChild(createElement('div', {
      class: 'mc-empty',
      textContent: 'Lista vazia. Vai à Galeria e clica em "Guardar" para juntar builds aqui.',
    }));
    return wrap;
  }

  // Carregar todas as builds e filtrar pelas da lista (mantém a ordem da lista)
  const allBuilds = await listBuilds();
  const indexById = new Map(allBuilds.map((b) => [b.id, b]));
  const buildsInOrder = list.build_ids
    .map((id) => indexById.get(id))
    .filter(Boolean);

  // Builds em falta (apagadas pelo dono entretanto)
  const missing = list.build_ids.length - buildsInOrder.length;
  if (missing > 0) {
    wrap.appendChild(createElement('div', {
      style: 'font-size:11px;color:var(--text3,#777);margin-bottom:6px',
      textContent: `(${missing} referência(s) já não existem)`,
    }));
  }

  const grid = createElement('div', { class: 'mc-grid' });
  buildsInOrder.forEach((b) => grid.appendChild(renderListTile(b, list, ctx)));
  wrap.appendChild(grid);

  return wrap;
}

function renderListTile(b, list, ctx) {
  const tile = createElement('article', { class: 'mc-tile' });

  // Thumb
  const thumbWrap = createElement('div', { class: 'mc-tile-thumb' });
  const thumbUrl = driveThumbnailUrl(b.thumbnail_drive || b.thumbnail_url, 600);
  if (thumbUrl) {
    const img = createElement('img', { alt: b.title || 'build', loading: 'lazy', src: thumbUrl });
    img.onerror = () => { thumbWrap.classList.add('missing'); thumbWrap.innerHTML = 'Sem imagem'; };
    thumbWrap.appendChild(img);
  } else {
    thumbWrap.classList.add('missing');
    thumbWrap.textContent = 'Sem imagem';
  }
  tile.appendChild(thumbWrap);

  // Body
  const body = createElement('div', { class: 'mc-tile-body' });
  body.appendChild(createElement('div', { class: 'mc-tile-title', textContent: b.title || 'Sem título' }));
  const meta = createElement('div', { class: 'mc-tile-meta' });
  meta.appendChild(createElement('span', { textContent: b.owner_username || '—' }));
  body.appendChild(meta);
  tile.appendChild(body);

  // Footer actions: download + remove from list
  const footer = createElement('div', { class: 'mc-lists-tile-footer' });

  const dlUrl = driveDownloadUrl(b.download_drive || b.download_url);
  if (dlUrl) {
    const dl = createElement('a', {
      class: 'mc-btn primary', textContent: '⬇', title: 'Download',
      target: '_blank', rel: 'noopener noreferrer',
    });
    dl.href = dlUrl;
    on(dl, 'click', (e) => e.stopPropagation());
    footer.appendChild(dl);
  }

  // Optional social icons (compact)
  const video = detectPlatform(b.video_url);
  const social = detectPlatform(b.social_url);
  [video, social].filter(Boolean).forEach((det) => {
    const a = createElement('a', {
      class: `mc-social-icon mc-social-${det.platform}`,
      title: det.label,
      target: '_blank', rel: 'noopener noreferrer',
      textContent: det.icon,
      style: 'width:24px;height:24px;font-size:11px',
    });
    a.href = det.url;
    on(a, 'click', (e) => e.stopPropagation());
    footer.appendChild(a);
  });

  const remove = createElement('button', { type: 'button', class: 'mc-btn danger', textContent: '✕ Remover', title: 'Remover da lista' });
  on(remove, 'click', (e) => {
    e.stopPropagation();
    try {
      removeBuildFromList(list.id, b.id);
      toast('Removido da lista', 'info');
      ctx.requestRender?.();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
  footer.appendChild(remove);

  tile.appendChild(footer);
  return tile;
}
