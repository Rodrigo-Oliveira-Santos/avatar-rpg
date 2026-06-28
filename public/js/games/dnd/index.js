/**
 * D&D 5e — game module (placeholder).
 *
 * Only renders a "Coming soon" page for now. Future work:
 *  - CharactersPage: list player's D&D characters (from `dnd_characters`)
 *  - SheetPage:      full 5e sheet (abilities, saves, skills, spells)
 *  - api/dnd-characters.js with the same Supabase + localStorage pattern
 */

import { renderCharactersPage } from './pages/CharactersPage.js';
import { router } from '../../router.js';

const ROOT_SELECTOR = '[data-game-root="dnd"]';
const BACK_BTN_ID = 'dnd-back-to-hub';

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

export const dndGame = {
  id: 'dnd',
  label: 'D&D 5e',

  mount(route) {
    const el = root();
    if (!el) return;
    el.classList.add('on');

    const page = route?.page || 'characters';
    el.innerHTML = '';
    ensureBackButton();
    switch (page) {
      case 'characters':
      default:
        el.appendChild(renderCharactersPage());
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

export default dndGame;
