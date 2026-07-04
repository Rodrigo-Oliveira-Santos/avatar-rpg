/**
 * Minecraft — galeria pública.
 *
 * Funcionalidades:
 *  • Barra de pesquisa por título/descrição.
 *  • Filtro por categoria.
 *  • Dois modos de vista: grelha ("ícones grandes") e linha (thumb |
 *    texto | botão download).
 *  • Painel lateral de detalhe ao clicar numa build (visível apenas em
 *    grelha — em vista de linha o detalhe sai a passar para grelha).
 */

import { createElement, on } from '../../../utils/dom.js';
import { listBuilds, CATEGORIES } from '../../../api/mc-builds.js';
import { driveThumbnailUrl, driveDownloadUrl } from '../lib/drive.js';
import { detectPlatform } from '../lib/social.js';
import { getCounts } from '../../../api/mc-reactions.js';
import { renderReactions, renderBookmark } from '../components/reactions-bookmarks.js';

const STATE = {
  view: 'grid', // 'grid' | 'rows'
  q: '',
  category: '',
  tag: '',
  sort: 'recent', // 'recent' | 'likes' | 'dislikes'
  selectedId: null,
};

export async function renderGalleryPage(ctx) {
  const wrap = createElement('div');

  wrap.appendChild(renderToolbar(ctx, () => renderGalleryPage(ctx).then((newEl) => {
    wrap.replaceWith(newEl);
  })));

  const builds = await listBuilds({ q: STATE.q, category: STATE.category, tag: STATE.tag });

  // Ordenação (default = recente, que já é a ordem devolvida pela API)
  if (STATE.sort === 'oldest') {
    builds.reverse();
  } else if (STATE.sort === 'likes' || STATE.sort === 'dislikes') {
    const key = STATE.sort === 'likes' ? 'likes' : 'dislikes';
    builds.sort((a, b) => (getCounts(b.id)[key] || 0) - (getCounts(a.id)[key] || 0));
  }

  // Coletar tags únicas (de todas as builds, não só filtradas) para o filtro
  const allBuildsForTags = await listBuilds({});
  const allTags = [...new Set(
    allBuildsForTags.flatMap((b) => Array.isArray(b.tags) ? b.tags : [])
  )].sort();

  if (allTags.length) {
    wrap.appendChild(renderTagChips(allTags, () => renderGalleryPage(ctx).then((newEl) => {
      wrap.replaceWith(newEl);
    })));
  }

  if (!builds.length) {
    wrap.appendChild(createElement('div', {
      class: 'mc-empty',
      textContent: 'Ainda não há builds. Inicia sessão no painel pessoal e adiciona a primeira!',
    }));
    return wrap;
  }

  if (STATE.view === 'grid') {
    wrap.appendChild(renderGridWithDetail(builds, ctx, async () => {
      const newEl = await renderGalleryPage(ctx);
      wrap.replaceWith(newEl);
    }));
  } else {
    wrap.appendChild(renderRows(builds, ctx));
  }

  return wrap;
}

function renderToolbar(ctx, onChange) {
  const bar = createElement('div', { class: 'mc-toolbar' });

  const search = createElement('input', {
    type: 'text',
    placeholder: 'Procurar título, descrição ou tag…',
    value: STATE.q,
  });
  let debounceT;
  on(search, 'input', () => {
    clearTimeout(debounceT);
    debounceT = setTimeout(() => { STATE.q = search.value; onChange(); }, 250);
  });
  bar.appendChild(search);

  const sel = createElement('select');
  const optAll = createElement('option', { value: '', textContent: 'Todas as categorias' });
  sel.appendChild(optAll);
  CATEGORIES.forEach((c) => {
    const o = createElement('option', { value: c.id, textContent: c.label });
    if (c.id === STATE.category) o.selected = true;
    sel.appendChild(o);
  });
  on(sel, 'change', () => { STATE.category = sel.value; onChange(); });
  bar.appendChild(sel);

  // Ordenação por data / reações (filtro super simples)
  const sortSel = createElement('select');
  [
    ['recent',   '📅 Mais recentes'],
    ['oldest',   '📅 Mais antigos'],
    ['likes',    '👍 Mais likes'],
    ['dislikes', '👎 Mais dislikes'],
  ].forEach(([v, lbl]) => {
    const o = createElement('option', { value: v, textContent: lbl });
    if (v === STATE.sort) o.selected = true;
    sortSel.appendChild(o);
  });
  on(sortSel, 'change', () => { STATE.sort = sortSel.value; onChange(); });
  bar.appendChild(sortSel);

  const toggle = createElement('div', { class: 'mc-view-toggle' });
  const gridBtn = createElement('button', { textContent: '⬛ Grelha' });
  if (STATE.view === 'grid') gridBtn.classList.add('on');
  on(gridBtn, 'click', () => { STATE.view = 'grid'; onChange(); });
  const rowsBtn = createElement('button', { textContent: '☰ Lista' });
  if (STATE.view === 'rows') rowsBtn.classList.add('on');
  on(rowsBtn, 'click', () => { STATE.view = 'rows'; onChange(); });
  toggle.appendChild(gridBtn);
  toggle.appendChild(rowsBtn);
  bar.appendChild(toggle);

  return bar;
}

