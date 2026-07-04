/**
 * Landing — Admin Global.
 *
 * Painel agregador per-app (post 2026-06-30): cada app tem o seu
 * próprio registry, por isso o mesmo username pode ter roles
 * diferentes em Avatar / D&D / MC. Esta página expõe um tab por app
 * + um tab "Cross-app" para a visão de conjunto + o delete cascata
 * em todas as apps de uma vez.
 *
 * Auth: o módulo recebe `actor` (sessão admin activa). Quem chama
 * (LandingPage) só renderiza isto se `hasAnyAdminSession()` for true,
 * pelo que aqui assumimos que actor existe.
 */
import { createElement, on } from '../../../utils/dom.js';
import { toast, confirmDialog } from '../../../utils/toast.js';
import {
  APP_IDS,
  APP_LABELS,
  MAX_ADMINS,
  ROLE_LABELS,
  createRegistryAPI,
  getActionsFor,
  normalizeUsername,
  validateAppDeleteUser,
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

/** Counts per-user data slices across the 3 apps (for the cross-app stats). */
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
  // Also fold in every username present in any of the 3 registries.
  for (const id of APP_IDS) {
    const reg = createRegistryAPI(id).read();
    for (const u of Object.keys(reg || {})) set.add(u);
  }
  return [...set];
}

const TABS = [
  { id: 'avatar', label: APP_LABELS.avatar },
  { id: 'dnd',    label: APP_LABELS.dnd },
  { id: 'mc',     label: APP_LABELS.mc },
  { id: 'cross',  label: 'Cross-app' },
];

