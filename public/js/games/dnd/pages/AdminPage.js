/**
 * D&D — Painel Admin.
 *
 * Visível apenas para utilizadores com role=admin. Permite:
 *   • Ver todos os utilizadores conhecidos (com indicação de quem tem
 *     ficha D&D criada vs apenas registado).
 *   • Gerir roles (mesmas regras do registry partilhado).
 *   • "Editar" qualquer ficha — entra em modo impersonate na app
 *     principal (todas as tabs sheet/perícias/magias/inventário passam
 *     a editar a ficha do alvo).
 *   • Apagar qualquer ficha.
 *
 * Não toca em fichas Avatar nem em builds Minecraft — isso vive nos
 * painéis admin dos respectivos jogos.
 */

import { createElement, on } from '../../../utils/dom.js';
import { toast, confirmDialog } from '../../../utils/toast.js';
import { listAll } from '../../../api/dnd-characters.js';
import { totalLevel, classesSummary } from '../dnd-character.js';
import { CLASSES } from '../data/srd.js';
import {
  createRegistryAPI,
  getActionsFor,
  ROLE_LABELS,
  MAX_ADMINS,
} from '../../lib/users-registry.js';
import { confirmAndDeleteUser } from '../../lib/delete-user-ui.js';

// D&D admin operates on its own per-app registry — same username can
// have a different role here vs Avatar / MC.
const REG = createRegistryAPI('dnd');

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

