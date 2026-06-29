/**
 * Main Application
 * Global state and initialization
 */

import { Character, getSubclassesForElement, mountAttributeStrip, NotesEditor } from './character/index.js';
import { AutoSave, exportToJSON, createFileInput } from './storage/index.js';
import { createElement, on, $, $$ } from './utils/dom.js';
import { ATTRIBUTES, NATION_CURRENCIES } from './utils/constants.js';
import { toast, confirmDialog, promptDialog } from './utils/toast.js';
import { SkillTree, loadSkills } from './skills/index.js';
import { InventoryPage } from './items/index.js';
import { unequipItem } from './items/inventory.js';
import { ShopPage, loadShopItemsFromSupabase } from './shop/index.js';
import { TradeHistoryPanel } from './trade/index.js';
import { HubPage } from './hub/index.js';
import { AuthManager } from './auth/index.js';
import { AdminPanel } from './admin/index.js';
import { ImportPage } from './import/index.js';
import { MonstersPage } from './monsters/index.js';
import { GMControlPage } from './gm-control/index.js';
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
 * Reverse the convention used by skill ids in `data/skills/*.json`:
 *   - bender skills:   `<element>-<branch><tier><col>` (e.g. `fire-cb1a`)
 *   - non-benders:     `none-<path>-<branch><tier><col>` (e.g. `none-weapons-cb1a`)
 *
 * Returns `{ element, nonBenderPath | null }` or `null` if the id doesn't
 * match a known prefix (custom imports, malformed ids, etc.).
 */
function inferSkillElementFromId(id) {
  if (typeof id !== 'string') return null;
  if (id.startsWith('none-weapons-'))    return { element: 'none', nonBenderPath: 'weapons' };
  if (id.startsWith('none-chiblocker-')) return { element: 'none', nonBenderPath: 'chiblocker' };
  const elementMatch = id.match(/^(fire|water|earth|air|none)-/);
  if (!elementMatch) return null;
  return { element: elementMatch[1], nonBenderPath: null };
}

