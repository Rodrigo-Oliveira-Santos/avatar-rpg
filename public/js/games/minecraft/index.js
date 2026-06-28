/**
 * Minecraft Builds — game module (placeholder).
 *
 * Future work:
 *  - BuildsPage:        grid of public builds (thumbnail + title + author)
 *  - BuildDetailPage:   description, download link, like button
 *  - api/mc-builds.js:  Supabase + localStorage fallback
 */

import { renderBuildsPage } from './pages/BuildsPage.js';
import { router } from '../../router.js';

const ROOT_SELECTOR = '[data-game-root="minecraft"]';
const BACK_BTN_ID = 'mc-back-to-hub';

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

export const minecraftGame = {
  id: 'minecraft',
  label: 'Minecraft Builds',

  mount(route) {
    const el = root();
    if (!el) return;
    el.classList.add('on');

    const page = route?.page || 'builds';
    el.innerHTML = '';
    ensureBackButton();
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
  },
};

export default minecraftGame;
