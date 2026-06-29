/**
 * D&D 5e — game entrypoint.
 *
 * Responsabilidades:
 *  • Mount/unmount completo (autosave flush + logout silencioso).
 *  • Login overlay partilhado via `lib/shared-auth.js` (chave `dnd_user`).
 *  • Tabs internas (Ficha / Perícias / Magias / Inventário / Trade /
 *    Importar / Hub), re-render imperativo e autosave periódico.
 *  • Passa contexto às páginas (`canEditXp`, `isGm`, `grantReward`, …).
 *
 * A app inteira fica dentro de `[data-game-root="dnd"]`.
 */

import { createElement, on } from '../../utils/dom.js';
import { toast, confirmDialog } from '../../utils/toast.js';
import { mountBackWidget, unmountBackWidget } from '../back-widget.js';
import { createSharedAuth } from '../lib/shared-auth.js';

import { DnDCharacter, totalLevel, classesSummary } from './dnd-character.js';
import { CLASSES } from './data/srd.js';
import {
  load as loadChar,
  save as saveChar,
  ensureRegistered,
} from '../../api/dnd-characters.js';

import { renderCharacterPage } from './pages/CharacterPage.js';
import { renderSkillsPage } from './pages/SkillsPage.js';
import { renderSpellsPage } from './pages/SpellsPage.js';
import { renderInventoryPage } from './pages/InventoryPage.js';
import { renderHubPage } from './pages/HubPage.js';
import { renderTradePage } from './pages/TradePage.js';
import { renderImportPage } from './pages/ImportPage.js';

const ROOT_SELECTOR = '[data-game-root="dnd"]';
const GAME_ID = 'dnd';
const GAME_LABEL = 'D&D 5e';
const GAME_ACCENT = '#dc2626';

const auth = createSharedAuth({
  storageKey: 'dnd_user',
  defaultTitle: 'Entrar — D&D 5e',
  hintText: null, // sem hints (esconde "Perfis de teste" do Avatar)
  brand: { logo: '⚔ D&D 5e', accent: '#dc2626' },
});

// ─── Tabs ──────────────────────────────────────────────────────────

const ALL_TABS = [
  { id: 'sheet',     label: 'Ficha' },
  { id: 'skills',    label: 'Perícias' },
  { id: 'spells',    label: 'Magias' },
  { id: 'inventory', label: 'Inventário' },
  { id: 'trade',     label: 'Trade' },
  { id: 'hub',       label: 'Hub' },
  { id: 'import',    label: 'Importar', gmOnly: true },
];

// ─── DnDApp ────────────────────────────────────────────────────────

class DnDApp {
  constructor() {
    this.root = null;
    this.user = null;
    this.character = null;
    this.activeTab = 'sheet';
    this._autosaveTimer = null;
    this._dirty = false;
  }

  async boot(rootEl) {
    this.root = rootEl;
    this.user = auth.readUser();
    if (!this.user) {
      auth.showLogin(async (user) => {
        this.user = user;
        ensureRegistered(user.username, user.role);
        await this.loadAndRender();
      });
      return;
    }
    ensureRegistered(this.user.username, this.user.role);
    await this.loadAndRender();
  }

  async loadAndRender() {
    const username = this.user.username;
    const raw = await loadChar(username);
    this.character = new DnDCharacter(raw || {});
    if (!this.character.identity.name) {
      this.character.identity.name = capitalize(username);
    }
    this.render();
    this._startAutosave();
  }

  _startAutosave() {
    if (this._autosaveTimer) clearInterval(this._autosaveTimer);
    this._autosaveTimer = setInterval(() => this.flush(), 3000);
  }

  _stopAutosave() {
    if (this._autosaveTimer) clearInterval(this._autosaveTimer);
    this._autosaveTimer = null;
  }

  async flush() {
    if (!this._dirty || !this.user || !this.character) return;
    this._dirty = false;
    try {
      await saveChar(this.user.username, this.character.toJSON());
    } catch (err) {
      console.warn('[dnd] autosave failed', err);
    }
  }

  async grantReward(targetUsername, { xp = 0, gold = 0 } = {}) {
    if (!targetUsername) return;
    const raw = await loadChar(targetUsername);
    const c = new DnDCharacter(raw || { identity: { name: capitalize(targetUsername) } });
    if (xp) c.addXp(xp);
    if (gold) c.addGold(gold);
    await saveChar(targetUsername, c.toJSON());
    if (targetUsername === this.user?.username) {
      this.character = c;
      this.render();
    }
  }

  setTab(id) {
    const tab = ALL_TABS.find((t) => t.id === id);
    if (!tab) return;
    if (tab.gmOnly && !this._isGm()) return;
    this.activeTab = id;
    this.render();
  }

  _isGm() {
    const role = this.user?.role || 'player';
    return role === 'gm' || role === 'admin';
  }

