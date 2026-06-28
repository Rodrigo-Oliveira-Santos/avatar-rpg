/**
 * Multi-game entry point.
 *
 * Registers all game modules with the hash router; the router decides
 * which game to mount based on `window.location.hash`. The default route
 * is the landing page (game selector). Each game's bootstrap happens
 * lazily inside its own `mount()` — Avatar's `App` is no longer auto-
 * instantiated on page load.
 */

import { router } from './router.js';
import { landingGame } from './games/landing/index.js';
import { avatarGame } from './games/avatar/index.js';
import { dndGame } from './games/dnd/index.js';
import { minecraftGame } from './games/minecraft/index.js';

router.register('landing', landingGame);
router.register('avatar', avatarGame);
router.register('dnd', dndGame);
router.register('minecraft', minecraftGame);

const SWITCHER_SELECTOR = '#game-switcher';

function activeGame() {
  return (window.location.hash.replace(/^#\/?/, '').split('/')[0]) || 'landing';
}

function syncSwitcher() {
  const game = activeGame();
  document.querySelectorAll('.game-switcher-btn').forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.game === game);
  });
  const switcher = document.querySelector(SWITCHER_SELECTOR);
  if (switcher) {
    switcher.style.display = game === 'landing' ? 'none' : '';
  }
}

function init() {
  document.querySelectorAll('.game-switcher-btn').forEach((btn) => {
    btn.addEventListener('click', () => router.navigate(btn.dataset.game));
  });
  window.addEventListener('hashchange', syncSwitcher);

  router.start();
  syncSwitcher();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
