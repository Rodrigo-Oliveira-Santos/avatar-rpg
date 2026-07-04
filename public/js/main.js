/**
 * Multi-game entry point.
 *
 * Registers all game modules with the hash router; the router decides
 * which game to mount based on `window.location.hash`. The default route
 * is the landing page (game selector). Each game's bootstrap happens
 * lazily inside its own `mount()` — Avatar's `App` is no longer auto-
 * instantiated on page load.
 *
 * ---
 * Single-game mode
 *
 * Adding `?game=<id>` to the URL (used by `npm run dev:<game>`) restricts
 * the router to that single game: the landing page is skipped, the back-
 * to-landing widget is hidden, and the URL is normalised to `#/<id>`.
 * This is the foundation for testing one app in isolation.
 *
 * ---
 * Login-overlay "← Início" button
 *
 * The button lives in `index.html` (`#login-home-btn`) and is wired here
 * once so that **every** game's login overlay (Avatar's AuthManager and
 * the shared D&D/MC overlay alike) gets the same shortcut back to
 * landing. Hidden in single-game mode because there is no landing to go
 * back to.
 */

import { router } from './router.js';
import { landingGame } from './games/landing/index.js';
import { avatarGame } from './games/avatar/index.js';
import { dndGame } from './games/dnd/index.js';
import { minecraftGame } from './games/minecraft/index.js';
import { bootstrapLocalSeed } from './storage/local-seed.js';

const ALL_GAMES = {
  avatar: avatarGame,
  dnd: dndGame,
  minecraft: minecraftGame,
};

function readSingleGameFlag() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = (params.get('game') || '').trim().toLowerCase();
    return ALL_GAMES[id] ? id : null;
  } catch {
    return null;
  }
}

function wireLoginHomeButton(singleGameMode) {
  const btn = document.getElementById('login-home-btn');
  if (!btn) return;
  if (singleGameMode) {
    // Single-game URL → não existe landing para onde voltar.
    btn.hidden = true;
    return;
  }
  btn.hidden = false;
  btn.addEventListener('click', () => {
    // Fechar overlay imediatamente (UX), depois navegar. O router faz
    // teardown do jogo atual e mount da landing.
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('on');
    router.navigate('landing');
  });
}

function init() {
  // Populate localStorage with full preset characters in offline mode so
  // the GM dashboard sees every test profile without each one needing to
  // log in first. Idempotent + skipped entirely when Supabase is on.
  try {
    const result = bootstrapLocalSeed();
    if (result.created.length > 0) {
      console.log('[local-seed] seeded characters:', result.created.join(', '));
    }
  } catch (err) {
    console.warn('[local-seed] bootstrap failed', err);
  }

  const single = readSingleGameFlag();

  if (single) {
    // Expose flag so widgets (e.g. back-to-landing) know they're in solo
    // mode and stay hidden. Set BEFORE the router mounts the game.
    window.__SINGLE_GAME_MODE__ = single;

    router.register(single, ALL_GAMES[single]);

    // Force the hash to the single game so deep links inside that game
    // (e.g. `#/avatar/items`) still work, but a bare visit lands directly.
    const currentHash = (window.location.hash || '').replace(/^#\/?/, '');
    if (!currentHash || !currentHash.startsWith(single)) {
      // Use replace to avoid polluting history with the redirect step.
      const newHash = `#/${single}`;
      if (window.location.hash !== newHash) {
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
      }
    }
  } else {
    router.register('landing', landingGame);
    router.register('avatar', avatarGame);
    router.register('dnd', dndGame);
    router.register('minecraft', minecraftGame);
  }

  wireLoginHomeButton(!!single);
  router.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
