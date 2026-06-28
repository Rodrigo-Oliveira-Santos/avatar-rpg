/**
 * Landing — pseudo-game module that just renders the game selector.
 *
 * Lives at `#/` (default route). The cards delegate to the router to
 * navigate into the chosen game, which is mounted fresh by the router's
 * unmount-then-mount cycle (full session isolation).
 */

import { renderLandingPage } from './pages/LandingPage.js';
import { router } from '../../router.js';

const ROOT_SELECTOR = '[data-game-root="landing"]';
const SWITCHER_SELECTOR = '#game-switcher';

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

export const landingGame = {
  id: 'landing',
  label: 'Início',

  mount() {
    const el = root();
    if (!el) return;
    el.classList.add('on');
    el.innerHTML = '';
    el.appendChild(renderLandingPage((gameId) => router.navigate(gameId)));

    // Hide the top switcher while on the landing — the cards are the entry point.
    const switcher = document.querySelector(SWITCHER_SELECTOR);
    if (switcher) switcher.style.display = 'none';
  },

  unmount() {
    const el = root();
    if (el) {
      el.classList.remove('on');
      el.innerHTML = '';
    }
    const switcher = document.querySelector(SWITCHER_SELECTOR);
    if (switcher) switcher.style.display = '';
  },
};

export default landingGame;
