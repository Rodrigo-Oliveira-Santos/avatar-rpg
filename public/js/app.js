/**
 * Main Application
 * Global state and initialization
 */

import { Character } from './character/index.js';
import { AutoSave, exportToJSON, createFileInput } from './storage/index.js';
import { createElement, on, $, $$ } from './utils/dom.js';
import { ATTRIBUTES } from './utils/constants.js';
import { SkillTree } from './skills/index.js';
import { ItemList } from './items/index.js';
import { ShopPage } from './shop/index.js';
import { HubPage } from './hub/index.js';
import { AuthManager } from './auth/index.js';
import * as API from './api/index.js';

/**
 * Application Class
 */
export class App {
  constructor() {
    this.character = new Character();
    this.autoSave = null;
    this.skillTrees = {};
    this.itemList = null;
    this.shopPage = null;
    this.hubPage = null;
    this.authManager = null;
    this.activeTab = 'character';
    this.currentHp = 0;
    this.currentSp = 0;
    this.currentCp = 0;

    this.init();
  }

  async init() {
    this.showLoading(true);

    this.authManager = new AuthManager({
      onLoginSuccess: async () => {
        this.showLoading(true);
        await this.loadCharacter();
        this.setupUI();
        this.showLoading(false);
      },
      onLogout: () => {
        this.showLoading(false);
        this.authManager.showLogin();
      },
    });

    const session = await this.authManager.checkSession();
    if (!session) {
      this.showLoading(false);
      this.authManager.showLogin();
      return;
    }

    await this.loadCharacter();
    this.setupUI();
    this.showLoading(false);
    console.log('[App] Initialized');
  }

  async checkAuth() {
    return this.authManager ? this.authManager.checkSession() : null;
  }

  showLoginOverlay() {
    this.authManager?.showLogin();
  }

  async handleLogin() {
    await this.authManager?.handleLogin();
  }

  async loadCharacter() {
    try {
      const characters = await API.characters.list();
      if (characters?.length > 0) {
        const charData = characters[0];
        this.character.load(charData);
        const stats = this.character.getStats();
        this.currentHp = stats.maxHP;
        this.currentSp = stats.maxSP;
        this.currentCp = stats.maxCP;
        return;
      }
    } catch (err) {
      console.warn('[App] API unavailable, using localStorage:', err.message);
    }

    // Fallback: localStorage
    try {
      const saved = localStorage.getItem('avatar_rpg_character');
      if (saved) this.character.load(JSON.parse(saved));
    } catch (e) {
      console.error('[App] localStorage load failed:', e);
    }
    const stats = this.character.getStats();
    this.currentHp = stats.maxHP;
    this.currentSp = stats.maxSP;
    this.currentCp = stats.maxCP;
  }

  setupUI() {
    this.setupNavigation();
    this.renderAttributeControls();
    this.bindIdentityFields();
    this.bindHPControls();
    this.bindXPControls();
    this.bindImportExport();
    this.setupElementSelector();
    this.initSkillTrees();
    this.initItemList();
    this.initShop();
    this.initHub();

    this.character.subscribe((data) => this.updateUI(data));
    this.updateUI(this.character.getData());

    this.autoSave = new AutoSave(this.character, { debounceMs: 2000 });
  }

