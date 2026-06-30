/**
 * Auto-Save System
 * Hybrid strategy: debounce + diff check + beforeunload backup
 */

import { AUTOSAVE } from '../utils/constants.js';
import { isSupabaseEnabled } from '../api/config.js';
import { saveCharacter as saveCharacterToSupabase } from '../api/supabase-characters.js';

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
  /**
   * Read the currently logged-in username (used by the Supabase writer).
   */
  getCurrentUsername() {
    try {
      const stored = localStorage.getItem('avatar_rpg_user');
      if (stored) return JSON.parse(stored).username;
    } catch {}
    return null;
  }

  async save() {
    const payload = this.character.serialize();

    this.saveToLocal(payload);
    this.lastSavedState = JSON.stringify(payload);
    this.pendingChanges = false;
    log('info', 'Saved to localStorage');

    if (isSupabaseEnabled()) {
      const username = this.getCurrentUsername();
      if (!username) {
        log('warn', 'Supabase enabled but no username in session — skipping remote upsert');
        return;
      }

      try {
        // `status_effects` and `gm_notes` are owned by GM tooling. Skipping
        // these columns here prevents the player's AutoSave from
        // overwriting the GM's edits with stale snapshots. `player_notes`
        // IS written because the player owns it.
        await saveCharacterToSupabase(username, payload, {
          omitStatusEffects: true,
          omitGmNotes: true,
          omitVitals: true,
        });
        log('info', 'Synced to Supabase', { username });
      } catch (err) {
        log('error', 'Supabase save failed (kept localStorage copy)', err);
      }
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
   * Get per-user storage key
   */
  getStorageKey() {
    try {
      const stored = localStorage.getItem('avatar_rpg_user');
      if (stored) {
        const user = JSON.parse(stored);
        return `avatar_rpg_character_${user.username}`;
      }
    } catch {}
    return 'avatar_rpg_character_default';
  }

  /**
   * Save to localStorage (fallback)
   * @param {object} payload - Character data
   */
  saveToLocal(payload) {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));
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
      const data = localStorage.getItem(this.getStorageKey());
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
        log('info', 'beforeunload: saving');

        const payload = this.character.serialize();
        // Save to localStorage as backup
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
   * Cancel debounced timer and immediately flush any pending changes.
   * Returns a promise that resolves once the save (local + remote) completes.
   * Used by the logout handler so the user's last edits survive a sign-out.
   */
  async flush() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (!this.hasChanges()) return;
    await this.save();
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
