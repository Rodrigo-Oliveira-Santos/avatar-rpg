/**
 * Backup & Restore
 * Admin-only full localStorage export/import for Avatar RPG.
 */

import { on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { log } from './LogService.js';

const STORAGE_PREFIX = 'avatar_rpg_';
const PROTECTED_KEYS = new Set(['avatar_rpg_user', 'avatar_rpg_token']);
const PREVIEW_LABELS = {
  characters: 'Personagens',
  skills: 'Skills',
  items: 'Itens',
  users: 'Utilizadores',
  logs: 'Logs',
  trades: 'Trocas',
  session: 'Sessão',
  other: 'Outros',
};

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseStoredValue(value) {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function serializeStoredValue(value) {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function getTimestampForFilename(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}`;
}

function getBackupFilename() {
  return `avatar_rpg_backup_${getTimestampForFilename()}.json`;
}

function classifyKey(key) {
  if (key.startsWith('avatar_rpg_character_')) return 'characters';
  if (key.startsWith('avatar_rpg_imported_skills_')) return 'skills';
  if (key === 'avatar_rpg_imported_items') return 'items';
  if (key === 'avatar_rpg_users_registry') return 'users';
  if (key === 'avatar_rpg_system_logs') return 'logs';
  if (key === 'avatar_rpg_trades') return 'trades';
  if (PROTECTED_KEYS.has(key)) return 'session';
  return 'other';
}

function collectAvatarKeys() {
  const keys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys.sort((left, right) => left.localeCompare(right));
}

function buildSummary(keysObject) {
  const summary = {
    total: 0,
    restorable: 0,
    skippedProtected: 0,
    types: Object.fromEntries(Object.keys(PREVIEW_LABELS).map(key => [key, 0])),
  };

  Object.keys(keysObject).forEach(key => {
    if (!key.startsWith(STORAGE_PREFIX)) return;

    summary.total += 1;
    summary.types[classifyKey(key)] += 1;

    if (PROTECTED_KEYS.has(key)) {
      summary.skippedProtected += 1;
      return;
    }

    summary.restorable += 1;
  });

  return summary;
}

export class BackupRestore {
  constructor(container, authManager) {
    this.container = container;
    this.authManager = authManager;
    this.loadedBackup = null;
    this.render();
  }

  getCurrentUsername() {
    return this.authManager?.getUser?.()?.username || 'unknown';
  }

  render() {
    this.container.innerHTML = `
      <section class="admin-backup-section">
        <div class="admin-backup-header">
          <div>
            <h3>💾 Backup & Restauro</h3>
            <p>Exporta e restaura todos os dados locais do Avatar RPG.</p>
          </div>
        </div>

        <div class="admin-backup-grid">
          <section class="admin-backup-card">
            <h4>Exportar Backup</h4>
            <p>Exportar todos os dados do jogo (personagens, itens, skills, configurações)</p>
            <div class="admin-backup-actions">
              <button type="button" class="import-btn primary" data-action="export-backup">Exportar Backup</button>
            </div>
          </section>

          <section class="admin-backup-card">
            <h4>Restaurar Backup</h4>
            <p>Restaurar dados a partir de um ficheiro de backup</p>

            <div class="drop-zone admin-backup-drop-zone" data-role="drop-zone">
              <div class="drop-zone-icon">🗂️</div>
              <div class="drop-zone-text">
                Arrasta um ficheiro JSON aqui ou <strong>clica para selecionar</strong>
              </div>
              <input type="file" accept=".json,application/json" data-role="file-input">
            </div>

            <div class="admin-backup-mode">
              <label class="admin-backup-radio">
                <input type="radio" name="backup-restore-mode" value="replace" checked>
                <span>Substituir tudo</span>
              </label>
              <label class="admin-backup-radio">
                <input type="radio" name="backup-restore-mode" value="merge">
                <span>Merge (atualizar existentes + adicionar novos)</span>
              </label>
            </div>

            <div class="import-preview admin-backup-preview" data-role="preview"></div>

            <div class="admin-backup-actions">
              <button type="button" class="import-btn primary" data-action="restore-backup" disabled>Restaurar</button>
              <button type="button" class="import-btn secondary" data-action="clear-backup">Limpar</button>
            </div>
          </section>
        </div>
      </section>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const exportButton = this.container.querySelector('[data-action="export-backup"]');
    const restoreButton = this.container.querySelector('[data-action="restore-backup"]');
    const clearButton = this.container.querySelector('[data-action="clear-backup"]');
    const dropZone = this.container.querySelector('[data-role="drop-zone"]');
    const fileInput = this.container.querySelector('[data-role="file-input"]');

    if (exportButton) {
      on(exportButton, 'click', () => this.handleExport());
    }

    if (restoreButton) {
      on(restoreButton, 'click', () => this.handleRestore());
    }

    if (clearButton) {
      on(clearButton, 'click', () => this.resetImportState());
    }

    if (!dropZone || !fileInput) return;

    on(dropZone, 'click', () => fileInput.click());
    on(fileInput, 'change', event => {
      const file = event.target.files?.[0];
      if (file) {
        this.handleFile(file);
      }
    });

    on(dropZone, 'dragover', event => {
      event.preventDefault();
      dropZone.classList.add('drag-over');
    });

    on(dropZone, 'dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    on(dropZone, 'drop', event => {
      event.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        this.handleFile(file);
      }
    });
  }

  resetImportState() {
    this.loadedBackup = null;

    const fileInput = this.container.querySelector('[data-role="file-input"]');
    const preview = this.container.querySelector('[data-role="preview"]');
    const restoreButton = this.container.querySelector('[data-action="restore-backup"]');

    if (fileInput) fileInput.value = '';
    if (preview) {
      preview.classList.remove('visible');
      preview.innerHTML = '';
    }
    if (restoreButton) restoreButton.disabled = true;
  }

  handleExport() {
    const backup = {
      version: 1,
      exported_at: new Date().toISOString(),
      keys: {},
    };

    const keys = collectAvatarKeys();
    keys.forEach(key => {
      backup.keys[key] = parseStoredValue(localStorage.getItem(key));
    });

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = getBackupFilename();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);

    log('admin_action', {
      action: 'backup_export',
      key_count: keys.length,
    }, this.getCurrentUsername());

    toast(`Backup exportado com ${keys.length} chaves.`, 'success');
  }

  handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.resetImportState();
      toast('Apenas ficheiros .json são aceites.', 'error');
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      try {
        const parsed = JSON.parse(String(event.target?.result || ''));
        const backup = this.validateBackup(parsed);
        this.loadedBackup = backup;
        this.renderPreview(backup);
        const restoreButton = this.container.querySelector('[data-action="restore-backup"]');
        if (restoreButton) restoreButton.disabled = backup.summary.restorable === 0;
      } catch (error) {
        this.resetImportState();
        toast(error instanceof Error ? error.message : 'Não foi possível ler o backup.', 'error');
      }
    };

    reader.onerror = () => {
      this.resetImportState();
      toast('Erro ao ler o ficheiro selecionado.', 'error');
    };

    reader.readAsText(file);
  }

  validateBackup(parsed) {
    if (!isPlainObject(parsed)) {
      throw new Error('Backup inválido: estrutura JSON inválida.');
    }

    if (!Object.prototype.hasOwnProperty.call(parsed, 'version')) {
      throw new Error('Backup inválido: campo version em falta.');
    }

    if (!isPlainObject(parsed.keys)) {
      throw new Error('Backup inválido: campo keys em falta ou inválido.');
    }

    const filteredKeys = Object.fromEntries(
      Object.entries(parsed.keys).filter(([key]) => key.startsWith(STORAGE_PREFIX))
    );

    const summary = buildSummary(filteredKeys);
    if (summary.total === 0) {
      throw new Error('Backup inválido: não foram encontradas chaves avatar_rpg_.');
    }

    return {
      version: parsed.version,
      exported_at: parsed.exported_at || null,
      keys: filteredKeys,
      summary,
    };
  }

  renderPreview(backup) {
    const preview = this.container.querySelector('[data-role="preview"]');
    if (!preview) return;

    const typeRows = Object.entries(backup.summary.types)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `
        <span class="admin-backup-chip">
          <strong>${count}</strong>
          <span>${escapeHtml(PREVIEW_LABELS[type])}</span>
        </span>
      `)
      .join('');

    preview.classList.add('visible');
    preview.innerHTML = `
      <div class="preview-header admin-backup-preview-header">
        <span class="preview-count">
          <span class="valid">✓ ${backup.summary.total} chaves encontradas</span>
          <span> · ${backup.summary.restorable} restauráveis</span>
        </span>
      </div>
      <div class="admin-backup-summary">${typeRows}</div>
      <ul class="admin-backup-meta">
        <li><strong>Versão:</strong> ${escapeHtml(backup.version)}</li>
        <li><strong>Exportado em:</strong> ${escapeHtml(backup.exported_at || '—')}</li>
        <li><strong>Protegidas:</strong> ${backup.summary.skippedProtected} (sessão atual mantida)</li>
      </ul>
    `;
  }

  getSelectedMode() {
    return this.container.querySelector('input[name="backup-restore-mode"]:checked')?.value || 'replace';
  }

  clearAvatarKeys() {
    collectAvatarKeys().forEach(key => {
      if (!PROTECTED_KEYS.has(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  writeBackupKeys(keys) {
    Object.entries(keys).forEach(([key, value]) => {
      if (PROTECTED_KEYS.has(key)) return;
      localStorage.setItem(key, serializeStoredValue(value));
    });
  }

  async handleRestore() {
    if (!this.loadedBackup) {
      toast('Seleciona primeiro um ficheiro de backup válido.', 'warning');
      return;
    }

    const mode = this.getSelectedMode();
    const verb = mode === 'replace' ? 'substituir' : 'merge';
    const confirmed = await confirmDialog(
      `Isto irá ${verb} ${this.loadedBackup.summary.restorable} chaves. Continuar?`,
      { confirmText: 'Restaurar', cancelText: 'Cancelar' }
    );

    if (!confirmed) return;

    if (mode === 'replace') {
      this.clearAvatarKeys();
    }

    this.writeBackupKeys(this.loadedBackup.keys);

    log('admin_action', {
      action: 'backup_restore',
      mode,
      key_count: this.loadedBackup.summary.restorable,
    }, this.getCurrentUsername());

    toast('Backup restaurado com sucesso. A página será recarregada.', 'success', 2500);

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
}
