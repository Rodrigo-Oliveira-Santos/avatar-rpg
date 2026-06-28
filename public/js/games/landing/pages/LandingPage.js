/**
 * Landing page — game selector.
 *
 * Public, no auth. Each card hands off to the router, which then mounts
 * the chosen game's module (and triggers its own login flow if it has
 * one).
 */

import { createElement } from '../../../utils/dom.js';

const GAMES = [
  {
    id: 'avatar',
    title: 'Avatar RPG',
    description: 'Sistema de RPG inspirado em Avatar: The Last Airbender. Personagens, dobra, skills, hub de jogadores.',
    accent: '#f97316',
    requiresAuth: true,
  },
  {
    id: 'dnd',
    title: 'D&D 5e',
    description: 'Fichas D&D 5e padrão, sem customizações. Em desenvolvimento.',
    accent: '#dc2626',
    requiresAuth: false,
  },
  {
    id: 'minecraft',
    title: 'Minecraft Builds',
    description: 'Galeria de builds com thumbnails e links de download (Google Drive). Em desenvolvimento.',
    accent: '#16a34a',
    requiresAuth: false,
  },
];

export function renderLandingPage(onSelect) {
  const wrap = createElement('section', { class: 'landing' });

  const header = createElement('header', { class: 'landing-header' });
  header.appendChild(createElement('h1', { textContent: 'Escolhe um jogo' }));
  header.appendChild(createElement('p', {
    class: 'landing-subtitle',
    textContent: 'Cada jogo é uma aplicação independente — entras, jogas, sais.',
  }));
  wrap.appendChild(header);

  const grid = createElement('div', { class: 'landing-grid' });

  GAMES.forEach((game) => {
    const card = createElement('article', { class: 'landing-card' });
    card.style.setProperty('--card-accent', game.accent);

    const title = createElement('h2', { textContent: game.title });
    const desc = createElement('p', { textContent: game.description });
    const meta = createElement('span', {
      class: 'landing-card-meta',
      textContent: game.requiresAuth ? 'Requer login' : 'Acesso livre',
    });
    const btn = createElement('button', { type: 'button', class: 'landing-card-btn', textContent: 'Entrar' });
    btn.addEventListener('click', () => onSelect(game.id));

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(meta);
    card.appendChild(btn);
    grid.appendChild(card);
  });

  wrap.appendChild(grid);
  return wrap;
}