  showLoading(show) {
    const loader = $('#app-loader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
  }

  setupNavigation() {
    $$('.nav-btn').forEach(btn => {
      on(btn, 'click', () => this.switchTab(btn.dataset.page));
    });
    this.switchTab('character');
  }

  switchTab(pageId) {
    $$('.nav-btn').forEach(btn => btn.classList.toggle('on', btn.dataset.page === pageId));
    $$('.page').forEach(page => page.classList.toggle('on', page.id === `${pageId}-page`));
    this.activeTab = pageId;
  }

  renderAttributeControls() {
    const container = $('#attr-controls');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(ATTRIBUTES).forEach(([attr, info]) => {
      const row = createElement('div', { class: 'attr-row' });

      const decBtn = createElement('button', { class: 'attr-btn', textContent: '−' });
      const lbl = createElement('div', { class: `attr-lbl ${info.class}`, textContent: attr });
      const val = createElement('div', { class: 'attr-val', id: `attr-val-${attr}`, textContent: String(this.character.data.atributos[attr]) });
      const incBtn = createElement('button', { class: 'attr-btn', textContent: '+' });

      on(decBtn, 'click', () => this.character.updateAttribute(attr, -1));
      on(incBtn, 'click', () => {
        if (!this.character.updateAttribute(attr, 1)) {
          alert('Sem pontos disponíveis!');
        }
      });

      row.appendChild(decBtn);
      row.appendChild(lbl);
      row.appendChild(val);
      row.appendChild(incBtn);
      container.appendChild(row);
    });
  }

  bindIdentityFields() {
    const fields = [
      { id: 'char-name', path: ['identidade', 'nome'] },
      { id: 'char-subclass', path: ['identidade', 'subclasse'] },
      { id: 'char-age', path: ['identidade', 'idade'] },
      { id: 'char-gender', path: ['identidade', 'genero'] },
      { id: 'char-alignment', path: ['identidade', 'alinhamento'] },
      { id: 'char-notes', path: ['anotacoes'] },
    ];

    fields.forEach(({ id, path }) => {
      const el = $(`#${id}`);
      if (!el) return;

      let obj = this.character.data;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      el.value = obj[path[path.length - 1]] || '';

      on(el, 'input', () => {
        let target = this.character.data;
        for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
        target[path[path.length - 1]] = el.value;
        this.character.notify();
      });
    });
  }

  bindHPControls() {
    const hpDeltas = [
      { id: 'hp-dec-5', delta: -5 },
      { id: 'hp-dec-1', delta: -1 },
      { id: 'hp-inc-1', delta: +1 },
      { id: 'hp-inc-5', delta: +5 },
    ];

    hpDeltas.forEach(({ id, delta }) => {
      const btn = $(`#${id}`);
      if (!btn) return;
      on(btn, 'click', () => {
        const max = this.character.getStats().maxHP;
        this.currentHp = Math.max(0, Math.min(max, this.currentHp + delta));
        this.updateCombatBars();
      });
    });

    const maxBtn = $('#hp-max');
    if (maxBtn) {
      on(maxBtn, 'click', () => {
        const stats = this.character.getStats();
        this.currentHp = stats.maxHP;
        this.currentSp = stats.maxSP;
        this.currentCp = stats.maxCP;
        this.updateCombatBars();
      });
    }
  }

  bindXPControls() {
    const addXpBtn = $('[data-action="add-xp"]');
    if (addXpBtn) {
      on(addXpBtn, 'click', () => {
        const input = prompt('Quanto XP adicionar?');
        const amount = parseInt(input, 10);
        if (!isNaN(amount) && amount > 0) this.character.addXP(amount);
      });
    }
  }

  bindImportExport() {
    const exportBtn = $('[data-action="export"]');
    const importBtn = $('[data-action="import"]');
    const resetBtn = $('[data-action="reset"]');

    if (exportBtn) {
      on(exportBtn, 'click', () => exportToJSON(this.character.getData()));
    }

    if (importBtn) {
      on(importBtn, 'click', () => {
        createFileInput((err, data) => {
          if (err) {
            alert(`Import falhou: ${err.message}`);
          } else {
            this.character.load(data);
            const stats = this.character.getStats();
            this.currentHp = stats.maxHP;
            this.currentSp = stats.maxSP;
            this.currentCp = stats.maxCP;
            this.renderAttributeControls();
            this.bindIdentityFields();
            alert('Personagem importado!');
          }
        });
      });
    }

    if (resetBtn) {
      on(resetBtn, 'click', () => {
        if (confirm('Resetar personagem? Esta ação não pode ser desfeita.')) {
          this.character.reset();
          const stats = this.character.getStats();
          this.currentHp = stats.maxHP;
          this.currentSp = stats.maxSP;
          this.currentCp = stats.maxCP;
          this.renderAttributeControls();
          this.bindIdentityFields();
        }
      });
    }
  }

  setupElementSelector() {
    const elemButtons = $$('.esbtn');
    const current = this.character.data.identidade.elemento;
    elemButtons.forEach(btn => {
      btn.classList.toggle('on', btn.dataset.element === current);
      on(btn, 'click', () => {
        this.character.data.identidade.elemento = btn.dataset.element;
        this.character.notify();
        elemButtons.forEach(b => b.classList.toggle('on', b === btn));
      });
    });
  }

  initSkillTrees() {
    ['fire', 'water', 'earth', 'air', 'none'].forEach(element => {
      const container = $(`#${element}-skills-container`);
      if (container) {
        this.skillTrees[element] = new SkillTree(element, this.character, container);
      }
    });
  }

  initItemList() {
    const container = $('#items-container');
    if (container) {
      this.itemList = new ItemList(this.character, container);
    }
  }

  initShop() {
    const container = $('#shop-container');
    if (container) {
      this.shopPage = new ShopPage(container);
    }
  }

  initHub() {
    const container = $('#hub-container');
    if (container) {
      this.hubPage = new HubPage(container);
    }
  }

  updateUI(data) {
    const stats = this.character.getStats();

    // Level and available points
    const levelEl = $('#char-level');
    if (levelEl) levelEl.textContent = data.identidade.nivel;

    const pointsEl = $('#avail-points');
    if (pointsEl) pointsEl.textContent = data.pontos_disponiveis;

    // Sidebar stats
    const sideStats = {
      '#stat-hp': stats.maxHP,
      '#stat-sp': stats.maxSP,
      '#stat-cp': stats.maxCP,
      '#stat-def': stats.defense,
      '#stat-dodge': stats.dodge,
    };
    Object.entries(sideStats).forEach(([sel, val]) => {
      const el = $(sel);
      if (el) el.textContent = val;
    });

    // Attribute values
    Object.keys(data.atributos).forEach(attr => {
      const el = $(`#attr-val-${attr}`);
      if (el) el.textContent = data.atributos[attr];
    });

    // XP bar
    const xpProgress = this.character.getXPProgress();
    const xpText = $('#xp-text');
    const xpFill = $('#xp-fill');
    if (xpText) xpText.textContent = `${data.identidade.xp_atual} / ${xpProgress.nextLevelXP}`;
    if (xpFill) xpFill.style.width = `${xpProgress.percentage}%`;

    // Sub-skill slots
    const slotsEl = $('#slots-info');
    if (slotsEl) {
      const slots = this.character.getSlots();
      slotsEl.textContent = `${slots.available} / ${slots.total}`;
    }

    // Cap current values to new max
    if (this.currentHp > stats.maxHP) this.currentHp = stats.maxHP;
    if (this.currentSp > stats.maxSP) this.currentSp = stats.maxSP;
    if (this.currentCp > stats.maxCP) this.currentCp = stats.maxCP;
    this.updateCombatBars();

    // Active skills
    this.updateActiveSkills(data);

    // Refresh skill trees
    Object.values(this.skillTrees).forEach(tree => tree.refresh());
  }

  updateCombatBars() {
    const stats = this.character.getStats();

    const bars = [
      { valId: 'combat-hp', maxId: 'combat-hp-max', barId: 'combat-hp-bar', current: this.currentHp, max: stats.maxHP },
      { valId: 'combat-sp', maxId: 'combat-sp-max', barId: 'combat-sp-bar', current: this.currentSp, max: stats.maxSP },
      { valId: 'combat-cp', maxId: 'combat-cp-max', barId: 'combat-cp-bar', current: this.currentCp, max: stats.maxCP },
      { valId: 'combat-def', current: stats.defense, max: null },
      { valId: 'combat-dodge', current: stats.dodge, max: null },
    ];

    bars.forEach(({ valId, maxId, barId, current, max }) => {
      const valEl = $(`#${valId}`);
      if (valEl) valEl.textContent = current;

      if (maxId) {
        const maxEl = $(`#${maxId}`);
        if (maxEl) maxEl.textContent = `/ ${max}`;
      }

      if (barId) {
        const barEl = $(`#${barId}`);
        if (barEl) barEl.style.width = `${max > 0 ? (current / max) * 100 : 0}%`;
      }
    });
  }

  updateActiveSkills(data) {
    const container = $('#active-skills');
    if (!container) return;

    const active = Object.entries(data.habilidades || {}).filter(([, s]) => s.active);
    if (active.length === 0) {
      container.innerHTML = '<p style="color: var(--text2); font-size: 11px;">Nenhuma habilidade ativa selecionada.</p>';
      return;
    }
    container.innerHTML = active.map(([id]) => `<span class="skill-chip">${id}</span>`).join('');
  }

  getCharacter() {
    return this.character;
  }
}