export function renderAdminLandingPage({ actor, onBack }) {
  const wrap = createElement('section', { class: 'admin-panel admin-landing' });
  let activeTab = 'avatar';

  function refresh() {
    wrap.innerHTML = '';
    wrap.appendChild(buildShell());
  }

  function buildShell() {
    const root = createElement('div');

    // ---- Header ---------------------------------------------------
    const allKnown = knownUsernamesFromAllSources();
    const stats = buildPerUserStats(allKnown);
    const totals = allKnown.reduce((acc, name) => {
      const s = stats[name];
      if (s.avatar) acc.avatar += 1;
      if (s.dnd) acc.dnd += 1;
      acc.mcBuilds += s.mcBuilds;
      return acc;
    }, { avatar: 0, dnd: 0, mcBuilds: 0 });

    const header = createElement('header', { class: 'admin-panel-header' });
    const titleBox = createElement('div');
    titleBox.appendChild(createElement('h2', { textContent: '🛡️ Admin Global' }));
    titleBox.appendChild(createElement('p', {
      textContent: `A operar como ${actor.username} (${actor.role}) — sessão ${actor.app}. Contas independentes por app.`,
    }));
    header.appendChild(titleBox);

    const statsBox = createElement('div', { class: 'admin-panel-stats' });
    statsBox.appendChild(stat(allKnown.length, 'Usernames totais'));
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

    // ---- Tabs ----------------------------------------------------
    const tabBar = createElement('div', { class: 'admin-landing-tabs' });
    TABS.forEach((t) => {
      const btn = createElement('button', {
        class: `admin-landing-tab${activeTab === t.id ? ' on' : ''}`,
        textContent: t.label,
      });
      on(btn, 'click', () => { activeTab = t.id; refresh(); });
      tabBar.appendChild(btn);
    });
    root.appendChild(tabBar);

    // ---- Active tab body -----------------------------------------
    if (activeTab === 'cross') {
      root.appendChild(buildCrossAppTab(allKnown, stats));
    } else {
      root.appendChild(buildAppTab(activeTab));
    }

    return root;
  }

  /**
   * Per-app tab (Avatar / D&D / MC). Uses createRegistryAPI(appId) so
   * every mutation is scoped to that app — exactly the same semantics
   * as the dedicated admin page for each app.
   */
  function buildAppTab(appId) {
    const REG = createRegistryAPI(appId);
    const users = REG.list();
    const adminCount = users.filter((u) => u.role === 'admin').length;

    const body = createElement('div');

    body.appendChild(createElement('div', {
      class: 'admin-panel-note',
      html: `Mudanças neste tab só afetam <strong>${APP_LABELS[appId]}</strong>. Contas com o mesmo username noutras apps ficam intactas.`,
    }));

    const summary = createElement('div', { class: 'admin-panel-stats', style: 'margin-top:8px' });
    summary.appendChild(stat(users.length, 'Utilizadores'));
    summary.appendChild(stat(`${adminCount}/${MAX_ADMINS}`, 'Admins', true));
    body.appendChild(summary);

    const tableWrap = createElement('div', { class: 'admin-table-wrap' });
    const table = createElement('table', { class: 'admin-users-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Username</th>
          <th>Role nesta app</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    users.forEach((u) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="admin-username-cell">
            <span>${escapeHtml(u.username)}</span>
            ${u.username === actor.username ? '<span class="admin-self-chip">Tu</span>' : ''}
          </div>
        </td>
        <td><span class="admin-role-badge ${u.role}">${escapeHtml(ROLE_LABELS[u.role])}</span></td>
        <td><div class="admin-actions-row" data-actions="${escapeHtml(u.username)}"></div></td>
      `;
      tbody.appendChild(tr);

      const actionsCell = tr.querySelector(`[data-actions="${cssEscape(u.username)}"]`);
      const actions = getActionsFor(u.role);
      if (!actions.length) {
        actionsCell.appendChild(createElement('span', { class: 'admin-empty-actions', textContent: '—' }));
      } else {
        actions.forEach((a) => {
          const validation = REG.validateRoleChange({
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
              `Alterar ${u.username} de ${ROLE_LABELS[u.role]} para ${ROLE_LABELS[a.toRole]} em ${APP_LABELS[appId]}?`,
              { confirmText: 'Alterar', cancelText: 'Cancelar' },
            );
            if (!ok) return;
            const res = REG.applyRoleChange({
              username: u.username, fromRole: u.role, toRole: a.toRole, actor,
            });
            if (!res.ok) { toast(res.reason, 'warning'); return; }
            toast(`${u.username} é agora ${ROLE_LABELS[a.toRole]} em ${APP_LABELS[appId]}.`, 'success');
            refresh();
          });
          actionsCell.appendChild(btn);
        });
      }

      // Delete in this app only.
      const delValidation = REG.validateDeleteUser({ username: u.username, actor });
      const delBtn = createElement('button', {
        class: 'admin-action-btn danger',
        textContent: `🗑 Apagar em ${APP_LABELS[appId]}`,
      });
      delBtn.disabled = !delValidation.allowed;
      if (!delValidation.allowed) delBtn.title = delValidation.reason;
      on(delBtn, 'click', async () => {
        const ok = await confirmAndDeleteUser({
          username: u.username, actor, app: appId, onDone: () => refresh(),
        });
        if (ok) refresh();
      });
      actionsCell.appendChild(delBtn);
    });

    tableWrap.appendChild(table);
    body.appendChild(tableWrap);
    return body;
  }

  /**
   * Cross-app tab. Shows the union of every known username with their
   * role in each app side-by-side, plus the "apagar de TODAS as apps"
   * cascading delete. This is the one-stop-shop for the power admin.
   */
  function buildCrossAppTab(allKnown, stats) {
    const body = createElement('div');

    const regs = {
      avatar: createRegistryAPI('avatar').read(),
      dnd:    createRegistryAPI('dnd').read(),
      mc:     createRegistryAPI('mc').read(),
    };

    body.appendChild(createElement('div', {
      class: 'admin-panel-note',
      html: '"Apagar em <strong>TODAS</strong>" remove a conta + dados em Avatar, D&D e Minecraft de uma só vez. Cada app continua disponível nos seus tabs próprios para deletes parciais.',
    }));

    const tableWrap = createElement('div', { class: 'admin-table-wrap' });
    const table = createElement('table', { class: 'admin-users-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Username</th>
          <th>Role Avatar</th>
          <th>Role D&D</th>
          <th>Role MC</th>
          <th>Ficha Avatar</th>
          <th>Ficha D&D</th>
          <th>Builds MC</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    [...allKnown].sort((a, b) => a.localeCompare(b)).forEach((username) => {
      const s = stats[username] || { avatar: false, dnd: false, mcBuilds: 0 };
      const roles = {
        avatar: regs.avatar[username]?.role || '—',
        dnd:    regs.dnd[username]?.role || '—',
        mc:     regs.mc[username]?.role || '—',
      };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="admin-username-cell">
            <span>${escapeHtml(username)}</span>
            ${username === actor.username ? '<span class="admin-self-chip">Tu</span>' : ''}
          </div>
        </td>
        <td><span class="admin-role-badge ${roles.avatar}">${escapeHtml(ROLE_LABELS[roles.avatar] || '—')}</span></td>
        <td><span class="admin-role-badge ${roles.dnd}">${escapeHtml(ROLE_LABELS[roles.dnd] || '—')}</span></td>
        <td><span class="admin-role-badge ${roles.mc}">${escapeHtml(ROLE_LABELS[roles.mc] || '—')}</span></td>
        <td>${s.avatar ? '✓' : '—'}</td>
        <td>${s.dnd ? '✓' : '—'}</td>
        <td>${s.mcBuilds || '—'}</td>
        <td><div class="admin-actions-row" data-actions="${escapeHtml(username)}"></div></td>
      `;
      tbody.appendChild(tr);

      const actionsCell = tr.querySelector(`[data-actions="${cssEscape(username)}"]`);

      // Single button: cascade delete across every app.
      const allValidation = validateAppDeleteUser({ appId: 'avatar', username, actor });
      const delBtn = createElement('button', {
        class: 'admin-action-btn danger',
        textContent: '🗑 Apagar em TODAS',
      });
      delBtn.disabled = !allValidation.allowed;
      if (!allValidation.allowed) delBtn.title = allValidation.reason;
      on(delBtn, 'click', async () => {
        const ok = await confirmAndDeleteUser({
          username, actor, app: 'all', onDone: () => refresh(),
        });
        if (ok) refresh();
      });
      actionsCell.appendChild(delBtn);
    });

    tableWrap.appendChild(table);
    body.appendChild(tableWrap);
    return body;
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
