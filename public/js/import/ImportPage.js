/**
 * Import Page
 * GM-only UI for importing skills and items from JSON files
 */

import { parseAndValidate } from './validators.js';
import { saveImportedSkills, saveImportedItems, clearImported, getImportStats } from './storage.js';
import { createElement, on, $ } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { log } from '../admin/LogService.js';

const MAX_PREVIEW = 20;

export class ImportPage {
  constructor(container, authManager = null) {
    this.container = container;
    this.authManager = authManager;
    this.skillsPreview = null;
    this.itemsPreview = null;
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    const stats = getImportStats();

    const html = `
      <div class="import-page-content">
        <div class="import-header">
          <h2>📥 Importar Dados</h2>
          <p>Upload de ficheiros JSON para popular skills e itens do jogo</p>
        </div>

        <div class="import-stats" id="import-stats">
          ${this.renderStats(stats)}
        </div>

        <!-- Skills Section -->
        <div class="import-section" id="import-skills-section">
          <h3><span class="section-icon">⚡</span> Importar Skills</h3>
          <div class="drop-zone" id="skills-drop-zone">
            <div class="drop-zone-icon">📄</div>
            <div class="drop-zone-text">
              Arrasta um ficheiro JSON aqui ou <strong>clica para selecionar</strong>
            </div>
            <input type="file" accept=".json" id="skills-file-input">
          </div>
          <div class="import-preview" id="skills-preview"></div>
          <div class="import-errors" id="skills-errors"></div>
          <div class="import-actions" id="skills-actions" style="display:none">
            <button class="import-btn primary" id="skills-import-btn" disabled>Importar Skills</button>
            <button class="import-btn secondary" id="skills-cancel-btn">Cancelar</button>
          </div>
        </div>

        <!-- Items Section -->
        <div class="import-section" id="import-items-section">
          <h3><span class="section-icon">🎒</span> Importar Itens</h3>
          <div class="drop-zone" id="items-drop-zone">
            <div class="drop-zone-icon">📄</div>
            <div class="drop-zone-text">
              Arrasta um ficheiro JSON aqui ou <strong>clica para selecionar</strong>
            </div>
            <input type="file" accept=".json" id="items-file-input">
          </div>
          <div class="import-preview" id="items-preview"></div>
          <div class="import-errors" id="items-errors"></div>
          <div class="import-actions" id="items-actions" style="display:none">
            <button class="import-btn primary" id="items-import-btn" disabled>Importar Itens</button>
            <button class="import-btn secondary" id="items-cancel-btn">Cancelar</button>
          </div>
        </div>

        <!-- Clear Section -->
        <div class="import-clear-section">
          <h4>⚠️ Gestão de Dados Importados</h4>
          <div class="clear-actions">
            <button class="import-btn danger" id="clear-skills-btn">Limpar Skills</button>
            <button class="import-btn danger" id="clear-items-btn">Limpar Itens</button>
            <button class="import-btn danger" id="clear-all-btn">Limpar Tudo</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  renderStats(stats) {
    const skillTotal = Object.values(stats.skills).reduce((a, b) => a + b, 0);
    const elements = ['fire', 'water', 'earth', 'air', 'none'];
    const elementLabels = { fire: '🔥', water: '🌊', earth: '🪨', air: '🌀', none: '⚔️' };

    let html = `
      <div class="import-stat">
        <div class="stat-value">${skillTotal}</div>
        <div class="stat-label">Skills</div>
      </div>
      <div class="import-stat">
        <div class="stat-value">${stats.items}</div>
        <div class="stat-label">Itens</div>
      </div>
    `;

    elements.forEach(el => {
      if (stats.skills[el]) {
        html += `
          <div class="import-stat">
            <div class="stat-value">${elementLabels[el]} ${stats.skills[el]}</div>
            <div class="stat-label">${el}</div>
          </div>
        `;
      }
    });

    return html;
  }

  bindEvents() {
    this.setupDropZone('skills');
    this.setupDropZone('items');
    this.setupClearButtons();
  }

  setupDropZone(type) {
    const dropZone = $(`#${type}-drop-zone`);
    const fileInput = $(`#${type}-file-input`);
    if (!dropZone || !fileInput) return;

    // Click to select file
    on(dropZone, 'click', () => fileInput.click());
    on(fileInput, 'change', (e) => {
      if (e.target.files[0]) this.handleFile(e.target.files[0], type);
    });

    // Drag & drop
    on(dropZone, 'dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    on(dropZone, 'dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    on(dropZone, 'drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer?.files[0];
      if (file) this.handleFile(file, type);
    });

    // Cancel button
    const cancelBtn = $(`#${type}-cancel-btn`);
    if (cancelBtn) {
      on(cancelBtn, 'click', () => this.resetSection(type));
    }

    // Import button
    const importBtn = $(`#${type}-import-btn`);
    if (importBtn) {
      on(importBtn, 'click', () => this.doImport(type));
    }
  }