/** Accent colour for the active-skills chip border, by branch (and tier 5 → gold). */
function branchAccentColor(branch, tier) {
  if (tier >= 5) return '#EF9F27';
  switch (branch) {
    case 'sp': return '#7F77DD';
    case 'ag': return '#1D9E75';
    case 'cb': return '#D88840';
    case 'pr': return '#E8844A';
    case 'br': return '#C03020';
    default:   return null;
  }
}

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
        this.teardownSession();
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
    let loadedFromRemote = false;
    try {
      const characters = await API.characters.list();
      if (characters?.length > 0) {
        const charData = characters[0];
        this.character.load(charData);
        this._restoreVitalsFromCharacter();
        return;
      }
    } catch (err) {
      console.warn('[App] API unavailable, using localStorage:', err.message);
    }

    // No remote character: try localStorage, then bootstrap from preset.
    try {
      const saved = API.characters.loadLocal();
      if (saved) {
        this.character.load(saved);
      } else {
        const user = this.authManager.getUser();
        const preset = user ? API.characters.getPreset(user.username) : null;
        if (preset) {
          this.character.load(preset);
          API.characters.saveLocal(this.character.serialize());
          try {
            await API.characters.create(this.character.serialize());
            loadedFromRemote = true;
          } catch (err) {
            console.warn('[App] preset bootstrap could not reach Supabase, kept local copy', err);
          }
        }
      }
    } catch (e) {
      console.error('[App] localStorage load failed:', e);
    }
    this._restoreVitalsFromCharacter();
    if (loadedFromRemote) console.log('[App] preset bootstrapped to Supabase');
  }

  /**
   * Pull HP/CP/SP from the persisted columns when present; otherwise
   * default to the max stats. Called after each character load so a
   * page refresh respects whatever state the player or GM left behind.
   */
  _restoreVitalsFromCharacter() {
    const stats = this.character.getStats();
    const data = this.character.getData();
    this.currentHp = Number.isFinite(data.hp_current) && data.hp_current !== null
      ? Math.max(0, Math.min(stats.maxHP, data.hp_current)) : stats.maxHP;
    this.currentSp = Number.isFinite(data.sp_current) && data.sp_current !== null
      ? Math.max(0, Math.min(stats.maxSP, data.sp_current)) : stats.maxSP;
    this.currentCp = Number.isFinite(data.cp_current) && data.cp_current !== null
      ? Math.max(0, Math.min(stats.maxCP, data.cp_current)) : stats.maxCP;
    this.character.data.hp_current = this.currentHp;
    this.character.data.sp_current = this.currentSp;
    this.character.data.cp_current = this.currentCp;
  }

  setupUI() {
    if (this._uiInitialized) {
      // Re-login: rebuild everything that depends on the current user/character.
      this.resetNavigationVisibility();
      this.setupNavigation();
      this.renderAttributeControls();
      this.bindIdentityFields();
      this.setupElementSelector();
      this.initSkillTrees();
      this.initAttributeStrip();
      this.initPlayerNotes();
      this.initTradeHistory();
      this.initInventory();
      this.initShop();
      this.initHub();
      this.initImport();
      this.initMonsters();
      this.initGmControl();
      this.initAdmin();
      this.updateUI(this.character.getData());

      // Re-create AutoSave since teardownSession() disposed of the previous one.
      if (!this.autoSave) {
        this.autoSave = new AutoSave(this.character, { debounceMs: 2000 });
      } else {
        this.autoSave.lastSavedState = null;
      }
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
    this.initAttributeStrip();
    this.initPlayerNotes();
    this.initTradeHistory();
    this.initInventory();
    this.initShop();
    this.initHub();
    this.initImport();
    this.initMonsters();
    this.initGmControl();
    this.initAdmin();

    this.character.subscribe((data) => this.updateUI(data));
    this.updateUI(this.character.getData());

    this.autoSave = new AutoSave(this.character, { debounceMs: 2000 });

    // Subscribe to Supabase realtime updates on `characters` so HP/CP/SP
    // changes from the GM Control panel propagate to the player's screen
    // without a refresh. Best-effort: failures degrade to "refresh manually".
    this._subscribeToCharacterRealtime();
  }

  async _subscribeToCharacterRealtime() {
    if (this._charsRealtimeUnsub) {
      try { this._charsRealtimeUnsub(); } catch {}
      this._charsRealtimeUnsub = null;
    }
    const username = this.authManager?.getUser?.()?.username;
    if (!username) return;

    // Sequence counter — if a later call (or teardownSession) supersedes
    // this one before subscribe() resolves, we know to immediately drop
    // the channel instead of letting it fire into a stale `this`.
    this._charsRealtimeSeq = (this._charsRealtimeSeq || 0) + 1;
    const mySeq = this._charsRealtimeSeq;

    try {
      const { subscribeToCharacters } = await import('./api/supabase-characters.js');

      // Resolve my own user_id once so realtime callbacks can filter
      // strictly by it. Without this, a falsy `myUserId` would fall
      // through and overwrite my HP/CP/SP with anyone else's row.
      let myUserId = this.character?.getData?.()?.user_id || null;
      if (!myUserId) {
        try {
          const { isSupabaseEnabled } = await import('./api/config.js');
          if (isSupabaseEnabled()) {
            const { getSupabaseClient } = await import('./api/supabase-client.js');
            const client = await getSupabaseClient();
            const { data } = await client.from('users').select('id').eq('username', username).maybeSingle();
            myUserId = data?.id || null;
            if (myUserId && this.character?.data) this.character.data.user_id = myUserId;
          }
        } catch (err) {
          console.warn('[App] could not resolve user_id for realtime filter', err);
        }
      }
      // If we still don't know our id, we cannot safely accept any
      // realtime update — bail rather than risk cross-user corruption.
      if (!myUserId) return;

      let destroyed = false;
      const unsub = await subscribeToCharacters((row) => {
        if (destroyed) return;
        if (!row || row.user_id !== myUserId) return;
        let touched = false;
        ['hp_current', 'sp_current', 'cp_current'].forEach((col) => {
          if (Number.isFinite(row[col]) && this.character.data[col] !== row[col]) {
            this.character.data[col] = row[col];
            const stateKey = col === 'hp_current' ? 'currentHp' : col === 'sp_current' ? 'currentSp' : 'currentCp';
            this[stateKey] = row[col];
            touched = true;
          }
        });
        if (touched) this.updateCombatBars();
      });

      // teardownSession() or a re-login may have bumped the sequence
      // while we were awaiting — drop the channel immediately if so.
      if (this._charsRealtimeSeq !== mySeq) {
        unsub?.();
        return;
      }
      this._charsRealtimeUnsub = () => { destroyed = true; unsub?.(); };
    } catch (err) {
      console.warn('[App] realtime subscribe failed', err);
    }
  }

  /**
   * Reset role-dependent nav visibility (called on re-login so a role
   * change between users does not leave tabs hidden/shown incorrectly).
   */
  resetNavigationVisibility() {
    $$('.nav-btn[data-page]').forEach((btn) => {
      btn.style.display = '';
    });
  }

  /**
   * Tear down per-user state before a new login. Prevents leaking the
   * previous user's hub/inventory cache, debounced autosaves, etc.
   */
  teardownSession() {
    if (this.autoSave) {
      this.autoSave.destroy();
      this.autoSave = null;
    }
    if (this.hubPage) {
      this.hubPage.destroy();
      this.hubPage = null;
    }
    if (this.inventoryPage) {
      this.inventoryPage.destroy?.();
      this.inventoryPage = null;
    }
    if (this.monstersPage) {
      this.monstersPage.destroy?.();
      this.monstersPage = null;
    }
    if (this.gmControlPage) {
      this.gmControlPage.destroy?.();
      this.gmControlPage = null;
    }
    if (this._attrStrip) {
      this._attrStrip.destroy();
      this._attrStrip = null;
    }
    if (this._playerNotes) {
      this._playerNotes.destroy();
      this._playerNotes = null;
    }
    if (this._tradeHistory) {
      this._tradeHistory.destroy();
      this._tradeHistory = null;
    }
    if (typeof this._charsRealtimeUnsub === 'function') {
      this._charsRealtimeUnsub();
      this._charsRealtimeUnsub = null;
    }
    // Bump the sequence so any in-flight _subscribeToCharacterRealtime
    // that hasn't resolved yet drops its channel on arrival instead of
    // attaching to this disposed App instance.
    this._charsRealtimeSeq = (this._charsRealtimeSeq || 0) + 1;
    this.shopPage = null;
    this.skillTrees = {};
  }

  showLoading(show) {
    const loader = $('#app-loader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
  }

  setupNavigation() {
    $$('.nav-btn[data-page]').forEach(btn => {
      on(btn, 'click', () => this.switchTab(btn.dataset.page));
    });

    // GMs and admins don't play — hide character/skill/item gameplay tabs.
    const isGameMaster = this.authManager?.hasRole('gm');
    if (isGameMaster) {
      const hiddenForGM = ['character', 'fire', 'water', 'earth', 'air', 'none', 'items'];
      hiddenForGM.forEach(pageId => {
        const btn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
        if (btn) btn.style.display = 'none';
      });
      this.switchTab('hub');
      return;
    }

    this.switchTab('character');
  }

  setupLogout() {
    const logoutBtn = $('#logout-btn');
    if (logoutBtn) {
      on(logoutBtn, 'click', async () => {
        const confirmed = await confirmDialog('Sair da sessão?');
        if (!confirmed) return;
        try {
          if (this.autoSave) await this.autoSave.flush();
        } catch (err) {
          console.warn('[App] flush on logout failed', err);
        }
        this.authManager?.logout();
      });
    }
  }

  switchTab(pageId) {
    $$('.nav-btn[data-page]').forEach(btn => btn.classList.toggle('on', btn.dataset.page === pageId));
    $$('.page').forEach(page => page.classList.toggle('on', page.id === `${pageId}-page`));
    this.activeTab = pageId;

    // Show the read-only attribute strip only on skill-tree pages.
    const SKILL_PAGES = new Set(['fire', 'water', 'earth', 'air', 'none']);
    document.body.classList.toggle('on-skill-page', SKILL_PAGES.has(pageId));

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
    const apply = async (kind, deltaOrMax) => {
      const stats = this.character.getStats();
      const map = {
        hp: { stat: 'maxHP', state: 'currentHp', col: 'hp_current' },
        sp: { stat: 'maxSP', state: 'currentSp', col: 'sp_current' },
        cp: { stat: 'maxCP', state: 'currentCp', col: 'cp_current' },
      };
      const conf = map[kind];
      const max = stats[conf.stat];
      const next = deltaOrMax === 'max'
        ? max
        : Math.max(0, Math.min(max, this[conf.state] + deltaOrMax));
      this[conf.state] = next;
      this.character.data[conf.col] = next;
      this.updateCombatBars();
      // Persist via targeted column update so AutoSave never overwrites.
      this._persistVital(conf.col, next);
    };

    [['hp', 'hp-dec-5', -5], ['hp', 'hp-dec-1', -1], ['hp', 'hp-inc-1', +1], ['hp', 'hp-inc-5', +5],
     ['sp', 'sp-dec-5', -5], ['sp', 'sp-dec-1', -1], ['sp', 'sp-inc-1', +1], ['sp', 'sp-inc-5', +5],
     ['cp', 'cp-dec-5', -5], ['cp', 'cp-dec-1', -1], ['cp', 'cp-inc-1', +1], ['cp', 'cp-inc-5', +5],
    ].forEach(([kind, id, delta]) => {
      const btn = $(`#${id}`);
      if (!btn) return;
      on(btn, 'click', () => apply(kind, delta));
    });

    [['hp', 'hp-max'], ['sp', 'sp-max'], ['cp', 'cp-max']].forEach(([kind, id]) => {
      const btn = $(`#${id}`);
      if (!btn) return;
      on(btn, 'click', () => apply(kind, 'max'));
    });
  }

  bindXPControls() {
    const addXpBtn = $('[data-action="add-xp"]');
    if (!addXpBtn) return;

    // Only the GM can grant XP. Players don't get a self-service XP button.
    if (!this.authManager?.hasRole('gm')) {
      addXpBtn.style.display = 'none';
      return;
    }

    on(addXpBtn, 'click', async () => {
      if (!this.authManager?.hasRole('gm')) return;
      const input = await promptDialog('Quanto XP adicionar?', { placeholder: 'Ex: 100' });
      const amount = parseInt(input, 10);
      if (!isNaN(amount) && amount > 0) {
        this.character.addXP(amount);
        toast(`+${amount} XP adicionado!`, 'success');
      }
    });
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
    // GMs don't play a character → no element to select, no skill tabs to show.
    if (this.authManager?.hasRole?.('gm')) return;

    const elemButtons = $$('.esbtn');
    const current = this.character.data.identidade.elemento;

    // Only bind click handlers once
    if (!this._elementSelectorBound) {
      this._elementSelectorBound = true;
      elemButtons.forEach(btn => {
        on(btn, 'click', async () => {
          const newElement = btn.dataset.element;
          const oldElement = this.character.data.identidade.elemento;
          if (newElement === oldElement) return;

          // Element change wipes the subclass and may invalidate skill
          // progress — confirm to prevent accidental clicks.
          const hasProgress = Boolean(
            this.character.data.identidade.subclasse ||
            Object.keys(this.character.data.habilidades || {}).some(
              (id) => this.character.data.habilidades[id]?.active
            )
          );
          const message = hasProgress
            ? `Trocar o elemento para "${ELEMENT_NAMES[newElement] || newElement}"? A subclasse e as habilidades activas vão ser limpas.`
            : `Trocar o elemento para "${ELEMENT_NAMES[newElement] || newElement}"?`;
          const ok = await confirmDialog(message, { confirmText: 'Trocar elemento' });
          if (!ok) return;

          // Clear incompatible subclass when element changes
          if (this.character.data.identidade.subclasse) {
            this.character.data.identidade.subclasse = '';
            this.character.data.subclass_bonus = {};
          }

          this.character.data.identidade.elemento = newElement;
          this.subclassPickerOpen = false;
          this.character.notify();
          elemButtons.forEach(b => b.classList.toggle('on', b === btn));
          this.updateElementTabs(newElement);
        });
      });
    }

    // Update visual state for current element
    elemButtons.forEach(btn => {
      btn.classList.toggle('on', btn.dataset.element === current);
    });
    this.updateElementTabs(current);
  }

  updateElementTabs(element) {
    // Skip entirely for GM/Admin: their nav already hides skill tabs and
    // re-showing 'none'/current element here would override that.
    if (this.authManager?.hasRole?.('gm')) return;

    const elementPages = ['fire', 'water', 'earth', 'air', 'none'];
    elementPages.forEach(el => {
      const tab = $(`.nav-btn.${el}`);
      if (tab) {
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

  /**
   * Targeted Supabase column update for hp/cp/sp_current. Falls back to a
   * no-op when Supabase is off (the value is still kept in `character.data`
   * and persisted on the next full AutoSave-less round-trip).
   */
  async _persistVital(column, value) {
    if (!this.authManager) return;
    const username = this.authManager.getUser?.()?.username;
    if (!username) return;
    try {
      const { isSupabaseEnabled } = await import('./api/config.js');
      if (!isSupabaseEnabled()) return;
      const { updateVitals } = await import('./api/supabase-characters.js');
      await updateVitals(username, { [column]: value });
    } catch (err) {
      console.warn('[App._persistVital]', err);
    }
  }

  initAttributeStrip() {
    const host = $('#attr-strip-host');
    if (!host) return;
    // Re-mount cleanly on re-login so it tracks the new character instance.
    if (this._attrStrip) this._attrStrip.destroy();
    host.innerHTML = '';
    this._attrStrip = mountAttributeStrip({ host, character: this.character });
  }

  initPlayerNotes() {
    const host = $('#player-notes-host');
    if (!host) return;
    if (this.authManager?.hasRole?.('gm')) {
      host.innerHTML = ''; // GM doesn't have their own player notes UI.
      if (this._playerNotes) { this._playerNotes.destroy(); this._playerNotes = null; }
      return;
    }
    if (this._playerNotes) this._playerNotes.destroy();
    host.innerHTML = '';
    this._playerNotes = new NotesEditor({
      host,
      title: 'As tuas notas',
      placeholder: 'Nova nota (Enter para guardar)…',
      notes: this.character.getData().player_notes || [],
      emptyText: 'Sem notas ainda — adiciona a primeira acima.',
      onChange: (notes) => {
        this.character.data.player_notes = notes;
        this.character.notify();
      },
    });
    if (!this._playerNotesUnsub) {
      this._playerNotesUnsub = this.character.subscribe((data) => {
        const remote = data?.player_notes || [];
        const a = this._playerNotes?.notes || [];
        if (a.length !== remote.length || a[0]?.id !== remote[0]?.id) {
          this._playerNotes?.setNotes(remote);
        }
      });
    }
  }

  initTradeHistory() {
    const host = $('#trade-history-host');
    if (!host) return;
    if (this._tradeHistory) { this._tradeHistory.destroy(); this._tradeHistory = null; }
    host.innerHTML = '';
    if (this.authManager?.hasRole?.('gm')) return; // GM doesn't have an own history.
    const username = this.authManager?.getUser?.()?.username;
    if (!username) return;
    this._tradeHistory = new TradeHistoryPanel({ host, username });
  }

  initSkillTrees() {
    // GM/Admin don't play a character → skip the entire skill-tree pipeline
    // (it would otherwise launch the non-bender path picker when element='none').
    if (this.authManager?.hasRole?.('gm')) {
      this.skillTrees = {};
      return;
    }
    ['fire', 'water', 'earth', 'air', 'none'].forEach(element => {
      const container = $(`#${element}-skills-container`);
      if (container) {
        this.skillTrees[element] = new SkillTree(element, this.character, container);
      }
    });
  }

  initInventory() {
    const container = $('#items-container');
    if (!container) return;
    if (this.authManager?.hasRole?.('gm')) {
      // GM doesn't have a personal inventory tab.
      if (this.inventoryPage) { this.inventoryPage.destroy(); this.inventoryPage = null; }
      container.innerHTML = '';
      return;
    }
    if (this.inventoryPage) this.inventoryPage.destroy();
    this.inventoryPage = new InventoryPage(container, this.character);
  }

  initShop() {
    const container = $('#shop-container');
    if (container) {
      this.shopPage = new ShopPage(container, this.character, this.authManager);
      // Warm the Supabase cache once, then refresh the shop so the new
      // items show up without a tab switch.
      loadShopItemsFromSupabase().then(() => this.shopPage?.refresh?.());
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

  initMonsters() {
    const tab = $('#monsters-tab');
    const container = $('#monsters-container');
    const canAccess = this.authManager?.hasRole('gm');

    if (tab) {
      tab.style.display = canAccess ? '' : 'none';
    }

    if (!canAccess && this.activeTab === 'monsters') {
      this.switchTab(this.authManager?.hasRole('gm') ? 'hub' : 'character');
    }

    if (container && canAccess) {
      this.monstersPage?.destroy?.();
      this.monstersPage = new MonstersPage(container, this.authManager);
    } else {
      this.monstersPage = null;
      if (container) container.innerHTML = '';
    }
  }

  initGmControl() {
    const tab = $('#gm-control-tab');
    const container = $('#gm-control-container');
    const canAccess = this.authManager?.hasRole('gm');

    if (tab) tab.style.display = canAccess ? '' : 'none';

    if (!canAccess && this.activeTab === 'gm-control') {
      this.switchTab('character');
    }

    if (container && canAccess) {
      this.gmControlPage?.destroy?.();
      this.gmControlPage = new GMControlPage(container, this.authManager);
    } else {
      this.gmControlPage = null;
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

  /**
   * Build the currency chips for the character profile.
   *
   * Lists *all* nation currencies so the player can see what they have
   * (and what they're missing) regardless of element. The character's
   * native currency is flagged `primary` (used by the CSS for the
   * coloured ring) and rendered first.
   */
  getVisibleCurrencies(data) {
    const balances = data.moedas || {};
    const nativeId = (NATION_CURRENCIES[data.identidade.elemento] || NATION_CURRENCIES.none).id;
    const ordered = Object.values(NATION_CURRENCIES);
    return ordered
      .map((currency) => ({
        ...currency,
        amount: balances[currency.id] || 0,
        primary: currency.id === nativeId,
      }))
      .sort((a, b) => {
        // Primary first, then non-zero balances, then the rest (alphabetical).
        if (a.primary !== b.primary) return a.primary ? -1 : 1;
        const aHas = a.amount > 0, bHas = b.amount > 0;
        if (aHas !== bHas) return aHas ? -1 : 1;
        return a.label.localeCompare(b.label);
      });
  }

  renderCurrencyBar(data) {
    const bar = $('#currency-bar');
    if (!bar) return;

    const currencies = this.getVisibleCurrencies(data);
    bar.innerHTML = '';

    currencies.forEach((currency) => {
      const chip = createElement('div', {
        className: `currency-chip${currency.primary ? ' primary' : ' compact'}`,
        title: currency.primary ? currency.label : `${currency.label}: ${currency.amount}`,
      });
      chip.style.setProperty('--currency-color', currency.color);
      chip.append(
        createElement('span', { className: 'currency-icon', textContent: currency.icon })
      );
      if (currency.primary) {
        // Full label only on the native currency to keep the bar compact.
        chip.append(createElement('span', { className: 'currency-label', textContent: currency.label }));
      }
      chip.append(createElement('span', { className: 'currency-value', textContent: String(currency.amount) }));
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

  /**
   * Render the "Habilidades Ativas" chips on the character profile.
   *
   * Resolves human-readable names from `window.__SKILL_DEFINITIONS__`
   * (populated by each `SkillTree` after fetching its JSON). When a
   * skill id is unknown (e.g. the user hasn't visited that element's
   * tab yet), we lazy-load the relevant JSON via `loadSkills(...)` and
   * re-render once the cache is warm — so the chip never shows the raw
   * `fire-cb1a` style id to the player.
   */
  updateActiveSkills(data) {
    const container = $('#active-skills');
    if (!container) return;

    const active = Object.entries(data.habilidades || {}).filter(([, s]) => s.active);
    if (active.length === 0) {
      container.innerHTML = '<p style="color: var(--text2); font-size: 11px;">Nenhuma habilidade ativa selecionada.</p>';
      return;
    }

    const defs = window.__SKILL_DEFINITIONS__;
    const resolved = active.map(([id]) => {
      const def = defs?.get?.(id) || null;
      return { id, def };
    });

    // Trigger background loads for elements we don't yet have cached.
    const missingByElement = new Map();
    resolved
      .filter((entry) => !entry.def)
      .forEach((entry) => {
        const target = inferSkillElementFromId(entry.id);
        if (!target) return;
        const key = target.nonBenderPath ? `${target.element}:${target.nonBenderPath}` : target.element;
        missingByElement.set(key, target);
      });
    if (missingByElement.size > 0) {
      this._kickActiveSkillsLazyLoad(missingByElement, data);
    }

    container.innerHTML = '';
    resolved.forEach(({ id, def }) => {
      const name = def?.name || (defs?.get?.(id)?.name) || '…';
      const branchColor = def ? branchAccentColor(def.branch, def.tier) : null;

      const chip = createElement('span', { class: `skill-chip${def ? ' resolved' : ' loading'}` });
      if (branchColor) chip.style.setProperty('--chip-color', branchColor);

      if (def?.tier_label) {
        chip.title = `${def.tier_label}${def.description ? ' — ' + def.description : ''}`;
      } else if (!def) {
        chip.title = 'A carregar nome da habilidade…';
      }

      chip.appendChild(createElement('span', { class: 'skill-chip-name', textContent: name }));

      // Mastery dots reuse the same threshold logic as the side panel.
      const uses = Number(data.skill_uses?.[id]) || 0;
      const masteryLevel = typeof this.character?.getMasteryLevel === 'function'
        ? this.character.getMasteryLevel(id)
        : 0;
      if (def && (uses > 0 || masteryLevel > 0)) {
        const dots = createElement('span', { class: 'skill-chip-mastery' });
        for (let i = 0; i < 3; i++) {
          dots.appendChild(createElement('i', {
            class: `skill-chip-dot${i < masteryLevel ? ' on' : ''}`,
          }));
        }
        chip.appendChild(dots);
      }

      container.appendChild(chip);
    });
  }

  /**
   * Lazy load the canonical JSON for any element whose skill defs we don't
   * have yet. Re-renders the active skills section when the cache warms
   * (debounced — multiple loads share a single re-render).
   */
  _kickActiveSkillsLazyLoad(missingByElement, data) {
    if (this._activeSkillsLoading) return;
    this._activeSkillsLoading = true;

    const tasks = Array.from(missingByElement.values()).map((target) =>
      loadSkills(target.element, { nonBenderPath: target.nonBenderPath }).then((res) => {
        if (Array.isArray(res?.skills) && window.__SKILL_DEFINITIONS__ instanceof Map) {
          res.skills.forEach((s) => { if (s?.id) window.__SKILL_DEFINITIONS__.set(s.id, s); });
        }
      }).catch(() => { /* silent: the chip stays as "…" */ })
    );

    Promise.allSettled(tasks).then(() => {
      this._activeSkillsLoading = false;
      this.updateActiveSkills(this.character.getData());
    });
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
