/**
 * Minecraft — Painel Admin.
 *
 * Visível apenas para `role=admin`. Permite:
 *   • Gerir roles (mesmas regras do registry partilhado).
 *   • Apagar contas (cascata cross-app).
 *   • Listar TODAS as builds (de todos os utilizadores) com ações
 *     "Editar", "Apagar" e "Transferir" (mudar de dono).
 *   • Transferir TODAS as builds de um user para outro (bulk).
 *
 * A tab "Painel Pessoal" continua a existir e ainda mostra todas as
 * builds para admins (vista alternativa).
 */

import { createElement, on } from '../../../utils/dom.js';
import { toast, confirmDialog } from '../../../utils/toast.js';
import {
  listBuilds,
  deleteBuild,
  transferBuild,
  transferAllBuildsFromUser,
  CATEGORIES,
} from '../../../api/mc-builds.js';
import { driveThumbnailUrl } from '../lib/drive.js';
import {
  createRegistryAPI,
  getActionsFor,
  ROLE_LABELS,
  MAX_ADMINS,
} from '../../lib/users-registry.js';
import { confirmAndDeleteUser } from '../../lib/delete-user-ui.js';
import { pickUserDialog } from '../../lib/user-picker.js';

// Minecraft admin operates on its own per-app registry — same username
// can have a different role here vs Avatar / D&D.
const REG = createRegistryAPI('mc');

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