function renderTagChips(allTags, onChange) {
  const wrap = createElement('div', {
    class: 'mc-tag-bar',
  });

  const clearChip = createElement('button', {
    class: STATE.tag ? 'mc-tag-chip' : 'mc-tag-chip on',
    textContent: 'Todas',
  });
  on(clearChip, 'click', () => { STATE.tag = ''; onChange(); });
  wrap.appendChild(clearChip);

  allTags.forEach((tag) => {
    const chip = createElement('button', {
      class: STATE.tag === tag ? 'mc-tag-chip on' : 'mc-tag-chip',
      textContent: `#${tag}`,
    });
    on(chip, 'click', () => { STATE.tag = STATE.tag === tag ? '' : tag; onChange(); });
    wrap.appendChild(chip);
  });

  return wrap;
}

function renderGridWithDetail(builds, ctx, onChange) {
  // Só mostra painel de detalhe se o utilizador clicou explicitamente
  // numa build (selectedId). Por defeito, a grelha ocupa a largura toda.
  const selected = STATE.selectedId ? builds.find((b) => b.id === STATE.selectedId) : null;
  const layout = createElement('div', {
    class: selected ? 'mc-layout-with-detail' : 'mc-layout-grid-only',
  });

  const grid = createElement('div', { class: 'mc-grid' });
  builds.forEach((b) => grid.appendChild(renderTile(b, () => {
    // Toggle: clicar no já selecionado fecha
    STATE.selectedId = STATE.selectedId === b.id ? null : b.id;
    onChange();
  })));
  layout.appendChild(grid);

  if (selected) {
    layout.appendChild(renderDetail(selected, ctx, onChange, () => {
      STATE.selectedId = null;
      onChange();
    }));
  }

  return layout;
}

function renderTile(b, onClick) {
  const tile = createElement('article', { class: 'mc-tile' });
  if (STATE.selectedId === b.id) tile.classList.add('on');
  on(tile, 'click', onClick);

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

  // Like count chip sobreposto à thumbnail (canto inferior direito)
  const counts = getCounts(b.id);
  if (counts.likes || counts.dislikes) {
    const chip = createElement('div', { class: 'mc-tile-likechip' });
    if (counts.likes) chip.appendChild(createElement('span', { textContent: `👍 ${counts.likes}` }));
    if (counts.dislikes) chip.appendChild(createElement('span', { textContent: `👎 ${counts.dislikes}` }));
    thumbWrap.appendChild(chip);
  }
  tile.appendChild(thumbWrap);

  const body = createElement('div', { class: 'mc-tile-body' });
  body.appendChild(createElement('div', { class: 'mc-tile-title', textContent: b.title || 'Sem título' }));
  const meta = createElement('div', { class: 'mc-tile-meta' });
  meta.appendChild(createElement('span', {
    class: 'mc-tile-category',
    textContent: categoryLabel(b.category),
  }));
  meta.appendChild(createElement('span', { textContent: b.owner_username || '—' }));
  body.appendChild(meta);
  tile.appendChild(body);

  return tile;
}