export async function renderAdminPage(ctx) {
  const wrap = createElement('section', { class: 'admin-panel dnd-admin' });

  async function refresh() {
    wrap.innerHTML = '';
    wrap.appendChild(await buildContent());
  }

  async function buildContent() {
    const root = createElement('div');

    const sheets = await listAll();
    const sheetMap = new Map();
    for (const s of sheets) {
      const u = (s.owner_username || '').toLowerCase();
      if (u) sheetMap.set(u, s);
    }

    const users = REG.list([...sheetMap.keys()]);
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const actor = { username: ctx.currentUser?.username, role: ctx.currentUser?.role };

    // ---- Header ---------------------------------------------------
    const header = createElement('header', { class: 'admin-panel-header' });
    const titleBox = createElement('div');
    titleBox.appendChild(createElement('h2', { textContent: '🛡️ Admin D&D 5e' }));
    titleBox.appendChild(createElement('p', {
      textContent: 'Gerir utilizadores e fichas D&D. "Editar" entra em modo admin nas tabs principais.',
    }));
    header.appendChild(titleBox);

    const stats = createElement('div', { class: 'admin-panel-stats' });
    stats.appendChild(buildStat(users.length, 'Utilizadores'));
    stats.appendChild(buildStat(sheets.length, 'Fichas'));
    stats.appendChild(buildStat(`${adminCount}/${MAX_ADMINS}`, 'Admins', true));
    header.appendChild(stats);
    root.appendChild(header);

    // ---- Note -----------------------------------------------------
    root.appendChild(createElement('div', {
      class: 'admin-panel-note',
      html: 'Contas D&D são independentes do Avatar e do Minecraft (post 2026-06-30). Mudanças de role aqui só afetam o D&D. "Apagar conta D&D" remove apenas a ficha + sessão D&D — as contas Avatar / Minecraft com o mesmo username ficam intactas.',
    }));

    // ---- Table ----------------------------------------------------
    const tableWrap = createElement('div', { class: 'admin-table-wrap' });
    const table = createElement('table', { class: 'admin-users-table' });
    table.innerHTML = `
      <thead>
        <tr>
          <th>Username</th>
          <th>Role</th>
          <th>Ficha D&D</th>
          <th>Roles</th>
          <th>Ficha</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    users.forEach((u) => {
      const sheet = sheetMap.get(u.username);
      const tr = document.createElement('tr');

      const summary = sheet
        ? `Nv ${totalLevel(sheet)} · ${classesSummary(sheet) || classLabel(sheet) || '—'}`
        : '—';

      tr.innerHTML = `
        <td>
          <div class="admin-username-cell">
            <span>${escapeHtml(u.username)}</span>
            ${u.username === actor.username ? '<span class="admin-self-chip">Tu</span>' : ''}
            ${u.username === ctx.impersonatedUsername ? '<span class="admin-self-chip" style="background:rgba(122,112,224,.18);border-color:rgba(122,112,224,.45);color:#cbb8ff">A editar</span>' : ''}
          </div>
        </td>
        <td><span class="admin-role-badge ${u.role}">${escapeHtml(ROLE_LABELS[u.role])}</span></td>
        <td>${escapeHtml(summary)}</td>
        <td><div class="admin-actions-row" data-roles></div></td>
        <td><div class="admin-actions-row" data-sheet></div></td>
      `;
      tbody.appendChild(tr);

      // Role actions ----------------------------------------------
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
              `Alterar ${u.username} de ${ROLE_LABELS[u.role]} para ${ROLE_LABELS[a.toRole]} em D&D 5e?`,
            );
            if (!ok) return;
            const res = REG.applyRoleChange({
              username: u.username, fromRole: u.role, toRole: a.toRole, actor,
            });
            if (!res.ok) { toast(res.reason, 'warning'); return; }
            toast(`${u.username} é agora ${ROLE_LABELS[a.toRole]} em D&D.`, 'success');
            refresh();
          });
          rolesCell.appendChild(btn);
        });
      }

      // Botão "Apagar conta" — apaga APENAS a conta D&D do utilizador.
      // Avatar e Minecraft mantêm-se inalterados (contas independentes
      // desde 2026-06-30).
      const accountValidation = REG.validateDeleteUser({ username: u.username, actor });
      const deleteAccountBtn = createElement('button', {
        class: 'admin-action-btn danger',
        textContent: '🗑 Apagar conta D&D',
      });
      deleteAccountBtn.disabled = !accountValidation.allowed;
      if (!accountValidation.allowed) deleteAccountBtn.title = accountValidation.reason;
      on(deleteAccountBtn, 'click', async () => {
        const ok = await confirmAndDeleteUser({
          username: u.username, actor, app: 'dnd', onDone: () => refresh(),
        });
        if (ok) refresh();
      });
      rolesCell.appendChild(deleteAccountBtn);

      // Sheet actions ---------------------------------------------
      const sheetCell = tr.querySelector('[data-sheet]');
      const editBtn = createElement('button', {
        class: 'admin-action-btn admin',
        textContent: u.username === actor.username ? 'Editar (eu)' : '✎ Editar',
      });
      // Editar a si próprio = sair do modo impersonate (volta ao normal)
      const isSelf = u.username === actor.username;
      on(editBtn, 'click', async () => {
        if (isSelf) {
          if (ctx.impersonatedUsername) await ctx.stopImpersonation?.();
          return;
        }
        await ctx.startImpersonation?.(u.username);
      });
      sheetCell.appendChild(editBtn);

      const delBtn = createElement('button', {
        class: 'admin-action-btn danger',
        textContent: '🗑 Apagar ficha',
      });
      delBtn.disabled = !sheet;
      if (!sheet) delBtn.title = 'Sem ficha guardada.';
      if (isSelf) {
        delBtn.disabled = true;
        delBtn.title = 'Usa o gerenciamento de dados na própria ficha.';
      }
      on(delBtn, 'click', async () => {
        const ok = await confirmDialog(
          `Apagar a ficha D&D de ${u.username}? Esta acção não pode ser desfeita.`,
          { confirmText: 'Apagar ficha', cancelText: 'Cancelar' },
        );
        if (!ok) return;
        try {
          const removed = await ctx.deleteCharacter?.(u.username);
          if (removed) {
            toast(`Ficha de ${u.username} apagada.`, 'success');
            refresh();
          } else {
            toast('Nada para apagar.', 'info');
          }
        } catch (err) {
          toast(err?.message || 'Falha ao apagar', 'error');
        }
      });
      sheetCell.appendChild(delBtn);
    });

    tableWrap.appendChild(table);
    root.appendChild(tableWrap);

    return root;
  }

  await refresh();
  return wrap;
}

function buildStat(value, label, highlight = false) {
  const box = createElement('div', {
    class: 'admin-panel-stat' + (highlight ? ' admin-panel-stat-highlight' : ''),
  });
  box.appendChild(createElement('strong', { textContent: String(value) }));
  box.appendChild(createElement('span', { textContent: label }));
  return box;
}

function classLabel(sheet) {
  const id = sheet?.identity?.class || sheet?.class;
  return CLASSES.find((c) => c.id === id)?.label || id || '';
}
