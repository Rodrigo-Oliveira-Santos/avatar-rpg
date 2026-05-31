/**
 * Main Application
 * Global state and initialization
 */

import { Character, getSubclassesForElement } from './character/index.js';
import { AutoSave, exportToJSON, createFileInput } from './storage/index.js';
import { createElement, on, $, $$ } from './utils/dom.js';
import { ATTRIBUTES, NATION_CURRENCIES } from './utils/constants.js';
import { toast, confirmDialog, promptDialog } from './utils/toast.js';
import { SkillTree } from './skills/index.js';
import { InventoryPage } from './items/index.js';
import { unequipItem } from './items/inventory.js';
import { ShopPage } from './shop/index.js';
import { HubPage } from './hub/index.js';
import { AuthManager } from './auth/index.js';
import { AdminPanel } from './admin/index.js';
import { ImportPage } from './import/index.js';
import * as API from './api/index.js';

const ELEMENT_NAMES = {
  fire: 'Fogo',
  water: 'Água',
  earth: 'Terra',
  air: 'Ar',
  none: 'Sem Dobra',
};

const REQUIREMENT_LABELS = {
  nivel: 'Nível',
  FOR: 'FOR',
  AGI: 'AGI',
  CHI: 'CHI',
  PER: 'PER',
  RES: 'RES',
  ESP: 'ESP',
};

/**
 * Application Class
 */
export class App {
  constructor() {
    this.character = new Character();
    this.autoSave = null;
    this.skillTrees = {};
    this.inventoryPage = null;
    this.shopPage = null;
    this.hubPage = null;
    this.importPage = null;
    this.adminPage = null;
    this.authManager = null;
    this.activeTab = 'character';
    this.currentHp = 0;
    this.currentSp = 0;
    this.currentCp = 0;
    this.subclassPickerOpen = false;

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

    // Fallback: per-user localStorage
    try {
      const saved = API.characters.loadLocal();
      if (saved) {
        this.character.load(saved);
      } else {
        // First login: check for preset
        const user = this.authManager.getUser();
        const preset = user ? API.characters.getPreset(user.username) : null;
        if (preset) {
          this.character.load(preset);
          API.characters.saveLocal(this.character.serialize());
        }
      }
    } catch (e) {
      console.error('[App] localStorage load failed:', e);
    }
    const stats = this.character.getStats();
    this.currentHp = stats.maxHP;
    this.currentSp = stats.maxSP;
    this.currentCp = stats.maxCP;
  }

  setupUI() {
    // Prevent duplicate setup (re-login scenario)
    if (this._uiInitialized) {
      // Just reload character data and refresh UI
      this.initImport();
      this.initAdmin();
      this.updateUI(this.character.getData());
      this.setupElementSelector();
      return;
    }
    this._uiInitialized = true;

    this.setupNavigation();
    this.setupLogout();
    this.renderAttributeControls();
    this.bindIdentityFields();
    this.bindHPControls();
    this.bindXPControls();
    this.bindImportExport();
    this.setupElementSelector();
    this.initSkillTrees();
    this.initInventory();
    this.initShop();
    this.initHub();
    this.initImport();
    this.initAdmin();

    this.character.subscribe((data) => this.updateUI(data));
    this.updateUI(this.character.getData());

    this.autoSave = new AutoSave(this.character, { debounceMs: 2000 });
  }

