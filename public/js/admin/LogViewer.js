/**
 * Log Viewer
 * Admin UI for browsing and clearing system logs.
 */

import { getLogs, clearLogs, getLogCount } from './LogService.js';
import { toast, confirmDialog } from '../utils/toast.js';

const PAGE_SIZE = 25;
const ACTION_OPTIONS = [
  { value: '', label: 'Todas as ações' },
  { value: 'purchase', label: 'purchase' },
  { value: 'gm_reward', label: 'gm_reward' },
  { value: 'import', label: 'import' },
  { value: 'admin_action', label: 'admin_action' },
  { value: 'login', label: 'login' },
  { value: 'trade', label: 'trade' },
  { value: 'loot_delivery', label: 'loot_delivery' },
];

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function truncateText(value, maxLength = 100) {
  const text = String(value ?? '');
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(',', '');
}

function normalizeActor(value) {
  return String(value || '').trim().toLowerCase();
}

function getCurrentUserRole() {
  try {
    return JSON.parse(localStorage.getItem('avatar_rpg_user') || 'null')?.role || '';
  } catch {
    return '';
  }
}

function formatAdminActionDetails(details = {}) {
  const parts = [];

  if (details.action) parts.push(`Ação: ${details.action}`);
  if (details.target) parts.push(`Alvo: ${details.target}`);
  if (details.from || details.to) {
    parts.push(`De: ${details.from ?? '—'} → Para: ${details.to ?? '—'}`);
  }

  return parts.join(', ');
}

function formatDetails(action, details = {}) {
  if (!details || typeof details !== 'object') {
    return '—';
  }

  const formattedByAction = {
    purchase: () => `Item: ${details.item ?? details.name ?? '—'}, Preço: ${details.price ?? '—'}g`,
    gm_reward: () => `Tipo: ${details.type ?? '—'}, Valor: ${details.amount ?? '—'}, Alvo: ${details.target ?? '—'}`,
    import: () => `Tipo: ${details.type ?? '—'}, Registos: ${details.count ?? '—'}`,
    admin_action: () => formatAdminActionDetails(details),
    trade: () => `De: ${details.from ?? '—'}, Para: ${details.to ?? '—'}, Status: ${details.status ?? '—'}`,
    loot_delivery: () => `Item: ${details.item ?? '—'}, Qtd: ${details.quantity ?? '—'}, Alvo: ${details.target ?? '—'}`,
  };

  const formatter = formattedByAction[action];
  const text = typeof formatter === 'function' ? formatter() : JSON.stringify(details);
  return truncateText(text || '—');
}

export class LogViewer {
  constructor(container) {
    this.container = container;
    this.page = 1;
    this.filters = {
      action: '',
      actor: '',
    };
  }

  getFilteredLogs() {
    const action = this.filters.action || undefined;
    const actor = normalizeActor(this.filters.actor);

    return getLogs({ action, actor: actor || undefined })
      .slice()
      .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
  }

  renderRows(logs) {
    if (logs.length === 0) {
      return `
        <tr>
          <td colspan="4" class="admin-logs-empty">Nenhum log encontrado</td>
        </tr>
      `;
    }

    return logs.map(entry => {
      const detailsText = formatDetails(entry.action, entry.details);
      return `
        <tr>
          <td>${escapeHtml(formatDateTime(entry.timestamp))}</td>
          <td>
            <span class="admin-log-badge ${escapeHtml(entry.action)}">${escapeHtml(entry.action)}</span>
          </td>
          <td>${escapeHtml(entry.actor || '—')}</td>
          <td class="admin-log-details" title="${escapeHtml(detailsText)}">${escapeHtml(detailsText)}</td>
        </tr>
      `;
    }).join('');
  }

