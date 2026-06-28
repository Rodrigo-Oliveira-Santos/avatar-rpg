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

function init() {
  router.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
