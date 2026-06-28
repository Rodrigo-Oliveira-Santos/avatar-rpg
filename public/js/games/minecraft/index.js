/**
 * Minecraft Builds — game module (placeholder).
 *
 * Future work:
 *  - BuildsPage:        grid of public builds (thumbnail + title + author)
 *  - BuildDetailPage:   description, download link, like button
 *  - api/mc-builds.js:  Supabase + localStorage fallback
 */

import { renderBuildsPage } from './pages/BuildsPage.js';

const ROOT_SELECTOR = '[data-game-root="minecraft"]';

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

export const minecraftGame = {
  id: 'minecraft',
  label: 'Minecraft Builds',

  mount(route) {
    const el = root();
    if (!el) return;
    el.classList.add('on');

    const page = route?.page || 'builds';
    el.innerHTML = '';
    switch (page) {
      case 'builds':
      default:
        el.appendChild(renderBuildsPage());
    }
  },

  unmount() {
    const el = root();
    if (el) el.classList.remove('on');
  },
};

export default minecraftGame;