  setupClearButtons() {
    const clearSkills = $('#clear-skills-btn');
    const clearItems = $('#clear-items-btn');
    const clearAll = $('#clear-all-btn');

    if (clearSkills) {
      on(clearSkills, 'click', async () => {
        if (await confirmDialog('Limpar todas as skills importadas?')) {
          clearImported('skills');
          toast('Skills importadas removidas', 'success');
          this.refreshStats();
        }
      });
    }
    if (clearItems) {
      on(clearItems, 'click', async () => {
        if (await confirmDialog('Limpar todos os itens importados?')) {
          clearImported('items');
          toast('Itens importados removidos', 'success');
          this.refreshStats();
        }
      });
    }
    if (clearAll) {
      on(clearAll, 'click', async () => {
        if (await confirmDialog('Limpar TODOS os dados importados (skills + itens)?')) {
          clearImported('all');
          toast('Todos os dados importados removidos', 'success');
          this.refreshStats();
        }
      });
    }
  }

  handleFile(file, type) {
    if (!file.name.endsWith('.json')) {
      toast('Apenas ficheiros .json são aceites', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const result = parseAndValidate(content, type);

      if (type === 'skills') {
        this.skillsPreview = result;
      } else {
        this.itemsPreview = result;
      }

      this.showPreview(type, result);
    };
    reader.readAsText(file);
  }

  showPreview(type, result) {
    const previewEl = $(`#${type}-preview`);
    const errorsEl = $(`#${type}-errors`);
    const actionsEl = $(`#${type}-actions`);
    const importBtn = $(`#${type}-import-btn`);

    if (!previewEl) return;

    // Show preview table
    previewEl.classList.add('visible');
    actionsEl.style.display = 'flex';

    const records = result.records;
    const shown = records.slice(0, MAX_PREVIEW);

    let tableHtml = '<div class="preview-header"><span class="preview-count">';
    if (result.valid) {
      tableHtml += `<span class="valid">✓ ${records.length} registos válidos</span>`;
    } else {
      const validCount = records.length - result.errors.length;
      tableHtml += `<span class="valid">${records.length} registos</span> · <span class="invalid">${result.errors.length} erros</span>`;
    }
    tableHtml += '</span></div>';

    if (type === 'skills') {
      tableHtml += `
        <table class="preview-table">
          <thead><tr><th>Nome</th><th>Elemento</th><th>Categoria</th><th>Tier</th></tr></thead>
          <tbody>
            ${shown.map(s => `<tr><td>${s.name || '—'}</td><td>${s.element || '—'}</td><td>${s.category || '—'}</td><td>${s.tier || '—'}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableHtml += `
        <table class="preview-table">
          <thead><tr><th>Nome</th><th>Tipo</th><th>Raridade</th><th>Preço</th></tr></thead>
          <tbody>
            ${shown.map(i => `<tr><td>${i.name || '—'}</td><td>${i.type || '—'}</td><td>${i.rarity || '—'}</td><td>${i.price ?? '—'}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
    }

    if (records.length > MAX_PREVIEW) {
      tableHtml += `<div class="preview-more">... e mais ${records.length - MAX_PREVIEW} registos</div>`;
    }

    previewEl.innerHTML = tableHtml;

    // Show errors if any
    if (result.errors.length > 0) {
      errorsEl.classList.add('visible');
      errorsEl.innerHTML = `
        <div class="error-title">⚠️ Erros de Validação (${result.errors.length})</div>
        ${result.errors.slice(0, 20).map(e => `<div class="error-item">${e}</div>`).join('')}
        ${result.errors.length > 20 ? `<div class="error-item">... e mais ${result.errors.length - 20} erros</div>` : ''}
      `;
    } else {
      errorsEl.classList.remove('visible');
      errorsEl.innerHTML = '';
    }

    // Enable/disable import button
    importBtn.disabled = !result.valid;
  }

  async doImport(type) {
    const data = type === 'skills' ? this.skillsPreview : this.itemsPreview;
    if (!data || !data.valid) return;

    if (type === 'skills') {
      // Group by element and save
      const byElement = {};
      data.records.forEach(skill => {
        const el = skill.element;
        if (!byElement[el]) byElement[el] = [];
        byElement[el].push(skill);
      });

      Object.entries(byElement).forEach(([element, skills]) => {
        saveImportedSkills(element, skills);
      });

      log('import', { type: 'skills', count: data.records.length }, this.getCurrentUsername());
      toast(`${data.records.length} skills importadas com sucesso!`, 'success');
    } else {
      saveImportedItems(data.records);
      log('import', { type: 'items', count: data.records.length }, this.getCurrentUsername());
      toast(`${data.records.length} itens importados com sucesso!`, 'success');
    }

    this.resetSection(type);
    this.refreshStats();
  }

  getCurrentUsername() {
    if (this.authManager?.getUser()?.username) {
      return this.authManager.getUser().username;
    }

    try {
      return JSON.parse(localStorage.getItem('avatar_rpg_user') || 'null')?.username || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  resetSection(type) {
    const previewEl = $(`#${type}-preview`);
    const errorsEl = $(`#${type}-errors`);
    const actionsEl = $(`#${type}-actions`);
    const fileInput = $(`#${type}-file-input`);

    if (previewEl) {
      previewEl.classList.remove('visible');
      previewEl.innerHTML = '';
    }
    if (errorsEl) {
      errorsEl.classList.remove('visible');
      errorsEl.innerHTML = '';
    }
    if (actionsEl) actionsEl.style.display = 'none';
    if (fileInput) fileInput.value = '';

    if (type === 'skills') this.skillsPreview = null;
    else this.itemsPreview = null;
  }

  refreshStats() {
    const statsEl = $('#import-stats');
    if (statsEl) {
      statsEl.innerHTML = this.renderStats(getImportStats());
    }
  }
}