  bindEvents() {
    const form = this.container.querySelector('[data-log-filters]');
    const clearFiltersButton = this.container.querySelector('[data-clear-filters]');
    const previousButton = this.container.querySelector('[data-page-prev]');
    const nextButton = this.container.querySelector('[data-page-next]');
    const clearLogsButton = this.container.querySelector('[data-clear-logs]');

    form?.addEventListener('submit', event => {
      event.preventDefault();
      const actionInput = form.elements.namedItem('action');
      const actorInput = form.elements.namedItem('actor');
      this.filters.action = actionInput?.value || '';
      this.filters.actor = actorInput?.value || '';
      this.page = 1;
      this.render();
    });

    clearFiltersButton?.addEventListener('click', () => {
      this.filters = { action: '', actor: '' };
      this.page = 1;
      this.render();
    });

    previousButton?.addEventListener('click', () => {
      this.page = Math.max(1, this.page - 1);
      this.render();
    });

    nextButton?.addEventListener('click', () => {
      this.page += 1;
      this.render();
    });

    clearLogsButton?.addEventListener('click', async () => {
      const confirmed = await confirmDialog('Queres limpar todos os logs do sistema?', {
        confirmText: 'Limpar logs',
        cancelText: 'Cancelar',
      });

      if (!confirmed) return;

      clearLogs();
      this.page = 1;
      toast('Logs removidos com sucesso.', 'success');
      this.render();
    });
  }

  render() {
    const allLogCount = getLogCount();
    const filteredLogs = this.getFilteredLogs();
    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
    this.page = Math.min(Math.max(1, this.page), totalPages);

    const start = (this.page - 1) * PAGE_SIZE;
    const visibleLogs = filteredLogs.slice(start, start + PAGE_SIZE);
    const showClearButton = getCurrentUserRole() === 'admin';
    const statsText = filteredLogs.length === allLogCount
      ? `Total: ${allLogCount} registos`
      : `Total: ${filteredLogs.length} registos`;

    this.container.innerHTML = `
      <section class="admin-subsection admin-log-viewer">
        <div class="admin-subsection-header">
          <div>
            <h3>📋 Logs do Sistema</h3>
            <p>Consulta ações recentes e atividades administrativas.</p>
          </div>
          ${showClearButton ? '<button type="button" class="admin-toolbar-btn danger" data-clear-logs>Limpar Logs</button>' : ''}
        </div>

        <form class="admin-log-filters" data-log-filters>
          <label class="admin-log-field">
            <span>Ação</span>
            <select name="action" class="admin-log-input">
              ${ACTION_OPTIONS.map(option => `
                <option value="${escapeHtml(option.value)}"${option.value === this.filters.action ? ' selected' : ''}>${escapeHtml(option.label)}</option>
              `).join('')}
            </select>
          </label>

          <label class="admin-log-field admin-log-field-grow">
            <span>Ator</span>
            <input
              type="text"
              name="actor"
              class="admin-log-input"
              placeholder="Username"
              value="${escapeHtml(this.filters.actor)}"
            >
          </label>

          <div class="admin-log-filter-actions">
            <button type="submit" class="admin-toolbar-btn">Filtrar</button>
            <button type="button" class="admin-toolbar-btn muted" data-clear-filters>Limpar Filtros</button>
          </div>
        </form>

        <div class="admin-log-toolbar">
          <div class="admin-log-stats">${escapeHtml(statsText)}</div>
        </div>

        <div class="admin-table-wrap admin-log-table-wrap">
          <table class="admin-users-table admin-log-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Ação</th>
                <th>Ator</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              ${this.renderRows(visibleLogs)}
            </tbody>
          </table>
        </div>

        <div class="admin-log-pagination">
          <button type="button" class="admin-toolbar-btn muted" data-page-prev ${this.page <= 1 ? 'disabled' : ''}>← Anterior</button>
          <span>Página ${this.page} de ${totalPages}</span>
          <button type="button" class="admin-toolbar-btn muted" data-page-next ${this.page >= totalPages ? 'disabled' : ''}>Seguinte →</button>
        </div>
      </section>
    `;

    this.bindEvents();
  }
}