  ctx() {
    const isGm = this._isGm();
    return {
      currentUser: this.user,
      isGm,
      canEditXp: isGm,
      canEditGold: isGm,
      requestRender: () => { this._dirty = true; this.render(); },
      touch: () => { this._dirty = true; },
      grantReward: (target, payload) => this.grantReward(target, payload),
      onAddXp: () => this._askAddXp(),
      // helpers expostos para páginas que precisam
      loadChar,
      saveChar,
    };
  }

  async _askAddXp() {
    if (!this._isGm()) {
      toast('Apenas o GM pode atribuir XP.', 'warning');
      return;
    }
    const v = window.prompt('Quanto XP atribuir?', '100');
    if (v == null) return;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return;
    this.character.addXp(n);
    this._dirty = true;
    this.render();
  }

  render() {
    if (!this.root) return;
    this.root.innerHTML = '';
    mountBackWidget(this.root, GAME_ID, GAME_LABEL, GAME_ACCENT);

    const app = createElement('section', { class: 'dnd-app' });
    app.appendChild(this._renderHeader());
    app.appendChild(this._renderNav());

    const pageWrap = createElement('div');
    this._renderActivePage(pageWrap);
    app.appendChild(pageWrap);

    this.root.appendChild(app);
  }

  _renderHeader() {
    const c = this.character;
    const head = createElement('header', { class: 'dnd-header' });

    const idBox = createElement('div', { class: 'dnd-header-id' });
    idBox.appendChild(createElement('div', {
      class: 'name',
      textContent: c.identity.name || this.user.username,
    }));
    const metaText = [
      c.identity.race,
      classesSummary(c) || (CLASSES.find((cl) => cl.id === c.identity.class)?.label || c.identity.class),
      `Nv ${totalLevel(c)}`,
    ].filter(Boolean).join(' · ');
    idBox.appendChild(createElement('div', { class: 'meta', textContent: metaText }));
    head.appendChild(idBox);

    const actions = createElement('div', { class: 'dnd-header-actions' });
    actions.appendChild(createElement('span', {
      style: 'font-size:11px;color:var(--text2,#aaa)',
      textContent: `${this.user.username} (${this.user.role})`,
    }));
    const logout = createElement('button', { class: 'dnd-btn', textContent: '⏻ Sair' });
    on(logout, 'click', async () => {
      const ok = await confirmDialog('Terminar sessão D&D?');
      if (!ok) return;
      await this.flush();
      this.logout();
    });
    actions.appendChild(logout);
    head.appendChild(actions);

    return head;
  }

  _renderNav() {
    const nav = createElement('nav', { class: 'dnd-nav' });
    ALL_TABS.forEach((t) => {
      if (t.gmOnly && !this._isGm()) return;
      const btn = createElement('button', { class: 'dnd-nav-btn', textContent: t.label });
      if (t.id === this.activeTab) btn.classList.add('on');
      on(btn, 'click', () => this.setTab(t.id));
      nav.appendChild(btn);
    });
    return nav;
  }

  _renderActivePage(wrap) {
    const ctx = this.ctx();
    switch (this.activeTab) {
      case 'sheet':
        wrap.appendChild(renderCharacterPage(this.character, ctx));
        break;
      case 'skills':
        wrap.appendChild(renderSkillsPage(this.character, ctx));
        break;
      case 'spells':
        wrap.appendChild(renderSpellsPage(this.character, ctx));
        break;
      case 'inventory':
        wrap.appendChild(renderInventoryPage(this.character, ctx));
        break;
      case 'trade':
        renderTradePage(this.character, ctx).then((el) => wrap.appendChild(el));
        break;
      case 'hub':
        renderHubPage(this.character, ctx).then((el) => wrap.appendChild(el));
        break;
      case 'import':
        wrap.appendChild(renderImportPage(ctx));
        break;
    }
  }

  logout() {
    this._stopAutosave();
    auth.clearUser();
    this.user = null;
    this.character = null;
    this.activeTab = 'sheet';
    if (this.root) this.root.innerHTML = '';
    auth.showLogin(async (user) => {
      this.user = user;
      ensureRegistered(user.username, user.role);
      await this.loadAndRender();
    });
  }

  async teardown() {
    await this.flush();
    this._stopAutosave();
    auth.hideLogin();
    this.user = null;
    this.character = null;
  }
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ─── Game module surface ───────────────────────────────────────────

let appInstance = null;

function root() {
  return document.querySelector(ROOT_SELECTOR);
}

export const dndGame = {
  id: GAME_ID,
  label: GAME_LABEL,

  async mount() {
    const el = root();
    if (!el) return;
    el.classList.add('on');
    el.innerHTML = '';
    appInstance = new DnDApp();
    await appInstance.boot(el);
  },

  async unmount() {
    const el = root();
    if (!el) return;

    if (appInstance) {
      try { await appInstance.teardown(); } catch {}
      appInstance = null;
    }
    auth.clearUser();

    el.classList.remove('on');
    el.innerHTML = '';
    unmountBackWidget(GAME_ID);
  },
};

export default dndGame;
