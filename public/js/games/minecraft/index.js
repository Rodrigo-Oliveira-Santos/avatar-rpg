/**
 * Minecraft Builds — game entrypoint.
 *
 * Galeria pública (sem login) com painel pessoal autenticado.
 *
 *   • Tab "Galeria"  → renderGalleryPage (público).
 *   • Tab "Painel"   → pede login se necessário e mostra CRUD do user.
 *   • Sub-views      → form (novo / editar) acessível só após login.
 *
 * Sessão guardada em `mc_user` via `lib/shared-auth.js`; teardown
 * completo em unmount.
 */

import { createElement, on } from '../../utils/dom.js';
import { toast, confirmDialog } from '../../utils/toast.js';
import { mountBackWidget, unmountBackWidget } from '../back-widget.js';
import { createSharedAuth } from '../lib/shared-auth.js';

import { renderGalleryPage } from './pages/GalleryPage.js';
import { renderMyPanelPage } from './pages/MyPanelPage.js';
import { renderListsPage } from './pages/ListsPage.js';
import { renderBuildForm } from './pages/BuildFormPage.js';
import { renderAdminPage } from './pages/AdminPage.js';
import { createBuild, updateBuild } from '../../api/mc-builds.js';

const ROOT_SELECTOR = '[data-game-root="minecraft"]';
const GAME_ID = 'minecraft';
const GAME_LABEL = 'Minecraft Builds';
const GAME_ACCENT = '#16a34a';

const auth = createSharedAuth({
  storageKey: 'mc_user',
  defaultTitle: 'Entrar — Painel Minecraft',
  hintText: null,
  brand: { logo: '⛏ Minecraft Builds', accent: '#16a34a' },
});

// ─── Tabs ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'gallery', label: 'Galeria' },
  { id: 'panel',   label: 'Painel Pessoal', authRequired: true },
  { id: 'lists',   label: 'Minhas Listas',  authRequired: true },
  { id: 'admin',   label: 'Admin',          authRequired: true, adminOnly: true },
];

class MinecraftApp {
  constructor() {
    this.root = null;
    this.user = auth.readUser();
    this.activeTab = 'gallery';
    this.subView = null; // null | 'form-new' | { mode:'edit', build }
  }

  mount(rootEl) {
    this.root = rootEl;
    this.render();
  }

  setTab(id) {
    const tab = TABS.find((t) => t.id === id);
    if (!tab) return;
    if (tab.authRequired && !this.user) {
      auth.showLogin((u) => {
        this.user = u;
        this.activeTab = id;
        this.render();
      });
      return;
    }
    if (tab.adminOnly && this.user?.role !== 'admin') return;
    this.activeTab = id;
    this.subView = null;
    this.render();
  }

  logout() {
    auth.clearUser();
    this.user = null;
    this.activeTab = 'gallery';
    this.subView = null;
    this.render();
  }

