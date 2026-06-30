/**
 * Landing — Admin Global.
 *
 * Painel agregador visível a partir da landing page. Mostra todos os
 * utilizadores conhecidos do registry partilhado e estatísticas por
 * jogo (tem ficha Avatar? Tem ficha D&D? Quantas builds Minecraft?).
 *
 * Permite ainda gerir roles globalmente (promover/rebaixar) usando o
 * mesmo conjunto de regras do Avatar AdminPanel — porque escrevem
 * todos para o mesmo `avatar_rpg_users_registry`.
 *
 * Auth: o módulo recebe `actor` (sessão admin activa). Quem chama
 * (LandingPage) só renderiza isto se `hasAnyAdminSession()` for true,
 * pelo que aqui assumimos que actor existe.
 */

import { createElement, on } from '../../../utils/dom.js';
import { toast, confirmDialog } from '../../../utils/toast.js';
import {
  getUsers,
  getActionsFor,
  applyRoleChange,
  validateRoleChange,
  validateDeleteUser,
  ROLE_LABELS,
  MAX_ADMINS,
} from '../../lib/users-registry.js';
import { confirmAndDeleteUser } from '../../lib/delete-user-ui.js';

const AVATAR_CHARACTER_PREFIX = 'avatar_rpg_character_';
const DND_CHARACTER_PREFIX = 'dnd_character_';
const MC_BUILDS_KEY = 'mc_builds';

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function safeJsonGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildPerUserStats(usernames) {
  const stats = {};
  for (const username of usernames) {
    stats[username] = {
      avatar: !!safeJsonGet(`${AVATAR_CHARACTER_PREFIX}${username}`),
      dnd: !!safeJsonGet(`${DND_CHARACTER_PREFIX}${username}`),
      mcBuilds: 0,
    };
  }
  const builds = safeJsonGet(MC_BUILDS_KEY);
  if (Array.isArray(builds)) {
    for (const b of builds) {
      const owner = (b?.owner_username || '').toLowerCase();
      if (stats[owner]) stats[owner].mcBuilds += 1;
    }
  }
  return stats;
}

function knownUsernamesFromAllSources() {
  const set = new Set();
  if (typeof localStorage === 'undefined') return [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(AVATAR_CHARACTER_PREFIX)) set.add(key.slice(AVATAR_CHARACTER_PREFIX.length));
    else if (key.startsWith(DND_CHARACTER_PREFIX)) set.add(key.slice(DND_CHARACTER_PREFIX.length));
  }
  const builds = safeJsonGet(MC_BUILDS_KEY);
  if (Array.isArray(builds)) {
    for (const b of builds) {
      const owner = (b?.owner_username || '').toLowerCase();
      if (owner) set.add(owner);
    }
  }
  return [...set];
}

