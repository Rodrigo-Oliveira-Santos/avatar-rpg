/**
 * Landing — pseudo-game module that renders the game selector and a
 * cross-app admin panel.
 *
 * Lives at `#/` (default route). The cards delegate to the router to
 * navigate into the chosen game, which is mounted fresh by the router's
 * unmount-then-mount cycle (full session isolation).
 *
 * Auth próprio da landing (`landing_user`):
 *   • Permite obter role admin sem entrar primeiro num jogo.
 *   • Reusa o overlay partilhado via `createSharedAuth`.
 *
 * Sub-views:
 *   • default → game selector (LandingPage)
 *   • admin   → painel admin global (AdminLandingPage), só se houver
 *               uma sessão admin activa (em qualquer chave).
 */

import { renderLandingPage } from './pages/LandingPage.js';
import { renderAdminLandingPage } from './pages/AdminLandingPage.js';
import { getCurrentAdmin } from '../lib/users-registry.js';
import { createSharedAuth } from '../lib/shared-auth.js';
import { router } from '../../router.js';

const ROOT_SELECTOR = '[data-game-root="landing"]';

const auth = createSharedAuth({
  storageKey: 'landing_user',
  defaultTitle: 'Entrar — Plataforma',
  hintText: 'Usa <strong>admin</strong> para abrir o painel cross-app, ou qualquer username já registado.',
  brand: { logo: '🎮 Multi-Game', accent: '#7a70e0' },
});

let subView = 'default'; // 'default' | 'admin'

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

function render() {
  const el = root();
  if (!el) return;
  // Defesa em profundidade: força a esconder todos os OUTROS roots de
  // jogos. Se um unmount async tiver falhado a meio (ou se a
  // serialização do router for contornada), pelo menos não ficamos
  // com o conteúdo do jogo anterior empilhado por baixo da landing.
  document.querySelectorAll('.game-root').forEach((node) => {
    if (node !== el) node.classList.remove('on');
  });

  el.classList.add('on');
  el.innerHTML = '';

  if (subView === 'admin') {
    const actor = getCurrentAdmin();
    if (!actor) {
      // Sessão admin desapareceu (logout em outra tab). Voltar.
      subView = 'default';
      render();
      return;
    }
    el.appendChild(renderAdminLandingPage({
      actor,
      onBack: () => { subView = 'default'; render(); },
    }));
    return;
  }

  el.appendChild(renderLandingPage(
    (gameId) => router.navigate(gameId),
    {
      onOpenAdmin: () => { subView = 'admin'; render(); },
      onLogin: () => {
        // O botão "← Início" do overlay não faz sentido quando já
        // estamos na landing — escondemos enquanto este overlay vive.
        const homeBtn = document.getElementById('login-home-btn');
        const prevHidden = homeBtn?.hidden;
        if (homeBtn) homeBtn.hidden = true;
        auth.showLogin(() => {
          if (homeBtn) homeBtn.hidden = prevHidden ?? false;
          render();
        });
      },
      onLogout: () => {
        auth.clearUser();
        render();
      },
    },
  ));
}

export const landingGame = {
  id: 'landing',
  label: 'Início',

  mount() {
    subView = 'default';
    render();
  },

  unmount() {
    const el = root();
    if (el) {
      el.classList.remove('on');
      el.innerHTML = '';
    }
    // Garante que o overlay não fica "agarrado" se o user navegou para
    // um jogo enquanto o login estava aberto.
    auth.hideLogin();
    subView = 'default';
  },
};

export default landingGame;
