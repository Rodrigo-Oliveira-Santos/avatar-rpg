/**
 * Avatar RPG — game module.
 *
 * Boots the existing `App` lazily on mount and tears it down completely
 * on unmount (flush AutoSave, logout, destroy per-user pages, remove
 * Back-to-hub button). Visiting `#/avatar` is always a fresh session.
 */

import { App } from '../../app.js';
import { router } from '../../router.js';

const ROOT_SELECTOR = '[data-game-root="avatar"]';
const BACK_BTN_ID = 'avatar-back-to-hub';

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

function ensureBackButton() {
  if (document.getElementById(BACK_BTN_ID)) return;
  const el = root();
  if (!el) return;
  const btn = document.createElement('button');
  btn.id = BACK_BTN_ID;
  btn.type = 'button';
  btn.className = 'back-to-hub-btn';
  btn.textContent = '← Hub';
  btn.title = 'Voltar à página inicial';
  btn.addEventListener('click', () => router.navigate('landing'));
  el.prepend(btn);
}

function removeBackButton() {
  document.getElementById(BACK_BTN_ID)?.remove();
}

export const avatarGame = {
  id: 'avatar',
  label: 'Avatar RPG',

  mount() {
    const el = root();
    if (!el) return;
    el.classList.add('on');
    ensureBackButton();

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
        // 1) Flush pending autosave so the user's last change survives.
        if (app.autoSave) {
          try { await app.autoSave.save(); } catch {}
        }
        // 2) Full teardown: destroys AutoSave, Hub, Inventory, clears caches.
        app.teardownSession?.();
        // 3) Silent logout — clear session keys without re-showing the
        //    Avatar login overlay (which lives outside the game root).
        try {
          localStorage.removeItem('avatar_rpg_user');
          localStorage.removeItem('avatar_rpg_token');
          if (app.authManager) {
            app.authManager.currentUser = null;
            app.authManager.hideLogin?.();
          }
        } catch {}
      } finally {
        // Allow a clean boot next time.
        app._uiInitialized = false;
        window.app = null;
      }
    }

    el.classList.remove('on');
    removeBackButton();
  },
};

export default avatarGame;