export async function renderAdminPage(ctx) {
  const wrap = createElement('section', { class: 'admin-panel mc-admin' });

  async function refresh() {
    wrap.innerHTML = '';
    wrap.appendChild(await buildContent());
  }

  async function buildContent() {
    const root = createElement('div');

    const builds = await listBuilds();
    const buildsByOwner = builds.reduce((acc, b) => {
      const k = (b.owner_username || '').toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const users = REG.list(Object.keys(buildsByOwner));
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const actor = { username: ctx.user?.username, role: ctx.user?.role };

    // ---- Header ---------------------------------------------------
    const header = createElement('header', { class: 'admin-panel-header' });
    const titleBox = createElement('div');
    titleBox.appendChild(createElement('h2', { textContent: '🛡️ Admin Minecraft' }));
    titleBox.appendChild(createElement('p', {
      textContent: 'Gerir utilizadores e moderar todas as builds.',
    }));
    header.appendChild(titleBox);

    const stats = createElement('div', { class: 'admin-panel-stats' });
    stats.appendChild(buildStat(users.length, 'Utilizadores'));
    stats.appendChild(buildStat(builds.length, 'Builds totais'));
    stats.appendChild(buildStat(`${adminCount}/${MAX_ADMINS}`, 'Admins', true));
    header.appendChild(stats);
    root.appendChild(header);

    // ---- Note -----------------------------------------------------
    root.appendChild(createElement('div', {
      class: 'admin-panel-note',
      html: 'Contas Minecraft são independentes do Avatar e do D&D (post 2026-06-30). Mudanças de role aqui só afetam o Minecraft. Apagar build remove também reacções e referências em listas (cleanup automático).',
    }));

    // ---- Users table ---------------------------------------------
    root.appendChild(createElement('h3', { textContent: 'Utilizadores', style: 'margin:18px 0 8px' }));

    const userTableWrap = createElement('div', { class: 'admin-table-wrap' });
    const userTable = createElement('table', { class: 'admin-users-table' });
    userTable.innerHTML = `
      <thead>
        <tr>
          <th>Username</th>
          <th>Role</th>
          <th>Builds</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const userTbody = userTable.querySelector('tbody');

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
        <td>${buildsByOwner[u.username] || 0}</td>
        <td><div class="admin-actions-row" data-roles></div></td>
      `;
      userTbody.appendChild(tr);

      const rolesCell = tr.querySelector('[data-roles]');
      const actions = getActionsFor(u.role);
      if (!actions.length) {
        rolesCell.appendChild(createElement('span', { class: 'admin-empty-actions', textContent: '—' }));
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
              `Alterar ${u.username} de ${ROLE_LABELS[u.role]} para ${ROLE_LABELS[a.toRole]} em Minecraft?`,
            );
            if (!ok) return;
            const res = REG.applyRoleChange({
              username: u.username, fromRole: u.role, toRole: a.toRole, actor,
            });
            if (!res.ok) { toast(res.reason, 'warning'); return; }
            toast(`${u.username} é agora ${ROLE_LABELS[a.toRole]} em Minecraft.`, 'success');
            refresh();
          });
          rolesCell.appendChild(btn);
        });
      }

      // Botão "Transferir builds" — bulk para outro user (só se houver builds)
      const buildCount = buildsByOwner[u.username] || 0;
      const transferAllBtn = createElement('button', {
        class: 'admin-action-btn',
        textContent: `📦 Transferir ${buildCount} build${buildCount === 1 ? '' : 's'}`,
      });
      transferAllBtn.disabled = buildCount === 0;
      if (buildCount === 0) transferAllBtn.title = 'Este utilizador não tem builds.';
      on(transferAllBtn, 'click', async () => {
        const candidates = users
          .filter((other) => other.username !== u.username)
          .map((other) => ({
            username: other.username,
            label: `${other.username} (${ROLE_LABELS[other.role]})`,
          }));
        if (!candidates.length) {
          toast('Não há outro utilizador disponível para receber as builds.', 'warning');
          return;
        }
        const to = await pickUserDialog({
          title: `Transferir ${buildCount} build${buildCount === 1 ? '' : 's'} de "${u.username}"`,
          message: 'Escolhe o novo dono. Todas as builds passam para ele.',
          options: candidates,
          confirmText: 'Transferir',
        });
        if (!to) return;
        const sure = await confirmDialog(
          `Confirmar transferência de ${buildCount} build${buildCount === 1 ? '' : 's'} de "${u.username}" para "${to}"?`,
          { confirmText: 'Transferir', cancelText: 'Cancelar' },
        );
        if (!sure) return;
        const res = await transferAllBuildsFromUser(u.username, to);
        if (res.ok) {
          toast(`${res.transferred} build${res.transferred === 1 ? '' : 's'} transferida${res.transferred === 1 ? '' : 's'} para ${to}.`, 'success');
        } else if (res.transferred) {
          toast(`Transferidas ${res.transferred}, ${res.failed} falharam. ${res.reason}`, 'warning', 5000);
        } else {
          toast(res.reason || 'Falha ao transferir.', 'error');
        }
        refresh();
      });
      rolesCell.appendChild(transferAllBtn);

      // Botão "Apagar conta" — apenas a conta MC do utilizador. Contas
      // Avatar e D&D com o mesmo username ficam intactas (independentes
      // desde 2026-06-30).
      const accountValidation = REG.validateDeleteUser({ username: u.username, actor });
      const deleteAccountBtn = createElement('button', {
        class: 'admin-action-btn danger',
        textContent: '🗑 Apagar conta MC',
      });
      deleteAccountBtn.disabled = !accountValidation.allowed;
      if (!accountValidation.allowed) deleteAccountBtn.title = accountValidation.reason;
      on(deleteAccountBtn, 'click', async () => {
        const ok = await confirmAndDeleteUser({
          username: u.username, actor, app: 'mc', onDone: () => refresh(),
        });
        if (ok) refresh();
      });
      rolesCell.appendChild(deleteAccountBtn);
    });

    userTableWrap.appendChild(userTable);
    root.appendChild(userTableWrap);

    // ---- Builds table --------------------------------------------
    root.appendChild(createElement('h3', { textContent: 'Todas as builds', style: 'margin:22px 0 8px' }));

    if (!builds.length) {
      root.appendChild(createElement('div', {
        class: 'mc-empty',
        textContent: 'Ainda não há builds no sistema.',
      }));
      return root;
    }

    const list = createElement('div', { class: 'mc-panel-list' });
    builds.forEach((b) => list.appendChild(renderBuildRow(b, ctx, refresh, users)));
    root.appendChild(list);

    return root;
  }

  await refresh();
  return wrap;
}

