/**
 * Avatar RPG — game module adapter.
 *
 * The existing app (in `public/js/app.js`) already bootstraps itself when
 * loaded. This adapter exists so the multi-game router has a consistent
 * shape for each game and so we can later move the Avatar bootstrap behind
 * a lazy mount/unmount cycle.
 *
 * Today: mount() simply shows the legacy `<main>` element; unmount() hides
 * it. The Character/Hub state lives in the singleton `App` instance.
 */

const AVATAR_ROOT_SELECTOR = '[data-game-root="avatar"]';

function rootElement() {
  return document.querySelector(AVATAR_ROOT_SELECTOR);
}

export const avatarGame = {
  id: 'avatar',
  label: 'Avatar RPG',

  mount(/* route */) {
    const root = rootElement();
    if (root) root.classList.add('on');
  },

  unmount() {
    const root = rootElement();
    if (root) root.classList.remove('on');
  },
};

export default avatarGame;