function renderRows(builds, ctx) {
  const wrap = createElement('div', { class: 'mc-rows' });
  builds.forEach((b) => {
    const row = createElement('article', { class: 'mc-row' });

    const thumb = createElement('div', { class: 'mc-row-thumb' });
    const thumbUrl = driveThumbnailUrl(b.thumbnail_drive || b.thumbnail_url, 300);
    if (thumbUrl) {
      const img = createElement('img', { alt: b.title || 'build', loading: 'lazy', src: thumbUrl });
      img.onerror = () => { thumb.classList.add('missing'); thumb.innerHTML = 'Sem imagem'; };
      thumb.appendChild(img);
    } else {
      thumb.classList.add('missing');
      thumb.textContent = 'Sem imagem';
    }
    row.appendChild(thumb);

    const text = createElement('div', { class: 'mc-row-text' });
    text.appendChild(createElement('div', { class: 'mc-row-title', textContent: b.title || 'Sem título' }));
    text.appendChild(createElement('div', { class: 'mc-row-desc', textContent: b.description || '' }));
    const meta = createElement('div', { class: 'mc-row-meta' });
    meta.appendChild(createElement('span', { class: 'category', textContent: categoryLabel(b.category) }));
    meta.appendChild(createElement('span', { textContent: `por ${b.owner_username || '—'}` }));
    if (b.mc_version) meta.appendChild(createElement('span', { textContent: `MC ${b.mc_version}` }));
    if (Array.isArray(b.tags) && b.tags.length) {
      meta.appendChild(createElement('span', {
        textContent: b.tags.slice(0, 3).map((t) => `#${t}`).join(' '),
      }));
    }
    text.appendChild(meta);
    row.appendChild(text);

    // Reações (like/dislike)
    row.appendChild(renderReactions(b, {
      size: 'md',
      requireLogin: ctx.requireLogin,
      onChange: ctx.onCountsChange,
    }));

    // Bookmark/listas
    row.appendChild(renderBookmark(b, {
      size: 'md',
      requireLogin: ctx.requireLogin,
      onChange: ctx.onCountsChange,
    }));

    // Ícones sociais (entre desc e download)
    const socialIcons = renderSocialIcons(b);
    if (socialIcons) row.appendChild(socialIcons);

    const dlUrl = driveDownloadUrl(b.download_drive || b.download_url);
    const dl = createElement('a', {
      class: 'mc-btn primary',
      textContent: '⬇ Download',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    dl.href = dlUrl || '#';
    if (!dlUrl) {
      dl.style.opacity = '0.4';
      dl.removeAttribute('href');
      dl.title = 'Sem link de download';
    }
    on(dl, 'click', (e) => { e.stopPropagation(); });
    row.appendChild(dl);

    wrap.appendChild(row);
  });
  return wrap;
}

function renderDetail(b, ctx, onChange, onClose) {
  if (!b) {
    return createElement('aside', { class: 'mc-detail empty', textContent: 'Seleciona uma build para ver os detalhes.' });
  }
  const aside = createElement('aside', { class: 'mc-detail' });

  // Botão fechar (×) — desativa o painel até que se clique noutro tile
  if (onClose) {
    const close = createElement('button', {
      type: 'button',
      class: 'mc-detail-close',
      title: 'Fechar painel',
      textContent: '×',
    });
    on(close, 'click', () => onClose());
    aside.appendChild(close);
  }

  const thumbUrl = driveThumbnailUrl(b.thumbnail_drive || b.thumbnail_url, 1200);
  const thumbWrap = createElement('div', { class: 'mc-detail-thumb' });
  if (thumbUrl) {
    const img = createElement('img', { alt: b.title, src: thumbUrl });
    img.onerror = () => { thumbWrap.classList.add('missing'); };
    thumbWrap.appendChild(img);
  }
  aside.appendChild(thumbWrap);

  aside.appendChild(createElement('span', {
    class: 'category',
    textContent: categoryLabel(b.category),
  }));
  aside.appendChild(createElement('h3', { textContent: b.title || 'Sem título' }));
  aside.appendChild(createElement('div', {
    class: 'author',
    textContent: `por ${b.owner_username || '—'}${b.mc_version ? ` · MC ${b.mc_version}` : ''}`,
  }));

  // Tags
  if (Array.isArray(b.tags) && b.tags.length) {
    const tagsBox = createElement('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px' });
    b.tags.forEach((t) => tagsBox.appendChild(createElement('span', {
      class: 'mc-tag-chip',
      style: 'pointer-events:none',
      textContent: `#${t}`,
    })));
    aside.appendChild(tagsBox);
  }

  aside.appendChild(createElement('div', { class: 'desc', textContent: b.description || '(sem descrição)' }));

  // Reações + bookmark (linha centrada)
  const interactionRow = createElement('div', { class: 'mc-detail-interactions' });
  interactionRow.appendChild(renderReactions(b, {
    size: 'lg',
    requireLogin: ctx?.requireLogin,
    onChange,
  }));
  interactionRow.appendChild(renderBookmark(b, {
    size: 'lg',
    requireLogin: ctx?.requireLogin,
    onChange,
  }));
  aside.appendChild(interactionRow);

  // Ícones sociais (acima dos botões)
  const social = renderSocialIcons(b);
  if (social) {
    social.style.justifyContent = 'center';
    social.style.marginBottom = '8px';
    aside.appendChild(social);
  }

  const actions = createElement('div', { class: 'actions' });
  const dlUrl = driveDownloadUrl(b.download_drive || b.download_url);
  if (dlUrl) {
    const a = createElement('a', { textContent: '⬇ Transferir ficheiro', target: '_blank', rel: 'noopener noreferrer' });
    a.href = dlUrl;
    actions.appendChild(a);
  } else {
    actions.appendChild(createElement('div', {
      style: 'text-align:center;color:var(--text3,#777);font-size:11px',
      textContent: 'Sem link de download disponível.',
    }));
  }
  aside.appendChild(actions);

  return aside;
}

function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || 'Outro';
}

/**
 * Devolve um elemento com os ícones sociais (vídeo + outra rede) ou
 * null se a build não tiver nenhum link.
 */
function renderSocialIcons(b) {
  const video = detectPlatform(b.video_url);
  const social = detectPlatform(b.social_url);
  if (!video && !social) return null;

  const wrap = createElement('div', { class: 'mc-social-icons' });
  [video, social].filter(Boolean).forEach((det) => {
    const a = createElement('a', {
      class: `mc-social-icon mc-social-${det.platform}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      title: det.label,
      textContent: det.icon,
    });
    a.href = det.url;
    on(a, 'click', (e) => e.stopPropagation());
    wrap.appendChild(a);
  });
  return wrap;
}
