/**
 * Avatar RPG — game module.
 *
 * Boots the existing `App` lazily on mount and tears it down completely
 * on unmount (flush AutoSave, logout, destroy per-user pages, remove
 * Back-to-hub button). Visiting `#/avatar` is always a fresh session.
 */

import { App } from '../../app.js';
import { mountBackWidget, unmountBackWidget } from '../back-widget.js';

const ROOT_SELECTOR = '[data-game-root="avatar"]';
const GAME_ID = 'avatar';
const GAME_LABEL = 'Avatar RPG';
const GAME_ACCENT = '#f97316';

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

/**
 * Defesa em profundidade: esconde todos os outros `.game-root` antes
 * de mostrar o nosso. Garante que, mesmo que o unmount async anterior
 * tenha ficado pendente, não vemos dois jogos empilhados.
 */
function hideOtherGameRoots(self) {
  document.querySelectorAll('.game-root').forEach((node) => {
    if (node !== self) node.classList.remove('on');
  });
}

export const avatarGame = {
  id: GAME_ID,
  label: GAME_LABEL,

  mount() {
    const el = root();
    if (!el) return;
    hideOtherGameRoots(el);
    el.classList.add('on');
    mountBackWidget(el, GAME_ID, GAME_LABEL, GAME_ACCENT);

    if (!window.app) {
      window.app = new App();
    }
  },

  async unmount() {
    const el = root();
    if (!el) return;

    // Tornar o jogo invisível imediatamente — antes de qualquer
    // `await`. Caso contrário o router (que pode não esperar pela
    // promessa) já mounta a landing e ficam dois roots `.on` ao mesmo
    // tempo (ver bug "Avatar aparece por baixo da landing").
    el.classList.remove('on');
    unmountBackWidget(GAME_ID);

    const app = window.app;
    if (app) {
      try {
        if (app.autoSave) {
          try { await app.autoSave.save(); } catch {}
        }
        app.teardownSession?.();
        // NÃO limpar `avatar_rpg_user` / token aqui — o user pode estar
        // a voltar à landing (via "← Início") e queremos preservar o
        // estado de admin/login. O logout explícito no botão "⏻" é
        // que limpa a sessão.
        if (app.authManager) {
          app.authManager.hideLogin?.();
        }
      } finally {
        app._uiInitialized = false;
        window.app = null;
      }
    }
  },
};

export default avatarGame;
