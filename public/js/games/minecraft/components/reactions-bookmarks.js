/**
 * Componentes UI partilhados pelo Minecraft (vista de linha, tile e
 * painel de detalhe). Concentra aqui a lógica de:
 *
 *   • Botão de like/dislike (tipo YouTube)
 *   • Botão de bookmark com popover de listas (tipo "Save to playlist")
 *
 * Recebem callbacks `requireLogin()` e `onChange()` para que a página
 * que os usa decida como pedir login e como re-render.
 */

import { createElement, on } from '../../../utils/dom.js';
import { getCounts, react } from '../../../api/mc-reactions.js';
import {
  listLists, createList, listsContainingBuild, setListsForBuild,
  ensureDefaultList, isBookmarked,
} from '../../../api/mc-lists.js';
import { toast } from '../../../utils/toast.js';

/**
 * Renderiza o grupo de reações:
 *   ┌────────────┐
 *   │ 👍 12  👎 1 │
 *   └────────────┘
 *
 * `size`: 'sm' (tiles) | 'md' (rows) | 'lg' (detail panel)
 */
export function renderReactions(build, { size = 'md', requireLogin, onChange } = {}) {
  const wrap = createElement('div', { class: `mc-reactions mc-reactions-${size}` });

  const update = () => {
    wrap.innerHTML = '';
    const c = getCounts(build.id);

    const like = createElement('button', {
      type: 'button',
      class: 'mc-react-btn' + (c.mine === 'like' ? ' on' : ''),
      title: c.mine === 'like' ? 'Retirar like' : 'Like',
      innerHTML: `<span class="icon">👍</span><span class="n">${c.likes}</span>`,
    });
    on(like, 'click', (e) => {
      e.stopPropagation();
      try {
        react(build.id, 'like');
      } catch (err) {
        if (requireLogin) requireLogin();
        else toast(err.message, 'warning');
        return;
      }
      update();
      onChange?.();
    });

    const dislike = createElement('button', {
      type: 'button',
      class: 'mc-react-btn' + (c.mine === 'dislike' ? ' on' : ''),
      title: c.mine === 'dislike' ? 'Retirar dislike' : 'Dislike',
      innerHTML: `<span class="icon">👎</span><span class="n">${c.dislikes}</span>`,
    });
    on(dislike, 'click', (e) => {
      e.stopPropagation();
      try {
        react(build.id, 'dislike');
      } catch (err) {
        if (requireLogin) requireLogin();
        else toast(err.message, 'warning');
        return;
      }
      update();
      onChange?.();
    });

    wrap.appendChild(like);
    wrap.appendChild(dislike);
  };

  update();
  return wrap;
}

/**
 * Renderiza o botão de bookmark + popover com listas.
 * O botão fica destacado se a build estiver em pelo menos uma lista.
 */
export function renderBookmark(build, { size = 'md', requireLogin, onChange } = {}) {
  const wrap = createElement('div', { class: `mc-bookmark mc-bookmark-${size}` });

  const btn = createElement('button', {
    type: 'button',
    class: 'mc-bookmark-btn',
    title: 'Guardar em lista',
  });
  wrap.appendChild(btn);

  const refreshBtn = () => {
    const active = isBookmarked(build.id);
    btn.classList.toggle('on', active);
    btn.innerHTML = `<span class="icon">${active ? '🔖' : '🏷'}</span><span class="lbl">${active ? 'Guardado' : 'Guardar'}</span>`;
  };
  refreshBtn();

  on(btn, 'click', (e) => {
    e.stopPropagation();
    // Tenta criar a default list (precisa de login)
    try {
      ensureDefaultList();
    } catch (err) {
      if (requireLogin) requireLogin();
      else toast(err.message, 'warning');
      return;
    }
    togglePopover(wrap, build, () => { refreshBtn(); onChange?.(); });
  });

  return wrap;
}

function togglePopover(wrap, build, onAfterChange) {
  // Se já há popover aberto, fechá-lo (e remover o listener documental).
  const existing = wrap.querySelector('.mc-bookmark-popover');
  if (existing) {
    closePopover(wrap);
    return;
  }

  const pop = renderPopover(build, () => { onAfterChange?.(); });
  wrap.appendChild(pop);

  // Listener documental para fechar ao clicar fora — guardado no wrap
  // para que `closePopover` o consiga remover em qualquer ramo (clique
  // fora, segundo clique no botão, re-render do pai).
  const onOutside = (ev) => {
    if (!wrap.contains(ev.target)) closePopover(wrap);
  };
  wrap._popoverOutsideHandler = onOutside;
  setTimeout(() => document.addEventListener('mousedown', onOutside), 0);
}

function closePopover(wrap) {
  const pop = wrap.querySelector('.mc-bookmark-popover');
  if (pop) pop.remove();
  const handler = wrap._popoverOutsideHandler;
  if (handler) {
    document.removeEventListener('mousedown', handler);
    wrap._popoverOutsideHandler = null;
  }
}

function renderPopover(build, onChange) {
  const pop = createElement('div', { class: 'mc-bookmark-popover' });
  pop.appendChild(createElement('div', {
    class: 'mc-bookmark-popover-title',
    textContent: 'Guardar em…',
  }));

  const list = createElement('div', { class: 'mc-bookmark-popover-list' });
  const refreshList = () => {
    list.innerHTML = '';
    const lists = listLists();
    const selected = new Set(listsContainingBuild(build.id));
    if (!lists.length) {
      list.appendChild(createElement('div', {
        style: 'font-size:11px;color:var(--text3,#777);text-align:center;padding:6px',
        textContent: '(sem listas — cria uma abaixo)',
      }));
      return;
    }
    lists.forEach((l) => {
      const row = createElement('label', { class: 'mc-bookmark-popover-row' });
      const cb = createElement('input', { type: 'checkbox' });
      cb.checked = selected.has(l.id);
      on(cb, 'change', () => {
        if (cb.checked) selected.add(l.id); else selected.delete(l.id);
        try {
          setListsForBuild(build.id, [...selected]);
          onChange?.();
        } catch (err) {
          toast(err.message, 'error');
          cb.checked = !cb.checked;
        }
      });
      row.appendChild(cb);
      row.appendChild(createElement('span', { textContent: l.name }));
      row.appendChild(createElement('span', {
        class: 'count',
        textContent: `${l.build_ids.length}`,
      }));
      list.appendChild(row);
    });
  };
  refreshList();
  pop.appendChild(list);

  // Form para criar nova lista inline
  const newRow = createElement('div', { class: 'mc-bookmark-popover-new' });
  const nameInput = createElement('input', {
    type: 'text',
    placeholder: 'Nova lista…',
  });
  const addBtn = createElement('button', { type: 'button', textContent: '+ Criar' });
  on(addBtn, 'click', (e) => {
    e.stopPropagation();
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    try {
      const l = createList(name);
      // Auto-adiciona a build à lista nova
      setListsForBuild(build.id, [...listsContainingBuild(build.id), l.id]);
      nameInput.value = '';
      refreshList();
      onChange?.();
      toast(`Lista "${name}" criada`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
  newRow.appendChild(nameInput);
  newRow.appendChild(addBtn);
  pop.appendChild(newRow);

  return pop;
}
