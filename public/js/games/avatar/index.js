/**
 * Avatar RPG — game module.
 *
 * Boots the existing `App` lazily on mount and tears it down completely
 * on unmount (flush AutoSave, logout, destroy per-user pages, remove
 * Back-to-hub button). Visiting `#/avatar` is always a fresh session.
 */

import { App } from '../../app.js';
import { mountBackWidget, unmountBackWidget } from '../back-widget.js';

const ROOT_SELECTOR = '[data-game-root="avatar"]';
const GAME_ID = 'avatar';
const GAME_LABEL = 'Avatar RPG';
const GAME_ACCENT = '#f97316';

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

export const avatarGame = {
  id: GAME_ID,
  label: GAME_LABEL,

  mount() {
    const el = root();
    if (!el) return;
    el.classList.add('on');
    mountBackWidget(el, GAME_ID, GAME_LABEL, GAME_ACCENT);

    if (!window.app) {
      window.app = new App();
    }
  },

  async unmount() {
    const el = root();
    if (!el) return;

    const app = window.app;
    if (app) {
      try {
        if (app.autoSave) {
          try { await app.autoSave.save(); } catch {}
        }
        app.teardownSession?.();
        try {
          localStorage.removeItem('avatar_rpg_user');
          localStorage.removeItem('avatar_rpg_token');
          if (app.authManager) {
            app.authManager.currentUser = null;
            app.authManager.hideLogin?.();
          }
        } catch {}
      } finally {
        app._uiInitialized = false;
        window.app = null;
      }
    }

    el.classList.remove('on');
    unmountBackWidget(GAME_ID);
  },
};

export default avatarGame;
