/**
 * Renders a fixed top-left widget inside a game root:
 *   ┌──────────┐
 *   │ ← Início │
 *   └──────────┘
 *     Avatar RPG
 *
 * Clicking the button navigates back to the landing page (the router's
 * unmount → mount cycle takes care of session teardown).
 */

import { router } from '../router.js';

const WIDGET_ID = (gameId) => `game-back-${gameId}`;

export function mountBackWidget(rootEl, gameId, gameLabel) {
  if (!rootEl) return;
  if (document.getElementById(WIDGET_ID(gameId))) return;

  const wrap = document.createElement('div');
  wrap.id = WIDGET_ID(gameId);
  wrap.className = 'game-back-widget';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'game-back-btn';
  btn.textContent = '← Início';
  btn.title = 'Voltar à página inicial';
  btn.addEventListener('click', () => router.navigate('landing'));

  const label = document.createElement('span');
  label.className = 'game-back-label';
  label.textContent = gameLabel;

  wrap.appendChild(btn);
  wrap.appendChild(label);
  rootEl.prepend(wrap);
}

export function unmountBackWidget(gameId) {
  document.getElementById(WIDGET_ID(gameId))?.remove();
}
