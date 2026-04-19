/**
 * Auto-Save System
 * Hybrid strategy: debounce + diff check + beforeunload backup
 */

import { AUTOSAVE } from '../utils/constants.js';

/**
 * Logger helper
 */
function log(level, ...args) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  if (levels[level] >= levels[AUTOSAVE.LOG_LEVEL]) {
    console.log(`[AutoSave]`, ...args);
  }
}

/**
 * AutoSave Class
 */
export class AutoSave {
  /**
   * @param {object} character - Character instance
   * @param {object} options - Configuration options
   */
  constructor(character, options = {}) {
    this.character = character;
    this.lastSavedState = null;
    this.pendingChanges = false;
    this.debounceMs = options.debounceMs || AUTOSAVE.DEBOUNCE_MS;
    this.timerId = null;

    // Subscribe to character changes
    this.unsubscribe = character.subscribe(() => {
      this.schedule();
    });

    // Bind beforeunload listener
    if (AUTOSAVE.ENABLE_BEFOREUNLOAD) {
      this.bindBeforeUnload();
    }

    log('info', 'AutoSave initialized', { debounceMs: this.debounceMs });
  }

  /**
   * Check if current state differs from last saved
   * @returns {boolean} Has changes
   */
  hasChanges() {
    if (!this.lastSavedState) return true;

    const currentState = JSON.stringify(this.character.serialize());
    return currentState !== this.lastSavedState;
  }

  /**
   * Schedule a save after debounce delay
   */
  schedule() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.timerId = setTimeout(() => this.maybeSave(), this.debounceMs);
    log('debug', 'Save scheduled');
  }

  /**
   * Save only if there are actual changes
   */
  async maybeSave() {
    if (!this.hasChanges()) {
      log('info', 'No changes - skipping save');
      this.pendingChanges = false;
      return;
    }
    await this.save();
  }

  /**
   * Perform actual save
   */
  async save() {
    const payload = this.character.serialize();

    try {
      // Try API save first (will fail if backend not available)
      await this.saveToAPI(payload);
      this.lastSavedState = JSON.stringify(payload);
      this.pendingChanges = false;
      log('info', 'Saved successfully');
    } catch (err) {
      // Fallback to localStorage
      log('warn', 'API save failed, using localStorage', err);
      this.saveToLocal(payload);
      this.lastSavedState = JSON.stringify(payload);
      this.pendingChanges = false;
    }
  }

  /**
   * Save to API (Netlify Function → Supabase)
   * @param {object} payload - Character data
   */
  async saveToAPI(payload) {
    const id = payload.id;
    const url = id ? `/api/characters/${id}` : '/api/characters';
    const method = id ? 'PUT' : 'POST';
    const token = localStorage.getItem('avatar_rpg_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    // Store returned id if creating new character
    if (!id && result.id) {
      this.character.data.id = result.id;
    }
    return result;
  }

  /**
   * Save to localStorage (fallback)
   * @param {object} payload - Character data
   */
  saveToLocal(payload) {
    try {
      localStorage.setItem('avatar_rpg_character', JSON.stringify(payload));
      localStorage.setItem('avatar_rpg_saved_at', new Date().toISOString());
    } catch (err) {
      log('error', 'localStorage save failed', err);
    }
  }

  /**
   * Load from localStorage
   * @returns {object|null} Saved character data
   */
  loadFromLocal() {
    try {
      const data = localStorage.getItem('avatar_rpg_character');
      const savedAt = localStorage.getItem('avatar_rpg_saved_at');
      if (data) {
        log('info', 'Loaded from localStorage', { savedAt });
        return JSON.parse(data);
      }
    } catch (err) {
      log('error', 'localStorage load failed', err);
    }
    return null;
  }

  /**
   * Bind beforeunload listener for emergency save
   */
  bindBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      if (this.hasChanges()) {
        log('info', 'beforeunload: saving with sendBeacon');

        const payload = this.character.serialize();
        const id = payload.id;
        const url = id ? `/api/characters/${id}` : '/api/characters';
        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });

        // sendBeacon survives page unload
        navigator.sendBeacon(url, blob);

        // Also save to localStorage as backup
        this.saveToLocal(payload);
      }
    });
  }

  /**
   * Get pending changes status
   * @returns {boolean} Has pending changes
   */
  hasPendingChanges() {
    return this.pendingChanges || this.hasChanges();
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