export function renderAdminLandingPage({ actor, onBack }) {
  const wrap = createElement('section', { class: 'admin-panel admin-landing' });

  function refresh() {
    wrap.innerHTML = '';
    wrap.appendChild(buildContent());
  }

  function buildContent() {
    const root = createElement('div');

    const users = getUsers(knownUsernamesFromAllSources());
    const stats = buildPerUserStats(users.map((u) => u.username));
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const totals = users.reduce((acc, u) => {
      const s = stats[u.username];
      if (s.avatar) acc.avatar += 1;
      if (s.dnd) acc.dnd += 1;
      acc.mcBuilds += s.mcBuilds;
      return acc;
    }, { avatar: 0, dnd: 0, mcBuilds: 0 });

    // ---- Header ---------------------------------------------------
    const header = createElement('header', { class: 'admin-panel-header' });
    const titleBox = createElement('div');
    titleBox.appendChild(createElement('h2', { textContent: '🛡️ Admin Global' }));
    titleBox.appendChild(createElement('p', {
      textContent: `A operar como ${actor.username} (${actor.role}) — sessão ${actor.app}.`,
    }));
    header.appendChild(titleBox);

    const statsBox = createElement('div', { class: 'admin-panel-stats' });
    statsBox.appendChild(stat(users.length, 'Utilizadores'));
    statsBox.appendChild(stat(`${adminCount}/${MAX_ADMINS}`, 'Admins', true));
    statsBox.appendChild(stat(totals.avatar, 'Fichas Avatar'));
    statsBox.appendChild(stat(totals.dnd, 'Fichas D&D'));
    statsBox.appendChild(stat(totals.mcBuilds, 'Builds MC'));
    header.appendChild(statsBox);

    root.appendChild(header);

    // ---- Back -----------------------------------------------------
    const backRow = createElement('div', { style: 'margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap' });
    const backBtn = createElement('button', { class: 'admin-toolbar-btn', textContent: '← Voltar à landing' });
    on(backBtn, 'click', () => onBack?.());
    backRow.appendChild(backBtn);
    root.appendChild(backRow);

    // ---- Note -----------------------------------------------------
    root.appendChild(createElement('div', {
      class: 'admin-panel-note',
      html: 'Mudanças escritas em <code>avatar_rpg_users_registry</code>. ' +
        'Sessões activas com o username afectado são sincronizadas automaticamente.',
    }));

    // ---- Table ----------------------------------------------------
    const tableWrap = createElement('div', { class: 'admin-table-wrap' });
    const table = createElement('table', { class: 'admin-users-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Username</th>
          <th>Role</th>
          <th>Avatar</th>
          <th>D&D 5e</th>
          <th>Minecraft</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    users.forEach((u) => {
      const s = stats[u.username];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="admin-username-cell">
            <span>${escapeHtml(u.username)}</span>
            ${u.username === actor.username ? '<span class="admin-self-chip">Sessão actual</span>' : ''}
          </div>
        </td>
        <td><span class="admin-role-badge ${u.role}">${escapeHtml(ROLE_LABELS[u.role])}</span></td>
        <td>${s.avatar ? '✓' : '—'}</td>
        <td>${s.dnd ? '✓' : '—'}</td>
        <td>${s.mcBuilds || '—'}</td>
        <td><div class="admin-actions-row" data-actions="${escapeHtml(u.username)}"></div></td>
      `;
      tbody.appendChild(tr);

      const actionsCell = tr.querySelector(`[data-actions="${cssEscape(u.username)}"]`);
      const actions = getActionsFor(u.role);
      if (!actions.length) {
        actionsCell.appendChild(createElement('span', { class: 'admin-empty-actions', textContent: '—' }));
      } else {
        actions.forEach((a) => {
          const validation = validateRoleChange({
            username: u.username, fromRole: u.role, toRole: a.toRole, actor,
          });
          const btn = createElement('button', {
            class: `admin-action-btn ${a.variant}`,
            textContent: a.label,
          });
          btn.disabled = !validation.allowed;
          if (!validation.allowed) btn.title = validation.reason;
          on(btn, 'click', async () => {
            const ok = await confirmDialog(
              `Alterar ${u.username} de ${ROLE_LABELS[u.role]} para ${ROLE_LABELS[a.toRole]}?`,
              { confirmText: 'Alterar', cancelText: 'Cancelar' },
            );
            if (!ok) return;
            const res = applyRoleChange({
              username: u.username, fromRole: u.role, toRole: a.toRole, actor,
            });
            if (!res.ok) {
              toast(res.reason, 'warning');
              return;
            }
            toast(`${u.username} é agora ${ROLE_LABELS[a.toRole]}.`, 'success');
            refresh();
          });
          actionsCell.appendChild(btn);
        });
      }

      // Botão "Apagar conta" — sempre presente, validação inline
      const delValidation = validateDeleteUser({ username: u.username, actor });
      const delBtn = createElement('button', {
        class: 'admin-action-btn danger',
        textContent: '🗑 Apagar conta',
      });
      delBtn.disabled = !delValidation.allowed;
      if (!delValidation.allowed) delBtn.title = delValidation.reason;
      on(delBtn, 'click', async () => {
        const ok = await confirmAndDeleteUser({
          username: u.username, actor, onDone: () => refresh(),
        });
        if (ok) refresh();
      });
      actionsCell.appendChild(delBtn);
    });

    tableWrap.appendChild(table);
    root.appendChild(tableWrap);

    return root;
  }

  refresh();
  return wrap;
}

function stat(value, label, highlight = false) {
  const box = createElement('div', {
    class: 'admin-panel-stat' + (highlight ? ' admin-panel-stat-highlight' : ''),
  });
  box.appendChild(createElement('strong', { textContent: String(value) }));
  box.appendChild(createElement('span', { textContent: label }));
  return box;
}

function cssEscape(value) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
}
