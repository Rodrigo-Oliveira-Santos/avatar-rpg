/**
 * Multi-game bootstrap.
 *
 * Wires the game switcher buttons to the hash router and registers each
 * game module. The Avatar app continues to boot via `main.js` (legacy path)
 * — this script just controls which game root is visible.
 */

import { router } from './router.js';
import { avatarGame } from './games/avatar/index.js';
import { dndGame } from './games/dnd/index.js';
import { minecraftGame } from './games/minecraft/index.js';

router.register('avatar', avatarGame);
router.register('dnd', dndGame);
router.register('minecraft', minecraftGame);

function syncSwitcher(activeGame) {
  document.querySelectorAll('.game-switcher-btn').forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.game === activeGame);
  });
}

document.querySelectorAll('.game-switcher-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    router.navigate(btn.dataset.game);
  });
});

window.addEventListener('hashchange', () => {
  const game = (window.location.hash.replace(/^#\/?/, '').split('/')[0]) || 'avatar';
  syncSwitcher(game);
});

router.start();
syncSwitcher((window.location.hash.replace(/^#\/?/, '').split('/')[0]) || 'avatar');