function renderBuildRow(b, ctx, refresh, users) {
  const row = createElement('div', { class: 'mc-panel-row' });

  const thumb = createElement('div', { class: 'thumb' });
  const url = driveThumbnailUrl(b.thumbnail_drive || b.thumbnail_url, 200);
  if (url) {
    const img = createElement('img', { alt: b.title, src: url });
    img.onerror = () => {
      thumb.innerHTML = '?';
      thumb.style.color = '#777';
      thumb.style.display = 'flex';
      thumb.style.alignItems = 'center';
      thumb.style.justifyContent = 'center';
    };
    thumb.appendChild(img);
  } else {
    thumb.style.color = '#777';
    thumb.style.display = 'flex';
    thumb.style.alignItems = 'center';
    thumb.style.justifyContent = 'center';
    thumb.textContent = '—';
  }
  row.appendChild(thumb);

  const info = createElement('div', { class: 'info' });
  info.appendChild(createElement('div', { class: 'name', textContent: b.title || 'Sem título' }));
  const parts = [
    CATEGORIES.find((c) => c.id === b.category)?.label || 'Outro',
    b.owner_username ? `por ${b.owner_username}` : null,
    b.mc_version ? `MC ${b.mc_version}` : null,
  ].filter(Boolean);
  info.appendChild(createElement('div', { class: 'sub', textContent: parts.join(' · ') }));
  row.appendChild(info);

  const actions = createElement('div', { class: 'actions' });
  const editBtn = createElement('button', { class: 'mc-btn', textContent: '✎ Editar' });
  on(editBtn, 'click', () => ctx.onEdit?.(b));

  const transferBtn = createElement('button', { class: 'mc-btn', textContent: '📦 Transferir' });
  on(transferBtn, 'click', async () => {
    const candidates = (users || [])
      .filter((u) => u.username !== b.owner_username)
      .map((u) => ({
        username: u.username,
        label: `${u.username} (${ROLE_LABELS[u.role]})`,
      }));
    if (!candidates.length) {
      toast('Não há outro utilizador disponível.', 'warning');
      return;
    }
    const to = await pickUserDialog({
      title: `Transferir "${b.title || 'sem título'}"`,
      message: `Dono actual: ${b.owner_username || '—'}`,
      options: candidates,
      confirmText: 'Transferir',
    });
    if (!to) return;
    const res = await transferBuild(b.id, to);
    if (res.ok) {
      toast(`Build transferida para ${to}.`, 'success');
      refresh();
    } else {
      toast(res.reason || 'Falha ao transferir.', 'error');
    }
  });

  const delBtn = createElement('button', { class: 'mc-btn danger', textContent: '🗑 Apagar' });
  on(delBtn, 'click', async () => {
    const ok = await confirmDialog(`Apagar a build "${b.title || 'sem título'}"?`);
    if (!ok) return;
    try {
      await deleteBuild(b.id);
      toast('Build apagada', 'success');
      refresh();
    } catch (err) {
      toast(err?.message || 'Falha ao apagar', 'error');
    }
  });
  actions.appendChild(editBtn);
  actions.appendChild(transferBtn);
  actions.appendChild(delBtn);
  row.appendChild(actions);

  return row;
}

function buildStat(value, label, highlight = false) {
  const box = createElement('div', {
    class: 'admin-panel-stat' + (highlight ? ' admin-panel-stat-highlight' : ''),
  });
  box.appendChild(createElement('strong', { textContent: String(value) }));
  box.appendChild(createElement('span', { textContent: label }));
  return box;
}