  async render() {
    if (!this.root) return;
    this.root.innerHTML = '';
    mountBackWidget(this.root, GAME_ID, GAME_LABEL, GAME_ACCENT);

    const app = createElement('section', { class: 'mc-app' });

    app.appendChild(this._renderHeader());
    app.appendChild(this._renderNav());

    const body = createElement('div');
    app.appendChild(body);
    this.root.appendChild(app);

    if (this.subView === 'form-new') {
      body.appendChild(renderBuildForm(null, {
        onCancel: () => { this.subView = null; this.render(); },
        onSubmit: async (data) => {
          try {
            await createBuild(data);
            toast('Build adicionada!', 'success');
            this.subView = null;
            this.render();
          } catch (err) {
            toast(err?.message || 'Falha ao adicionar build', 'error');
          }
        },
      }));
      return;
    }

    if (this.subView && this.subView.mode === 'edit') {
      const target = this.subView.build;
      body.appendChild(renderBuildForm(target, {
        isEdit: true,
        onCancel: () => { this.subView = null; this.render(); },
        onSubmit: async (data) => {
          try {
            await updateBuild(target.id, data);
            toast('Build atualizada', 'success');
            this.subView = null;
            this.render();
          } catch (err) {
            toast(err?.message || 'Falha ao atualizar', 'error');
          }
        },
      }));
      return;
    }

    if (this.activeTab === 'gallery') {
      const node = await renderGalleryPage({
        requireLogin: () => {
          auth.showLogin((u) => { this.user = u; this.render(); });
        },
      });
      body.appendChild(node);
    } else if (this.activeTab === 'panel') {
      const ctx = {
        user: this.user,
        onAdd: () => { this.subView = 'form-new'; this.render(); },
        onEdit: (b) => { this.subView = { mode: 'edit', build: b }; this.render(); },
        requestRender: () => this.render(),
      };
      const node = await renderMyPanelPage(ctx);
      body.appendChild(node);
    } else if (this.activeTab === 'lists') {
      const ctx = {
        user: this.user,
        requestRender: () => this.render(),
      };
      const node = await renderListsPage(ctx);
      body.appendChild(node);
    } else if (this.activeTab === 'admin') {
      if (this.user?.role !== 'admin') {
        body.appendChild(createElement('div', {
          class: 'mc-empty',
          textContent: 'Acesso restrito a administradores.',
        }));
        return;
      }
      const ctx = {
        user: this.user,
        onEdit: (b) => { this.subView = { mode: 'edit', build: b }; this.render(); },
        requestRender: () => this.render(),
      };
      const node = await renderAdminPage(ctx);
      body.appendChild(node);
    }
  }

  _renderHeader() {
    const head = createElement('header', { class: 'mc-header' });
    head.appendChild(createElement('h1', {
      innerHTML: 'Minecraft <span class="accent">Builds</span>',
    }));
    const actions = createElement('div', { class: 'mc-header-actions' });
    if (this.user) {
      actions.appendChild(createElement('span', {
        style: 'font-size:11px;color:var(--text2,#aaa)',
        textContent: `${this.user.username} (${this.user.role})`,
      }));
      const logout = createElement('button', { class: 'mc-btn', textContent: '⏻ Sair' });
      on(logout, 'click', async () => {
        const ok = await confirmDialog('Terminar sessão Minecraft?');
        if (!ok) return;
        this.logout();
      });
      actions.appendChild(logout);
    } else {
      const login = createElement('button', { class: 'mc-btn primary', textContent: '🔑 Iniciar sessão' });
      on(login, 'click', () => {
        auth.showLogin((u) => { this.user = u; this.render(); });
      });
      actions.appendChild(login);
    }
    head.appendChild(actions);
    return head;
  }

  _renderNav() {
    const nav = createElement('nav', { class: 'mc-nav' });
    TABS.forEach((t) => {
      if (t.adminOnly && this.user?.role !== 'admin') return;
      const btn = createElement('button', { class: 'mc-nav-btn', textContent: t.label });
      if (t.id === this.activeTab && !this.subView) btn.classList.add('on');
      on(btn, 'click', () => this.setTab(t.id));
      nav.appendChild(btn);
    });
    return nav;
  }

  teardown() {
    auth.hideLogin();
    this.root = null;
  }
}

// ─── Game module surface ───────────────────────────────────────────

let appInstance = null;

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

function hideOtherGameRoots(self) {
  document.querySelectorAll('.game-root').forEach((node) => {
    if (node !== self) node.classList.remove('on');
  });
}

export const minecraftGame = {
  id: GAME_ID,
  label: GAME_LABEL,

  mount() {
    const el = root();
    if (!el) return;
    hideOtherGameRoots(el);
    el.classList.add('on');
    el.innerHTML = '';
    appInstance = new MinecraftApp();
    appInstance.mount(el);
  },

  unmount() {
    const el = root();
    if (!el) return;

    if (appInstance) {
      try { appInstance.teardown(); } catch {}
      appInstance = null;
    }
    // NÃO limpar a sessão aqui — o user pode estar a voltar à landing
    // (via "← Início") e queremos preservar o estado de admin/login.
    // O logout explícito (botão "⏻ Sair") é que limpa.

    el.classList.remove('on');
    el.innerHTML = '';
    unmountBackWidget(GAME_ID);
  },
};

export default minecraftGame;
