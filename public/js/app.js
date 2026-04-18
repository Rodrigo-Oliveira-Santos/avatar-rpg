/**
 * Main Application
 * Global state and initialization
 */

import { Character } from './character/index.js';
import { AutoSave, exportToJSON, createFileInput } from './storage/index.js';
import { createElement, on, $ } from './utils/dom.js';

/**
 * Application Class
 */
export class App {
  constructor() {
    this.character = new Character();
    this.autoSave = null;
    this.pages = {};
    this.activeTab = 'character';

    this.init();
  }

  /**
   * Initialize application
   */
  async init() {
    // Load saved character from localStorage
    this.loadSavedCharacter();

    // Initialize auto-save
    this.autoSave = new AutoSave(this.character, {
      debounceMs: 2000,
    });

    // Setup navigation
    this.setupNavigation();

    // Setup import/export
    this.setupImportExport();

    // Setup element selector
    this.setupElementSelector();

    console.log('[App] Initialized');
  }

  /**
   * Load saved character from localStorage
   */
  loadSavedCharacter() {
    try {
      const saved = localStorage.getItem('avatar_rpg_character');
      if (saved) {
        const data = JSON.parse(saved);
        this.character.load(data);
        console.log('[App] Loaded saved character');
      }
    } catch (err) {
      console.error('[App] Failed to load saved character:', err);
    }
  }

  /**
   * Setup tab navigation
   */
  setupNavigation() {
    const navButtons = $$('.nav-btn');

    navButtons.forEach(btn => {
      on(btn, 'click', () => {
        const pageId = btn.dataset.page;
        this.switchTab(pageId);
      });
    });

    // Initial tab
    this.switchTab('character');
  }

  /**
   * Switch to a different tab/page
   * @param {string} pageId - Page identifier
   */
  switchTab(pageId) {
    // Update nav buttons
    $$('.nav-btn').forEach(btn => {
      if (btn.dataset.page === pageId) {
        btn.classList.add('on');
      } else {
        btn.classList.remove('on');
      }
    });

    // Update pages
    $$('.page').forEach(page => {
      if (page.id === `${pageId}-page`) {
        page.classList.add('on');
      } else {
        page.classList.remove('on');
      }
    });

    this.activeTab = pageId;
    console.log('[App] Switched to:', pageId);
  }

  /**
   * Setup import/export buttons
   */
  setupImportExport() {
    const exportBtn = $('[data-action="export"]');
    const importBtn = $('[data-action="import"]');

    if (exportBtn) {
      on(exportBtn, 'click', () => {
        exportToJSON(this.character.getData());
      });
    }

    if (importBtn) {
      on(importBtn, 'click', () => {
        createFileInput((err, characterData) => {
          if (err) {
            alert(`Import failed: ${err.message}`);
          } else {
            this.character.load(characterData);
            alert('Character imported successfully!');
          }
        });
      });
    }
  }

  /**
   * Setup element selector buttons
   */
  setupElementSelector() {
    const elemButtons = $$('.esbtn');

    elemButtons.forEach(btn => {
      on(btn, 'click', () => {
        const element = btn.dataset.element;
        this.character.data.identidade.elemento = element;
        this.character.notify();

        // Update buttons
        elemButtons.forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
      });
    });
  }

  /**
   * Get character instance
   * @returns {Character} Character instance
   */
  getCharacter() {
    return this.character;
  }
}
