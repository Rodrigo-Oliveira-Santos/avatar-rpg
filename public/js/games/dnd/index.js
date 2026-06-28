/**
 * D&D 5e — game module (placeholder).
 *
 * Only renders a "Coming soon" page for now. Future work:
 *  - CharactersPage: list player's D&D characters (from `dnd_characters`)
 *  - SheetPage:      full 5e sheet (abilities, saves, skills, spells)
 *  - api/dnd-characters.js with the same Supabase + localStorage pattern
 */

import { renderCharactersPage } from './pages/CharactersPage.js';

const ROOT_SELECTOR = '[data-game-root="dnd"]';

function root() {
  return document.querySelector(ROOT_SELECTOR);
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
    switch (page) {
      case 'characters':
      default:
        el.appendChild(renderCharactersPage());
    }
  },

  unmount() {
    const el = root();
    if (el) el.classList.remove('on');
  },
};

export default dndGame;