  showLoading(show) {
    const loader = $('#app-loader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
  }

  setupNavigation() {
    $$('.nav-btn[data-page]').forEach(btn => {
      on(btn, 'click', () => this.switchTab(btn.dataset.page));
    });
    this.switchTab('character');
  }

  setupLogout() {
    const logoutBtn = $('#logout-btn');
    if (logoutBtn) {
      on(logoutBtn, 'click', async () => {
        const confirmed = await confirmDialog('Sair da sessão?');
        if (confirmed) {
          this.authManager?.logout();
        }
      });
    }
  }

  switchTab(pageId) {
    $$('.nav-btn[data-page]').forEach(btn => btn.classList.toggle('on', btn.dataset.page === pageId));
    $$('.page').forEach(page => page.classList.toggle('on', page.id === `${pageId}-page`));
    this.activeTab = pageId;

    if (pageId === 'shop') {
      this.shopPage?.refresh();
    }
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
          toast('Sem pontos disponíveis!', 'warning');
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

    // SP (Spirit) controls
    const spDeltas = [
      { id: 'sp-dec-5', delta: -5 },
      { id: 'sp-dec-1', delta: -1 },
      { id: 'sp-inc-1', delta: +1 },
      { id: 'sp-inc-5', delta: +5 },
    ];

    spDeltas.forEach(({ id, delta }) => {
      const btn = $(`#${id}`);
      if (!btn) return;
      on(btn, 'click', () => {
        const max = this.character.getStats().maxSP;
        this.currentSp = Math.max(0, Math.min(max, this.currentSp + delta));
        this.updateCombatBars();
      });
    });

    // CP (Chi) controls
    const cpDeltas = [
      { id: 'cp-dec-5', delta: -5 },
      { id: 'cp-dec-1', delta: -1 },
      { id: 'cp-inc-1', delta: +1 },
      { id: 'cp-inc-5', delta: +5 },
    ];

    cpDeltas.forEach(({ id, delta }) => {
      const btn = $(`#${id}`);
      if (!btn) return;
      on(btn, 'click', () => {
        const max = this.character.getStats().maxCP;
        this.currentCp = Math.max(0, Math.min(max, this.currentCp + delta));
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
      on(addXpBtn, 'click', async () => {
        const input = await promptDialog('Quanto XP adicionar?', { placeholder: 'Ex: 100' });
        const amount = parseInt(input, 10);
        if (!isNaN(amount) && amount > 0) {
          this.character.addXP(amount);
          toast(`+${amount} XP adicionado!`, 'success');
        }
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
            toast(`Import falhou: ${err.message}`, 'error');
          } else {
            this.character.load(data);
            const stats = this.character.getStats();
            this.currentHp = stats.maxHP;
            this.currentSp = stats.maxSP;
            this.currentCp = stats.maxCP;
            this.renderAttributeControls();
            this.bindIdentityFields();
            toast('Personagem importado com sucesso!', 'success');
          }
        });
      });
    }

    if (resetBtn) {
      on(resetBtn, 'click', async () => {
        const confirmed = await confirmDialog('Resetar personagem? Esta ação não pode ser desfeita.');
        if (confirmed) {
          this.character.reset();
          const stats = this.character.getStats();
          this.currentHp = stats.maxHP;
          this.currentSp = stats.maxSP;
          this.currentCp = stats.maxCP;
          this.renderAttributeControls();
          this.bindIdentityFields();
          toast('Personagem resetado.', 'info');
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
        this.subclassPickerOpen = false;
        this.character.notify();
        elemButtons.forEach(b => b.classList.toggle('on', b === btn));
        this.updateElementTabs(btn.dataset.element);
      });
    });
    this.updateElementTabs(current);
  }

  updateElementTabs(element) {
    const elementPages = ['fire', 'water', 'earth', 'air', 'none'];
    elementPages.forEach(el => {
      const tab = $(`.nav-btn.${el}`);
      if (tab) {
        // Show the selected element + "none" (sem dobra) always visible
        const visible = (el === element || el === 'none');
        tab.style.display = visible ? '' : 'none';
      }
    });
  }

  formatSubclassBonus(bonus = {}) {
    return Object.entries(bonus).map(([attr, value]) => `${attr} +${value}`);
  }

  createRequirementChips(subclass, totalAttributes, level) {
    return Object.entries(subclass.requirements || {}).map(([key, requiredValue]) => {
      const currentValue = key === 'nivel' ? level : (totalAttributes[key] || 0);
      const met = currentValue >= requiredValue;
      return createElement('span', {
        class: met ? 'met' : 'unmet',
        textContent: `${REQUIREMENT_LABELS[key] || key}: ${requiredValue}`,
      });
    });
  }

  async promptSubclassUnlock(subclass) {
    const confirmed = await confirmDialog(
      `Desbloquear ${subclass.name}? Esta escolha é permanente.`,
      { confirmText: 'Desbloquear' }
    );

    if (!confirmed) return;

    if (this.character.unlockSubclass(subclass.id)) {
      this.subclassPickerOpen = false;
      toast(`${subclass.name} desbloqueada!`, 'success');
      return;
    }

    toast('Não cumpres os requisitos para esta subclasse.', 'warning');
  }

  renderSubclassSection() {
    const container = $('#char-subclass-section');
    if (!container) return;

    const data = this.character.getData();
    const currentSubclass = data.identidade.subclasse?.trim();
    const currentDefinition = this.character.getCurrentSubclassDefinition();
    const bonus = this.character.getSubclassBonus();
    const totalAttributes = this.character.getTotalAttributes();
    const level = data.identidade.nivel || 0;
    const element = data.identidade.elemento;
    const allSubclasses = getSubclassesForElement(element);
    const eligibleSubclasses = this.character.getAvailableSubclasses();

    container.innerHTML = '';

    if (currentSubclass) {
      const currentCard = createElement('div', { class: 'subclass-current' });
      const titleWrap = createElement('div', { class: 'subclass-current-title' }, [
        createElement('div', {}, [
          createElement('h4', { textContent: currentDefinition?.name || currentSubclass }),
          createElement('p', { textContent: currentDefinition?.description || 'Subclasse legada importada. Sem bónus automático definido.' }),
        ]),
        createElement('span', { className: 'subclass-note', textContent: 'Escolha permanente' }),
      ]);
      currentCard.appendChild(titleWrap);

      const bonusEntries = this.formatSubclassBonus(bonus);
      if (bonusEntries.length) {
        const bonusWrap = createElement('div', { class: 'subclass-bonus' });
        bonusEntries.forEach(entry => bonusWrap.appendChild(createElement('span', { textContent: entry })));
        currentCard.appendChild(bonusWrap);
      }

      container.appendChild(currentCard);
      return;
    }

    const emptyState = createElement('div', { class: 'subclass-empty' }, [
      createElement('p', { textContent: `Subclasses de ${ELEMENT_NAMES[element] || 'Personagem'} são desbloqueadas ao cumprir requisitos.` }),
    ]);

    if (!allSubclasses.length) {
      emptyState.appendChild(createElement('p', { className: 'subclass-note', textContent: 'Ainda não existem subclasses disponíveis para este elemento.' }));
      container.appendChild(emptyState);
      return;
    }

    const toggleButton = createElement('button', {
      className: 'xp-btn',
      textContent: eligibleSubclasses.length ? 'Escolher Subclasse' : 'Ver Requisitos',
    });
    on(toggleButton, 'click', () => {
      this.subclassPickerOpen = !this.subclassPickerOpen;
      this.renderSubclassSection();
    });
    emptyState.appendChild(toggleButton);

    if (!eligibleSubclasses.length) {
      emptyState.appendChild(createElement('p', {
        className: 'subclass-note',
        textContent: 'Ainda não cumpres os requisitos para desbloquear uma subclasse.',
      }));
    }

    container.appendChild(emptyState);

    if (!this.subclassPickerOpen) return;

    const picker = createElement('div', { class: 'subclass-picker' }, [
      createElement('h4', { textContent: 'Subclasses disponíveis' }),
    ]);

    allSubclasses.forEach(subclass => {
      const canUnlock = this.character.canUnlockSubclass(subclass);
      const option = createElement('div', {
        class: `subclass-option ${canUnlock ? '' : 'subclass-locked'}`.trim(),
      });

      option.appendChild(createElement('div', { class: 'subclass-option-header' }, [
        createElement('div', {}, [
          createElement('h4', { textContent: subclass.name }),
          createElement('p', { textContent: subclass.description }),
        ]),
      ]));

      const requirements = createElement('div', { class: 'subclass-requirements' });
      this.createRequirementChips(subclass, totalAttributes, level)
        .forEach(chip => requirements.appendChild(chip));
      option.appendChild(requirements);

      const bonusWrap = createElement('div', { class: 'subclass-bonus' });
      this.formatSubclassBonus(subclass.bonus)
        .forEach(entry => bonusWrap.appendChild(createElement('span', { textContent: entry })));
      option.appendChild(bonusWrap);

      if (canUnlock) {
        const unlockButton = createElement('button', {
          className: 'xp-btn',
          textContent: 'Desbloquear',
        });
        on(unlockButton, 'click', () => this.promptSubclassUnlock(subclass));
        option.appendChild(createElement('div', { class: 'subclass-actions' }, [unlockButton]));
      }

      picker.appendChild(option);
    });

    container.appendChild(picker);
  }

  initSkillTrees() {
    ['fire', 'water', 'earth', 'air', 'none'].forEach(element => {
      const container = $(`#${element}-skills-container`);
      if (container) {
        this.skillTrees[element] = new SkillTree(element, this.character, container);
      }
    });
  }

  initInventory() {
    const container = $('#items-container');
    if (container) {
      if (this.inventoryPage) this.inventoryPage.destroy();
      this.inventoryPage = new InventoryPage(container, this.character);
    }
  }

  initShop() {
    const container = $('#shop-container');
    if (container) {
      this.shopPage = new ShopPage(container, this.character, this.authManager);
    }
  }

  initHub() {
    const container = $('#hub-container');
    if (container) {
      if (this.hubPage) this.hubPage.destroy();
      this.hubPage = new HubPage(container, this.character, this.authManager);
    }
  }

  initImport() {
    const tab = $('#import-tab');
    const container = $('#import-container');
    const canAccess = this.authManager?.hasRole('gm');

    if (tab) {
      tab.style.display = canAccess ? '' : 'none';
    }

    if (!canAccess && this.activeTab === 'import') {
      this.switchTab('character');
    }

    if (container && canAccess) {
      this.importPage = new ImportPage(container, this.authManager);
    } else {
      this.importPage = null;
      if (container) container.innerHTML = '';
    }
  }

  initAdmin() {
    const tab = $('#admin-tab');
    const container = $('#admin-container');
    const canAccess = this.authManager?.hasRole('admin');

    if (tab) {
      tab.style.display = canAccess ? '' : 'none';
    }

    if (!canAccess && this.activeTab === 'admin') {
      this.switchTab('character');
    }

    if (container && canAccess) {
      this.adminPage = new AdminPanel(container, this.authManager);
    } else {
      this.adminPage = null;
      if (container) container.innerHTML = '';
    }
  }

  getVisibleCurrencies(data) {
    const balances = data.moedas || {};
    const nativeCurrency = NATION_CURRENCIES[data.identidade.elemento] || NATION_CURRENCIES.none;
    const visible = [{ ...nativeCurrency, amount: balances[nativeCurrency.id] || 0, primary: true }];

    const orderedExtras = [NATION_CURRENCIES.none, ...Object.values(NATION_CURRENCIES).filter(currency => currency.id !== nativeCurrency.id && currency.id !== NATION_CURRENCIES.none.id)];
    orderedExtras.forEach(currency => {
      if (!currency || currency.id === nativeCurrency.id) return;
      const amount = balances[currency.id] || 0;
      if (amount > 0) {
        visible.push({ ...currency, amount, primary: false });
      }
    });

    return visible;
  }

  renderCurrencyBar(data) {
    const bar = $('#currency-bar');
    if (!bar) return;

    const currencies = this.getVisibleCurrencies(data);
    bar.innerHTML = '';

    currencies.forEach(currency => {
      const chip = createElement('div', {
        className: `currency-chip${currency.primary ? ' primary' : ''}`,
      });
      chip.style.setProperty('--currency-color', currency.color);
      chip.append(
        createElement('span', { className: 'currency-icon', textContent: currency.icon }),
        createElement('span', { className: 'currency-label', textContent: currency.label }),
        createElement('span', { className: 'currency-value', textContent: String(currency.amount) })
      );
      bar.appendChild(chip);
    });
  }

  updateUI(data) {
    const stats = this.character.getStats();

    // Character identity header
    const nameEl = $('#char-display-name');
    if (nameEl) nameEl.textContent = data.identidade.nome || 'Sem Nome';
    const elemEl = $('#char-display-element');
    if (elemEl) elemEl.textContent = ELEMENT_NAMES[data.identidade.elemento] || '';

    // Role badge
    const roleEl = $('#char-display-role');
    if (roleEl) {
      const user = this.authManager?.getUser();
      const role = user?.role || 'player';
      const ROLE_LABELS = { player: '', gm: '🎲 Game Master', admin: '⚙ Admin' };
      const ROLE_COLORS = { player: '', gm: 'var(--gold)', admin: 'var(--red)' };
      roleEl.textContent = ROLE_LABELS[role] || '';
      roleEl.style.color = ROLE_COLORS[role] || '';
    }

    // Level and available points
    const levelEl = $('#char-level');
    if (levelEl) levelEl.textContent = data.identidade.nivel;

    const milestoneEl = $('#char-milestone');
    if (milestoneEl) milestoneEl.textContent = data.identidade.marco || '';

    const pointsEl = $('#avail-points');
    if (pointsEl) pointsEl.textContent = data.pontos_disponiveis;

    const goldEl = $('#char-gold');
    if (goldEl) goldEl.textContent = data.ouro || 0;
    this.renderCurrencyBar(data);
    if (this.activeTab === 'shop') {
      this.shopPage?.refresh();
    } else {
      this.shopPage?.refreshBalance();
    }

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

    this.renderSubclassSection();

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

    // Equipment
    this.updateEquipment(data);
    this.inventoryPage?.refresh();

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

    // Lookup skill names from loaded skill trees
    container.innerHTML = active.map(([id]) => {
      let name = id;
      for (const tree of Object.values(this.skillTrees)) {
        const skill = tree.skills?.find(s => s.id === id);
        if (skill) { name = skill.name; break; }
      }
      return `<span class="skill-chip">${name}</span>`;
    }).join('');
  }

  updateEquipment(data) {
    const equipamentos = data.equipamentos || {};
    const slots = ['arma', 'armadura', 'acessorio'];

    slots.forEach(slot => {
      const el = $(`#equip-${slot}`);
      if (!el) return;

      const item = equipamentos[slot];
      if (item) {
        el.classList.add('has-item');
        const icon = slot === 'arma' ? '⚔' : slot === 'armadura' ? '🛡' : '💍';
        const label = slot === 'arma' ? 'Arma' : slot === 'armadura' ? 'Armadura' : 'Acessório';
        let statsText = '';
        if (item.damage) statsText += `DMG: ${item.damage} `;
        if (item.defense_bonus) statsText += `DEF: +${item.defense_bonus} `;
        if (item.dodge_penalty) statsText += `ESQ: -${item.dodge_penalty} `;
        if (item.effect) statsText += item.effect;

        el.innerHTML = `
          <div class="equip-slot-lbl">${icon} ${label}</div>
          <div class="equip-slot-val">${item.name}</div>
          ${statsText ? `<div class="equip-slot-stats">${statsText.trim()}</div>` : ''}
          <button class="equip-unequip-btn" data-slot="${slot}">Desequipar</button>
        `;

        const btn = el.querySelector('.equip-unequip-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            unequipItem(this.character, slot);
          });
        }
      } else {
        el.classList.remove('has-item');
        const icon = slot === 'arma' ? '⚔' : slot === 'armadura' ? '🛡' : '💍';
        const label = slot === 'arma' ? 'Arma' : slot === 'armadura' ? 'Armadura' : 'Acessório';
        el.innerHTML = `
          <div class="equip-slot-lbl">${icon} ${label}</div>
          <div class="equip-slot-val">— Vazio —</div>
        `;
      }
    });
  }

  getCharacter() {
    return this.character;
  }
}
