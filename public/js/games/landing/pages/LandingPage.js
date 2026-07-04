/**
 * Landing page — game selector.
 *
 * Public by default. Cada card delega ao router; jogos com auth próprio
 * disparam o seu login flow.
 *
 * Top-bar:
 *  • Estado de sessões activas por jogo (chips coloridos).
 *  • Botão "Entrar"/"Sair" próprio da landing (chave `landing_user`)
 *    para ganhar role admin sem ter de entrar primeiro num jogo.
 *  • Botão "🛡️ Admin Global" CTA destacado quando alguma sessão activa
 *    (incluindo `landing_user`) tem role=admin.
 */

import { createElement, on } from '../../../utils/dom.js';
import { confirmDialog } from '../../../utils/toast.js';
import { getActiveSessions, getCurrentAdmin } from '../../lib/users-registry.js';

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

const SESSION_ACCENT = {
  avatar: '#f97316',
  dnd: '#dc2626',
  mc: '#16a34a',
  landing: '#7a70e0',
};

const SESSION_LABEL = {
  avatar: 'Avatar',
  dnd: 'D&D',
  mc: 'Minecraft',
  landing: 'Landing',
};

export function renderLandingPage(onSelect, opts = {}) {
  const wrap = createElement('section', { class: 'landing' });

  // ---- Top bar (sessões + login + admin CTA) ----------------------
  wrap.appendChild(renderTopBar(opts));

  // ---- Header -----------------------------------------------------
  const header = createElement('header', { class: 'landing-header' });
  header.appendChild(createElement('h1', { textContent: 'Escolhe um jogo' }));
  header.appendChild(createElement('p', {
    class: 'landing-subtitle',
    textContent: 'Cada jogo é uma aplicação independente — entras, jogas, sais.',
  }));
  wrap.appendChild(header);

  // ---- Admin CTA (banner destacado) -------------------------------
  const admin = getCurrentAdmin();
  if (admin && typeof opts.onOpenAdmin === 'function') {
    const ctaBox = createElement('div', { class: 'landing-admin-cta' });
    const left = createElement('div', { class: 'landing-admin-cta-text' });
    left.appendChild(createElement('div', { class: 'landing-admin-cta-title', textContent: '🛡️ Painel de Admin Global' }));
    left.appendChild(createElement('div', {
      class: 'landing-admin-cta-sub',
      textContent: `Sessão admin activa: ${admin.username} (${admin.app}). Gere utilizadores e vê estatísticas de todos os jogos.`,
    }));
    const ctaBtn = createElement('button', {
      type: 'button',
      class: 'landing-admin-cta-btn',
      textContent: 'Abrir painel →',
    });
    on(ctaBtn, 'click', () => opts.onOpenAdmin());
    ctaBox.appendChild(left);
    ctaBox.appendChild(ctaBtn);
    wrap.appendChild(ctaBox);
  }

  // ---- Game grid --------------------------------------------------
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

function renderTopBar(opts) {
  const bar = createElement('div', { class: 'landing-topbar' });

  // Sessions chips
  const chips = createElement('div', { class: 'landing-sessions' });
  const sessions = getActiveSessions();
  if (!sessions.length) {
    chips.appendChild(createElement('span', {
      class: 'landing-sessions-empty',
      textContent: 'Nenhuma sessão activa.',
    }));
  } else {
    sessions.forEach((s) => {
      const chip = createElement('span', { class: 'landing-session-chip' });
      chip.style.setProperty('--chip-accent', SESSION_ACCENT[s.app] || '#888');
      chip.appendChild(createElement('span', {
        class: 'dot',
      }));
      chip.appendChild(createElement('span', {
        class: 'label',
        textContent: `${SESSION_LABEL[s.app] || s.app}: ${s.username} (${s.role})`,
      }));
      chips.appendChild(chip);
    });
  }
  bar.appendChild(chips);

  // Login / logout actions
  const actions = createElement('div', { class: 'landing-auth-actions' });
  const landingSession = getActiveSessions().find((s) => s.app === 'landing');
  if (landingSession) {
    const logout = createElement('button', {
      type: 'button',
      class: 'landing-auth-btn',
      textContent: `⏻ Sair (${landingSession.username})`,
    });
    on(logout, 'click', async () => {
      const ok = await confirmDialog('Terminar a sessão da landing?');
      if (!ok) return;
      opts.onLogout?.();
    });
    actions.appendChild(logout);
  } else {
    const login = createElement('button', {
      type: 'button',
      class: 'landing-auth-btn primary',
      textContent: '🔑 Iniciar sessão',
    });
    on(login, 'click', () => opts.onLogin?.());
    actions.appendChild(login);
  }
  bar.appendChild(actions);

  return bar;
}
