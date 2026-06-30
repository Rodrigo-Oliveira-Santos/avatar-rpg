/**
 * Admin Panel (Avatar app)
 *
 * Painel local de gestão de utilizadores. Apesar de existir um módulo
 * partilhado em `games/lib/users-registry.js` para o mesmo registry,
 * este painel mantém uma vista própria (com `BackupRestore` + `LogViewer`
 * acoplados) que é específica do Avatar. As mudanças de role são
 * delegadas ao módulo partilhado para garantir que as 4 chaves de
 * sessão (`avatar_rpg_user`, `dnd_user`, `mc_user`, `landing_user`)
 * são sincronizadas em conjunto.
 */

import { on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { getPlayerUsernames } from '../hub/data.js';
import { log } from './LogService.js';
import { LogViewer } from './LogViewer.js';
import { BackupRestore } from './BackupRestore.js';
import { confirmAndDeleteUser } from '../games/lib/delete-user-ui.js';
import {
  validateDeleteUser,
  applyRoleChange,
  STORAGE_KEY as REGISTRY_STORAGE_KEY,
  MAX_ADMINS as SHARED_MAX_ADMINS,
} from '../games/lib/users-registry.js';
import { deletePlayerAccount } from '../api/gm-characters.js';

const STORAGE_KEY = REGISTRY_STORAGE_KEY;
const CHARACTER_STORAGE_PREFIX = 'avatar_rpg_character_';
const MAX_ADMINS = SHARED_MAX_ADMINS;
const DEFAULT_USERS = {
  zuko: 'player',
  katara: 'player',
  toph: 'player',
  aang: 'player',
  sokka: 'player',
  gm: 'gm',
  admin: 'admin',
};
const ROLE_LABELS = {
  player: 'Jogador',
  gm: 'GM',
  admin: 'Admin',
};
const ROLE_ORDER = { player: 0, gm: 1, admin: 2 };

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function normalizeRole(role) {
  return ROLE_LABELS[role] ? role : 'player';
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function readRegistry() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeRegistry(registry) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
}

function createDefaultRegistry() {
  const createdAt = new Date().toISOString();
  return Object.fromEntries(
    Object.entries(DEFAULT_USERS).map(([username, role]) => [username, { role, created_at: createdAt }])
  );
}

function getDefaultRole(username) {
  return DEFAULT_USERS[normalizeUsername(username)] || 'player';
}

export class AdminPanel {
  constructor(container, authManager) {
    this.container = container;
    this.authManager = authManager;
    this.render();
  }

  ensureRegistry() {
    const currentUser = this.authManager?.getUser();
    const currentUsername = normalizeUsername(currentUser?.username);
    const registry = Object.keys(readRegistry()).length > 0 ? { ...readRegistry() } : createDefaultRegistry();
    const knownUsers = new Set([
      ...Object.keys(DEFAULT_USERS),
      ...getPlayerUsernames().map(normalizeUsername),
      currentUsername,
    ].filter(Boolean));

    let changed = Object.keys(readRegistry()).length === 0;

    knownUsers.forEach(username => {
      const existing = registry[username];
      if (!existing) {
        registry[username] = {
          role: username === currentUsername ? normalizeRole(currentUser?.role) : getDefaultRole(username),
          created_at: new Date().toISOString(),
        };
        changed = true;
        return;
      }

      const nextRole = normalizeRole(existing.role);
      const nextCreatedAt = existing.created_at || new Date().toISOString();
      if (existing.role !== nextRole || existing.created_at !== nextCreatedAt) {
        registry[username] = { ...existing, role: nextRole, created_at: nextCreatedAt };
        changed = true;
      }
    });

    if (currentUsername) {
      const currentEntry = registry[currentUsername] || { created_at: new Date().toISOString() };
      const currentRole = normalizeRole(currentUser?.role || currentEntry.role);
      if (currentEntry.role !== currentRole) {
        registry[currentUsername] = { ...currentEntry, role: currentRole };
        changed = true;
      }
    }

    if (changed) {
      writeRegistry(registry);
    }

    return registry;
  }

  getCurrentUsername() {
    return normalizeUsername(this.authManager?.getUser()?.username || 'unknown');
  }

  getUsers() {
    const registry = this.ensureRegistry();
    return Object.entries(registry)
      .map(([username, data]) => ({
        username,
        role: normalizeRole(data?.role),
        created_at: data?.created_at || '',
      }))
      .sort((left, right) => {
        const byRole = ROLE_ORDER[right.role] - ROLE_ORDER[left.role];
        return byRole || left.username.localeCompare(right.username);
      });
  }

  getAdminCount(registry) {
    return Object.values(registry).filter(entry => normalizeRole(entry?.role) === 'admin').length;
  }

  validateRoleChange(username, fromRole, toRole, registry) {
    const currentUsername = this.getCurrentUsername();
    const adminCount = this.getAdminCount(registry);

    if (!username || fromRole === toRole) {
      return { allowed: false, reason: 'Alteração inválida.' };
    }

    if (username === currentUsername && ROLE_ORDER[toRole] < ROLE_ORDER[fromRole]) {
      return { allowed: false, reason: 'Não podes rebaixar a tua própria conta.' };
    }

    if (fromRole === 'player' && toRole !== 'gm') {
      return { allowed: false, reason: 'Jogadores só podem ser promovidos a GM.' };
    }

    if (fromRole === 'gm' && !['player', 'admin'].includes(toRole)) {
      return { allowed: false, reason: 'GMs só podem mudar para jogador ou admin.' };
    }

    if (fromRole === 'admin' && toRole !== 'gm') {
      return { allowed: false, reason: 'Admins só podem ser rebaixados a GM.' };
    }

    if (fromRole === 'gm' && toRole === 'admin' && adminCount >= MAX_ADMINS) {
      return { allowed: false, reason: `Já existem ${MAX_ADMINS} contas admin.` };
    }

    if (fromRole === 'admin' && toRole === 'gm' && adminCount <= 1) {
      return { allowed: false, reason: 'Tem de existir pelo menos 1 admin.' };
    }

    return { allowed: true, reason: '' };
  }

  getActionDefinitions(username, role, registry) {
    if (role === 'player') {
      return [{ label: 'Promover a GM', toRole: 'gm', variant: 'gm' }];
    }

    if (role === 'gm') {
      return [
        { label: 'Promover a Admin', toRole: 'admin', variant: 'admin' },
        { label: 'Rebaixar a Jogador', toRole: 'player', variant: 'muted' },
      ];
    }

    if (role === 'admin') {
      return [{ label: 'Rebaixar a GM', toRole: 'gm', variant: 'danger' }];
    }

    return [];
  }

  /**
   * Whether the targeted user can be deleted. Self-delete blocked; admins
   * can only be removed if at least one other admin remains.
   */
  canDeleteUser(username, role, registry) {
    const currentUsername = this.getCurrentUsername();
    if (!username) return { allowed: false, reason: 'Username inválido.' };
    if (username === currentUsername) {
      return { allowed: false, reason: 'Não podes apagar a tua própria conta.' };
    }
    if (role === 'admin') {
      const adminCount = this.getAdminCount(registry);
      if (adminCount <= 1) {
        return { allowed: false, reason: 'Tem de existir pelo menos 1 admin.' };
      }
    }
    return { allowed: true, reason: '' };
  }

  renderActions(username, role, registry) {
    const actions = this.getActionDefinitions(username, role, registry);
    const actor = { username: this.getCurrentUsername() };
    const buttons = [];

    actions.forEach((action) => {
      const validation = this.validateRoleChange(username, role, action.toRole, registry);
      const disabledAttr = validation.allowed ? '' : ' disabled';
      const titleAttr = validation.reason ? ` title="${escapeHtml(validation.reason)}"` : '';
      buttons.push(`
        <button
          type="button"
          class="admin-action-btn ${action.variant}"
          data-username="${escapeHtml(username)}"
          data-current-role="${escapeHtml(role)}"
          data-next-role="${escapeHtml(action.toRole)}"
          ${disabledAttr}${titleAttr}
        >
          ${escapeHtml(action.label)}
        </button>
      `);
    });

    // Delete account — sempre renderizado, com guards (self / last admin)
    // validados pelo módulo partilhado games/lib/users-registry.
    const deleteValidation = validateDeleteUser({ username, actor });
    const deleteDisabled = deleteValidation.allowed ? '' : ' disabled';
    const deleteTitle = deleteValidation.reason ? ` title="${escapeHtml(deleteValidation.reason)}"` : '';
    buttons.push(`
      <button
        type="button"
        class="admin-action-btn danger admin-delete-btn"
        data-action="delete-account"
        data-username="${escapeHtml(username)}"
        data-current-role="${escapeHtml(role)}"
        ${deleteDisabled}${deleteTitle}
      >
        🗑 Apagar conta
      </button>
    `);

    return buttons.join('') || '<span class="admin-empty-actions">—</span>';
  }

  render() {
    const registry = this.ensureRegistry();
    const users = this.getUsers();
    const adminCount = this.getAdminCount(registry);

    this.container.innerHTML = `
      <section class="admin-panel">
        <header class="admin-panel-header">
          <div>
            <h2>🛡️ Painel de Administração</h2>
            <p>Gerir utilizadores locais e respetivos papéis.</p>
          </div>
          <div class="admin-panel-stats">
            <div class="admin-panel-stat">
              <strong>${users.length}</strong>
              <span>Utilizadores</span>
            </div>
            <div class="admin-panel-stat admin-panel-stat-highlight">
              <strong>${adminCount}/${MAX_ADMINS}</strong>
              <span>Admins</span>
            </div>
          </div>
        </header>

        <div class="admin-panel-note">
          Alterações gravadas em <code>${STORAGE_KEY}</code>. Requer confirmação antes de cada mudança.
        </div>

        <div class="admin-table-wrap">
          <table class="admin-users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => `
                <tr>
                  <td>
                    <div class="admin-username-cell">
                      <span>${escapeHtml(user.username)}</span>
                      ${user.username === this.getCurrentUsername() ? '<span class="admin-self-chip">Sessão atual</span>' : ''}
                    </div>
                  </td>
                  <td>
                    <span class="admin-role-badge ${user.role}">${escapeHtml(ROLE_LABELS[user.role])}</span>
                  </td>
                  <td>
                    <div class="admin-actions-row">
                      ${this.renderActions(user.username, user.role, registry)}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="admin-log-viewer-slot"></div>
        <div class="admin-backup-restore-slot"></div>
      </section>
    `;

    const logViewerContainer = this.container.querySelector('.admin-log-viewer-slot');
    if (logViewerContainer) {
      this.logViewer = new LogViewer(logViewerContainer);
      this.logViewer.render();
    }

    const backupRestoreContainer = this.container.querySelector('.admin-backup-restore-slot');
    if (backupRestoreContainer) {
      this.backupRestore = new BackupRestore(backupRestoreContainer, this.authManager);
    }

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('.admin-action-btn[data-next-role]').forEach(button => {
      on(button, 'click', async () => {
        const username = normalizeUsername(button.dataset.username);
        const fromRole = normalizeRole(button.dataset.currentRole);
        const toRole = normalizeRole(button.dataset.nextRole);
        await this.handleRoleChange(username, fromRole, toRole);
      });
    });

    this.container.querySelectorAll('.admin-delete-btn[data-action="delete-account"]').forEach(button => {
      on(button, 'click', async () => {
        const username = normalizeUsername(button.dataset.username);
        const actor = { username: this.getCurrentUsername() };
        const ok = await confirmAndDeleteUser({
          username,
          actor,
          app: 'avatar',
          onDone: (res) => {
            log('admin_action', {
              action: 'delete_account',
              target: username,
              removed: res?.removed,
            }, actor.username);
          },
        });
        if (ok) this.render();
      });
    });
  }

  syncCharacterRole(username, nextRole) {
    const storageKey = `${CHARACTER_STORAGE_PREFIX}${username}`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const character = JSON.parse(stored);
      if (!character || typeof character !== 'object') return;

      let changed = false;

      if (Object.prototype.hasOwnProperty.call(character, 'role')) {
        character.role = nextRole;
        changed = true;
      }

      if (character.identidade && typeof character.identidade === 'object' && Object.prototype.hasOwnProperty.call(character.identidade, 'role')) {
        character.identidade.role = nextRole;
        changed = true;
      }

      if (changed) {
        localStorage.setItem(storageKey, JSON.stringify(character));
      }
    } catch {
      // Ignore malformed character data
    }
  }

  async handleRoleChange(username, fromRole, toRole) {
    // Validação local primeiro (para a mensagem de erro contextualizada
    // já existente). O `applyRoleChange` partilhado revalida na mesma.
    const registry = this.ensureRegistry();
    const validation = this.validateRoleChange(username, fromRole, toRole, registry);

    if (!validation.allowed) {
      toast(validation.reason, 'warning');
      return;
    }

    const confirmed = await confirmDialog(
      `Alterar o papel de ${username} de ${ROLE_LABELS[fromRole]} para ${ROLE_LABELS[toRole]}?`,
      { confirmText: 'Alterar role', cancelText: 'Cancelar' }
    );

    if (!confirmed) return;

    // Delega ao módulo partilhado: escreve no registry, sincroniza
    // `avatar_rpg_user`, `dnd_user`, `mc_user` e `landing_user` se
    // qualquer sessão activa for deste username.
    const actor = { username: this.getCurrentUsername() };
    const result = applyRoleChange({ username, fromRole, toRole, actor });
    if (!result.ok) {
      toast(result.reason || 'Falha ao alterar role.', 'warning');
      return;
    }

    // Sync auxiliar específico do Avatar (campo `role` dentro do save
    // do personagem, que o módulo partilhado não conhece).
    this.syncCharacterRole(username, toRole);

    // Garantir que o `authManager` em memória reflecte a mudança da
    // sessão Avatar (o applyRoleChange já actualizou o localStorage).
    if (this.authManager && this.getCurrentUsername() === username) {
      try {
        const stored = JSON.parse(localStorage.getItem('avatar_rpg_user') || 'null');
        if (stored) this.authManager.currentUser = stored;
      } catch {}
    }

    log('admin_action', {
      action: 'role_change',
      target: username,
      from: fromRole,
      to: toRole,
    }, this.getCurrentUsername());

    toast(`${username} é agora ${ROLE_LABELS[toRole]}.`, 'success');
    this.render();
  }

  async handleDelete(username, role) {
    const registry = this.ensureRegistry();
    const validation = this.canDeleteUser(username, role, registry);

    if (!validation.allowed) {
      toast(validation.reason, 'warning');
      return;
    }

    const confirmed = await confirmDialog(
      `⚠ Apagar permanentemente a conta de "${username}" (${ROLE_LABELS[role]})?\n\nIsto remove a ficha, inventário, habilidades e notificações. Não pode ser desfeito.`,
      { confirmText: 'Apagar conta', cancelText: 'Cancelar' }
    );
    if (!confirmed) return;

    try {
      await deletePlayerAccount(username);
    } catch (err) {
      console.warn('[AdminPanel.handleDelete]', err);
      toast(`Falha ao apagar: ${err.message}`, 'error');
      return;
    }

    log('admin_action', {
      action: 'account_delete',
      target: username,
      role,
    }, this.getCurrentUsername());

    toast(`Conta "${username}" apagada.`, 'success');
    this.render();
  }
}
