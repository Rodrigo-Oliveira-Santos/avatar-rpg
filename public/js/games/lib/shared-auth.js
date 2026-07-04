/**
 * Auth partilhada para jogos da nova plataforma (D&D, Minecraft, ...).
 *
 * **Não toca no AuthManager do Avatar.** Reutiliza o overlay
 * `#login-overlay` do `index.html` mas com:
 *   • Título configurável por jogo (`title`).
 *   • Logo / cor de destaque configuráveis (`brand: { logo, accent }`)
 *     para que o overlay condiga com o cartão da landing page.
 *   • Substituição segura do "Perfis de teste" estático por uma frase
 *     contextual (ou ocultação total).
 *   • Chave de sessão por jogo (`storageKey`) — completamente isolada.
 *   • Inferência de role a partir do registry da PRÓPRIA app
 *     (per-app accounts, post 2026-06-30 split).
 *
 * Nota: o botão "← Início" do overlay é gerido globalmente em
 * `public/js/main.js` (boot-time) para que esteja disponível em
 * qualquer overlay — incluindo o do Avatar.
 */

import { $, on } from '../../utils/dom.js';
import {
  APP_REGISTRY_KEYS,
  APP_SESSION_KEYS,
  ensureAppSeed,
} from './users-registry.js';

const HINTS_NODE_SELECTOR = '#login-overlay .login-test-hints';
const TITLE_SELECTOR = '#login-overlay .login-title';
const LOGO_SELECTOR = '#login-overlay #login-logo';
const BOX_SELECTOR = '#login-overlay .login-box';

const DEFAULT_LOGO = '⚡ Avatar RPG';

/**
 * Map a session storageKey back to an app id so we can look up the
 * right per-app registry. Falls back to 'avatar' when the key is
 * unrecognised (defensive — keeps the old behaviour for unknown
 * callers).
 */
function resolveAppId(storageKey) {
  for (const [appId, key] of Object.entries(APP_SESSION_KEYS)) {
    if (key === storageKey) return appId;
  }
  return 'avatar';
}

/**
 * Build an `inferRole(username)` function scoped to one app. Each
 * shared-auth instance binds to a single app via its `storageKey`
 * (e.g. `dnd_user` → D&D), so role lookups don't leak across apps.
 */
function makeInferRole(appId) {
  const key = APP_REGISTRY_KEYS[appId] || APP_REGISTRY_KEYS.avatar;
  // First call seeds the per-app registry (idempotent) so the test
  // profiles + their default roles work even if the player never went
  // through any admin panel yet.
  try { ensureAppSeed(appId); } catch {}
  return (username) => {
    try {
      const raw = localStorage.getItem(key);
      const reg = raw ? JSON.parse(raw) : {};
      if (reg[username]?.role) return reg[username].role;
    } catch {}
    if (username === 'admin') return 'admin';
    if (username === 'gm') return 'gm';
    return 'player';
  };
}

export function createSharedAuth({ storageKey, defaultTitle, hintText, brand = null }) {
  if (!storageKey) throw new Error('createSharedAuth: storageKey is required');
  const appId = resolveAppId(storageKey);
  const inferRole = makeInferRole(appId);

  function readUser() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function setUser(user) {
    localStorage.setItem(storageKey, JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem(storageKey);
  }

  function applyTitle(title) {
    const el = $(TITLE_SELECTOR);
    if (el) el.textContent = title || 'Entrar';
  }

  function applyHints(text) {
    const el = $(HINTS_NODE_SELECTOR);
    if (!el) return;
    if (!text) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
      el.innerHTML = text;
    }
  }

  function applyBrand(b) {
    const logoEl = $(LOGO_SELECTOR);
    const boxEl = $(BOX_SELECTOR);
    if (logoEl) logoEl.textContent = b?.logo || DEFAULT_LOGO;
    if (boxEl) {
      if (b?.accent) boxEl.style.setProperty('--login-accent', b.accent);
      else boxEl.style.removeProperty('--login-accent');
    }
  }

  function showLogin(onSuccess, opts = {}) {
    const overlay = $('#login-overlay');
    if (!overlay) return;
    overlay.classList.add('on');
    applyTitle(opts.title ?? defaultTitle);
    applyHints(opts.hintText !== undefined ? opts.hintText : hintText);
    applyBrand(opts.brand ?? brand);

    const form = $('#login-form', overlay);
    if (!form) return;

    // Clonar o form para garantir um único listener limpo (evita
    // colidir com handlers de outros jogos / do AuthManager Avatar).
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    on(newForm, 'submit', (e) => {
      e.preventDefault();
      const input = $('#login-username', overlay);
      const errEl = $('#login-error', overlay);
      const username = (input?.value || '').trim().toLowerCase();
      if (!username) {
        if (errEl) errEl.textContent = 'Preencha o nome de utilizador.';
        return;
      }
      if (errEl) errEl.textContent = '';
      const role = inferRole(username);
      const user = { id: `user-${username}`, username, role };
      setUser(user);
      overlay.classList.remove('on');
      onSuccess?.(user);
    });
  }

  function hideLogin() {
    const overlay = $('#login-overlay');
    if (overlay) overlay.classList.remove('on');
    // Reset visível para o próximo jogo / Avatar não herdar este contexto.
    applyTitle('Entrar');
    applyHints(null);
    applyBrand(null);
  }

  return {
    readUser, setUser, clearUser,
    showLogin, hideLogin,
    inferRole,
  };
}
