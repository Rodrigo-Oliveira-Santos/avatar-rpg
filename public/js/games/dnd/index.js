/**
 * D&D 5e — game module (placeholder).
 *
 * Only renders a "Coming soon" page for now. Future work:
 *  - CharactersPage: list player's D&D characters (from `dnd_characters`)
 *  - SheetPage:      full 5e sheet (abilities, saves, skills, spells)
 *  - api/dnd-characters.js with the same Supabase + localStorage pattern
 */

import { renderCharactersPage } from './pages/CharactersPage.js';
import { mountBackWidget, unmountBackWidget } from '../back-widget.js';

const ROOT_SELECTOR = '[data-game-root="dnd"]';
const GAME_ID = 'dnd';
const GAME_LABEL = 'D&D 5e';
const GAME_ACCENT = '#dc2626';

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

export const dndGame = {
  id: GAME_ID,
  label: GAME_LABEL,

  mount(route) {
    const el = root();
    if (!el) return;
    el.classList.add('on');
    el.innerHTML = '';
    mountBackWidget(el, GAME_ID, GAME_LABEL, GAME_ACCENT);

    const page = route?.page || 'characters';
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
    unmountBackWidget(GAME_ID);
  },
};

export default dndGame;
