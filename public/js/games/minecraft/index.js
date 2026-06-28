/**
 * Minecraft Builds — game module (placeholder).
 *
 * Future work:
 *  - BuildsPage:        grid of public builds (thumbnail + title + author)
 *  - BuildDetailPage:   description, download link, like button
 *  - api/mc-builds.js:  Supabase + localStorage fallback
 */

import { renderBuildsPage } from './pages/BuildsPage.js';
import { mountBackWidget, unmountBackWidget } from '../back-widget.js';

const ROOT_SELECTOR = '[data-game-root="minecraft"]';
const GAME_ID = 'minecraft';
const GAME_LABEL = 'Minecraft Builds';
const GAME_ACCENT = '#16a34a';

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

export const minecraftGame = {
  id: GAME_ID,
  label: GAME_LABEL,

  mount(route) {
    const el = root();
    if (!el) return;
    el.classList.add('on');
    el.innerHTML = '';
    mountBackWidget(el, GAME_ID, GAME_LABEL, GAME_ACCENT);

    const page = route?.page || 'builds';
    switch (page) {
      case 'builds':
      default:
        el.appendChild(renderBuildsPage());
    }
  },

  unmount() {
    const el = root();
    if (el) {
      el.classList.remove('on');
      el.innerHTML = '';
    }
    unmountBackWidget(GAME_ID);
  },
};

export default minecraftGame;
