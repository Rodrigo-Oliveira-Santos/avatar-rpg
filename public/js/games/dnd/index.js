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
  listAll as listAllChars,
  deleteCharacter,
} from '../../api/dnd-characters.js';
import { listIncomingPending } from './dnd-trade.js';

import { renderCharacterPage } from './pages/CharacterPage.js';
import { renderSkillsPage } from './pages/SkillsPage.js';
import { renderSpellsPage } from './pages/SpellsPage.js';
import { renderInventoryPage } from './pages/InventoryPage.js';
import { renderHubPage } from './pages/HubPage.js';
import { renderTradePage } from './pages/TradePage.js';
import { renderImportPage } from './pages/ImportPage.js';
import { renderAdminPage } from './pages/AdminPage.js';

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
  { id: 'admin',     label: 'Admin', adminOnly: true },
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
    // Quando admin clica "Editar" noutro user na tab Admin, guardamos
    // aqui o username alvo. As tabs sheet/skills/spells/inventory
    // editam essa ficha; saves vão para esse username.
    this.impersonatedUsername = null;
    this.impersonatedCharacter = null;
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

  _isAdmin() {
    return (this.user?.role || 'player') === 'admin';
  }

  /**
   * Activa o modo "editar como outro user" (apenas admin). Carrega a
   * ficha do alvo, troca para a tab "sheet" e re-renderiza.
   */
  async startImpersonation(targetUsername) {
    if (!this._isAdmin()) return;
    const target = String(targetUsername || '').trim().toLowerCase();
    if (!target || target === this.user.username) {
      this.stopImpersonation();
      return;
    }
    await this.flush(); // grava o que estiver pendente antes de trocar
    const raw = await loadChar(target);
    this.impersonatedCharacter = new DnDCharacter(raw || { identity: { name: capitalize(target) } });
    if (!this.impersonatedCharacter.identity.name) {
      this.impersonatedCharacter.identity.name = capitalize(target);
    }
    this.impersonatedUsername = target;
    this.activeTab = 'sheet';
    this._dirty = false;
    this.render();
  }

  async stopImpersonation() {
    if (!this.impersonatedUsername) return;
    await this.flush();
    this.impersonatedUsername = null;
    this.impersonatedCharacter = null;
    this.activeTab = 'admin';
    this._dirty = false;
    this.render();
  }

  /** Username alvo de saves & XP/ouro nas tabs de edição. */
  _editTargetUsername() {
    return this.impersonatedUsername || this.user?.username;
  }

  /** Ficha actualmente exposta às tabs de edição. */
  _editTargetCharacter() {
    return this.impersonatedCharacter || this.character;
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
    if (!this._dirty) return;
    const username = this._editTargetUsername();
    const character = this._editTargetCharacter();
    if (!username || !character) return;
    this._dirty = false;
    try {
      await saveChar(username, character.toJSON());
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
    // Se for o user da sessão ou o alvo de impersonate, recarrega.
    if (targetUsername === this.user?.username) {
      this.character = c;
    }
    if (targetUsername === this.impersonatedUsername) {
      this.impersonatedCharacter = c;
    }
    if (targetUsername === this.user?.username || targetUsername === this.impersonatedUsername) {
      this.render();
    }
  }

  setTab(id) {
    const tab = ALL_TABS.find((t) => t.id === id);
    if (!tab) return;
    if (tab.gmOnly && !this._isGm()) return;
    if (tab.adminOnly && !this._isAdmin()) return;
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
      isAdmin: this._isAdmin(),
      canEditXp: isGm,
      canEditGold: isGm,
      requestRender: () => { this._dirty = true; this.render(); },
      touch: () => { this._dirty = true; },
      grantReward: (target, payload) => this.grantReward(target, payload),
      onAddXp: () => this._askAddXp(),
      // Impersonate helpers (admin):
      impersonatedUsername: this.impersonatedUsername,
      startImpersonation: (u) => this.startImpersonation(u),
      stopImpersonation: () => this.stopImpersonation(),
      deleteCharacter: async (u) => {
        const removed = await deleteCharacter(u);
        // Se apagamos a ficha do user impersonado, sair desse modo.
        if (removed && u === this.impersonatedUsername) {
          this.impersonatedUsername = null;
          this.impersonatedCharacter = null;
        }
        return removed;
      },
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
    this._editTargetCharacter().addXp(n);
    this._dirty = true;
    this.render();
  }

  render() {
    if (!this.root) return;
    this.root.innerHTML = '';
    mountBackWidget(this.root, GAME_ID, GAME_LABEL, GAME_ACCENT);

    const app = createElement('section', { class: 'dnd-app' });
    app.appendChild(this._renderHeader());
    if (this.impersonatedUsername) {
      app.appendChild(this._renderImpersonationBanner());
    }
    app.appendChild(this._renderNav());

    const pageWrap = createElement('div');
    this._renderActivePage(pageWrap);
    app.appendChild(pageWrap);

    this.root.appendChild(app);
  }

  _renderImpersonationBanner() {
    const banner = createElement('div', { class: 'dnd-impersonate-banner' });
    banner.appendChild(createElement('span', {
      textContent: `👁 A editar como ${this.impersonatedUsername} (modo admin)`,
    }));
    const back = createElement('button', { class: 'dnd-btn', textContent: '← Voltar a mim' });
    on(back, 'click', () => this.stopImpersonation());
    banner.appendChild(back);
    return banner;
  }

  _renderHeader() {
    const c = this._editTargetCharacter();
    const head = createElement('header', { class: 'dnd-header' });

    const idBox = createElement('div', { class: 'dnd-header-id' });
    idBox.appendChild(createElement('div', {
      class: 'name',
      textContent: c.identity.name || (this.impersonatedUsername || this.user.username),
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
      if (t.adminOnly && !this._isAdmin()) return;
      const btn = createElement('button', { class: 'dnd-nav-btn', textContent: t.label });
      if (t.id === this.activeTab) btn.classList.add('on');
      // Slot para badges contextuais (Trade: pending; Hub: players).
      // Os valores são preenchidos assincronamente em `_refreshNavBadges`
      // para não bloquear a render do nav.
      if (t.id === 'trade' || t.id === 'hub') {
        const badge = createElement('span', {
          class: `nav-badge dnd-nav-badge dnd-nav-badge-${t.id}`,
          hidden: true,
        });
        btn.appendChild(badge);
      }
      on(btn, 'click', () => this.setTab(t.id));
      nav.appendChild(btn);
    });
    // Disparar refresh assíncrono (não bloqueia o paint inicial)
    this._refreshNavBadges(nav).catch(() => {});
    return nav;
  }

  /**
   * Atualiza os badges do nav assincronamente:
   *  • Trade — número de trades pendentes recebidos pelo user actual.
   *  • Hub — número total de fichas D&D registadas.
   * Mostra/esconde com base em `count > 0`.
   */
  async _refreshNavBadges(nav) {
    if (!nav) return;
    const me = this.user?.username;
    if (!me) return;

    // Trade pending (síncrono — read localStorage; rápido)
    try {
      const pending = listIncomingPending(me).length;
      const tradeBadge = nav.querySelector('.dnd-nav-badge-trade');
      if (tradeBadge) {
        tradeBadge.textContent = String(pending);
        tradeBadge.hidden = pending === 0;
      }
    } catch {}

    // Hub player count (async — pode falar com Supabase)
    try {
      const all = await listAllChars();
      const count = Array.isArray(all) ? all.length : 0;
      const hubBadge = nav.querySelector('.dnd-nav-badge-hub');
      if (hubBadge) {
        hubBadge.textContent = String(count);
        hubBadge.hidden = count === 0;
      }
    } catch {}
  }

  _renderActivePage(wrap) {
    const ctx = this.ctx();
    const editChar = this._editTargetCharacter();
    switch (this.activeTab) {
      case 'sheet':
        wrap.appendChild(renderCharacterPage(editChar, ctx));
        break;
      case 'skills':
        wrap.appendChild(renderSkillsPage(editChar, ctx));
        break;
      case 'spells':
        wrap.appendChild(renderSpellsPage(editChar, ctx));
        break;
      case 'inventory':
        wrap.appendChild(renderInventoryPage(editChar, ctx));
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
      case 'admin':
        renderAdminPage(ctx).then((el) => wrap.appendChild(el));
        break;
    }
  }

  logout() {
    this._stopAutosave();
    auth.clearUser();
    this.user = null;
    this.character = null;
    this.impersonatedUsername = null;
    this.impersonatedCharacter = null;
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
    this.impersonatedUsername = null;
    this.impersonatedCharacter = null;
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

function hideOtherGameRoots(self) {
  document.querySelectorAll('.game-root').forEach((node) => {
    if (node !== self) node.classList.remove('on');
  });
}

export const dndGame = {
  id: GAME_ID,
  label: GAME_LABEL,

  async mount() {
    const el = root();
    if (!el) return;
    hideOtherGameRoots(el);
    el.classList.add('on');
    el.innerHTML = '';
    appInstance = new DnDApp();
    await appInstance.boot(el);
  },

  async unmount() {
    const el = root();
    if (!el) return;

    // Tornar o jogo invisível imediatamente — antes de qualquer
    // `await`. Caso contrário o router (que pode não esperar pela
    // promessa) já mounta a landing e ficam dois roots `.on` ao mesmo
    // tempo (Avatar/D&D a aparecer por baixo da landing).
    el.classList.remove('on');
    el.innerHTML = '';
    unmountBackWidget(GAME_ID);

    if (appInstance) {
      try { await appInstance.teardown(); } catch {}
      appInstance = null;
    }
    // NÃO limpar a sessão aqui — o user pode estar a voltar à landing
    // (via "← Início") e queremos preservar o estado de admin/login.
    // O logout explícito (botão "⏻ Sair") é que limpa.
  },
};

export default dndGame;
