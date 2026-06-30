/**
 * Hub Page Renderer
 * Displays player profile cards with simplified stats
 */

import { createElement, on } from '../utils/dom.js';
import { toast, promptDialog } from '../utils/toast.js';
import { getPlayers, getPlayersAsync, getPlayerCount } from './data.js';
import { CharacterModal } from './CharacterModal.js';
import { LootDelivery } from './LootDelivery.js';
import { GroupRewards } from './GroupRewards.js';
import { GiftTransfer, GIFT_TRANSFER_UPDATED_EVENT } from './GiftTransfer.js';
import { log } from '../admin/LogService.js';
import { TradeManager, TradeModal, TRADE_UPDATED_EVENT, getTradeNotificationCount, updateTradeBadge } from '../trade/index.js';
import { StatusEffectManager, STATUS_EFFECTS_UPDATED_EVENT } from './StatusEffectManager.js';
import { normalizeStatusEffect } from '../utils/statusEffects.js';
import { listStaged as listMonstersStaged } from '../api/monsters.js';
import { MONSTERS_UPDATED_EVENT } from '../monsters/index.js';
import { EncounterPanel, ENCOUNTER_UPDATED_EVENT } from '../combat/index.js';

const ELEMENT_LABELS = {
  fire: 'Fogo',
  water: 'Água',
  earth: 'Terra',
  air: 'Ar',
  none: 'Sem Dobra',
};

const sameUsername = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

function updatePlayerCountBadge(count) {
  const badge = document.querySelector('[data-player-count]');
  if (!badge) return;
  const n = Math.max(0, Number(count) || 0);
  badge.textContent = String(n);
  if (n > 0) badge.removeAttribute('hidden');
  else badge.setAttribute('hidden', '');
}

const tradeSummary = (side = {}) => {
  const parts = [];

  if (Array.isArray(side.items) && side.items.length > 0) {
    parts.push(side.items.map((item) => `${item.name} x${item.quantity}`).join(', '));
  }

  if (side.gold > 0) {
    parts.push(`${side.gold} ouro`);
  }

  return parts.join(' • ') || 'Nada';
};

/**
 * HubPage Class
 */
export class HubPage {
  /**
   * @param {HTMLElement} container - DOM container for the hub
   * @param {object} character - Character instance
   * @param {object} authManager - AuthManager instance
   */
  constructor(container, character, authManager) {
    this.container = container;
    this.character = character;
    this.authManager = authManager;
    this.characterModal = new CharacterModal();
    this.tradeManager = new TradeManager();
    this.tradeModal = new TradeModal(this.tradeManager, this.getCurrentUsername());
    this.statusEffectManager = new StatusEffectManager({ authManager });
    this.encounterPanel = null;
    this.activeEncounter = null;
    this.groupRewards = null;
    this.lootDelivery = null;
    this.giftTransfer = null;
    this._refreshTimer = null;

    this.handleTradeUpdate = this.handleTradeUpdate.bind(this);
    this.handleStatusEffectsUpdate = () => this.render();
    this.handleMonstersUpdate = () => this.render();
    this.handleEncounterUpdate = (event) => {
      this.activeEncounter = event.detail || null;
      this.render();
    };
    window.addEventListener(TRADE_UPDATED_EVENT, this.handleTradeUpdate);
    window.addEventListener(STATUS_EFFECTS_UPDATED_EVENT, this.handleStatusEffectsUpdate);
    window.addEventListener(MONSTERS_UPDATED_EVENT, this.handleMonstersUpdate);
    window.addEventListener(ENCOUNTER_UPDATED_EVENT, this.handleEncounterUpdate);

    // Realtime: refresh the in-battle monster overlay when any monster
    // row changes in the DB (other browsers / GM Control).
    this._unsubMonstersRealtime = null;
    this._unsubTradesRealtime = null;
    this._realtimeSeq = (this._realtimeSeq || 0) + 1;
    const seq = this._realtimeSeq;
    import('../api/monsters.js')
      .then((m) => m.subscribe(() => this.render()))
      .then((unsub) => {
        // Drop the channel if this HubPage was destroyed before
        // subscribe resolved.
        if (this._realtimeSeq !== seq) { unsub?.(); return; }
        this._unsubMonstersRealtime = unsub;
      })
      .catch(() => {});

    // Realtime: trades. New incoming proposal → toast + badge refresh.
    this.tradeManager.subscribe(() => {
      const user = this.getCurrentUsername();
      updateTradeBadge(user);
      this.render();
    }).then((unsub) => {
      if (this._realtimeSeq !== seq) { unsub?.(); return; }
      this._unsubTradesRealtime = unsub;
    }).catch(() => {});

    this.render();
  }

  getCurrentUsername() {
    return this.authManager?.getUser?.()?.username || null;
  }

  handleTradeUpdate(event) {
    const trade = event.detail?.trade;
    const type = event.detail?.type;
    const currentUsername = this.getCurrentUsername();

    this.tradeModal.currentUsername = currentUsername;
    updateTradeBadge(currentUsername);

    // Surface a toast on the recipient's side when a new proposal lands —
    // works across browsers because the realtime channel also dispatches
    // this event via the manager.
    if (
      type === 'created'
      && currentUsername
      && trade
      && sameUsername(trade.to_username || trade.to, currentUsername)
    ) {
      toast(`${trade.from_username || trade.from} propôs uma troca contigo.`, 'info', 6000);
    }

    if (
      type === 'accepted'
      && currentUsername
      && trade
      && (sameUsername(trade.from_username || trade.from, currentUsername)
       || sameUsername(trade.to_username   || trade.to,   currentUsername))
    ) {
      this.syncCurrentCharacter(currentUsername);
      toast('Troca concluída.', 'success');
    }

    this.refresh();
  }

  syncCurrentCharacter(username = this.getCurrentUsername()) {
    if (!username || !this.character?.load) return;

    try {
      const stored = localStorage.getItem(`avatar_rpg_character_${username}`);
      if (stored) {
        this.character.load(JSON.parse(stored));
      }
    } catch {
      toast('Não foi possível atualizar a tua ficha após a troca.', 'warning');
    }
  }

  render() {
    this.characterModal.close();
    this.tradeModal.currentUsername = this.getCurrentUsername();
    this.container.innerHTML = '';

    const currentUsername = this.getCurrentUsername();
    const isGameMaster = this.authManager?.hasRole('gm');
    const incomingTradeCount = getTradeNotificationCount(currentUsername);

    updateTradeBadge(currentUsername);

    // Header rendered immediately with a placeholder count; refreshed
    // below once Supabase responds.
    const header = createElement('div', { class: 'hub-header' });
    header.appendChild(createElement('div', { class: 'hub-title', textContent: 'Hub de Jogadores' }));
    const countEl = createElement('div', { class: 'hub-count', textContent: '…' });
    header.appendChild(countEl);
    this.container.appendChild(header);

    // Encounter panel — shown to everyone (read-only for players, with
    // GM controls when the user is GM). The launcher / "Iniciar batalha"
    // button lives only on the GM Control tab so the layout doesn't
    // duplicate controls, but the order + turn indicator is shared so
    // players can see the battle they're part of.
    if (!this.encounterPanel) {
      const panelHost = createElement('div');
      this.container.appendChild(panelHost);
      this.encounterPanel = new EncounterPanel({
        host: panelHost,
        authManager: this.authManager,
        getCurrentUsername: () => this.getCurrentUsername(),
      });
    } else {
      this.container.appendChild(this.encounterPanel.root);
    }

    // Hub encounter overlay: when a battle is active, surface the monster
    // cards (with HP, defense, status effects) so the whole party can see
    // who they're facing. Players-only — the EncounterPanel above already
    // shows the order + GM controls.
    const encounterHost = createElement('section', { class: 'hub-encounter', hidden: true });
    encounterHost.appendChild(createElement('h2', { textContent: '⚔ Monstros em batalha' }));
    const encounterList = createElement('div', { class: 'hub-encounter-list' });
    encounterHost.appendChild(encounterList);
    this.container.appendChild(encounterHost);

    // Interactive ATLA map embed — cached on the instance so render()
    // doesn't reload the iframe every time a trade/status update fires.
    this.container.appendChild(this._getOrCreateMapSection());

    Promise.all([
      this.activeEncounter ? Promise.resolve(this.activeEncounter) : Promise.resolve(null),
      listMonstersStaged().then(() => null).catch(() => null), // warm cache only
      import('../api/monsters.js').then((m) => m.list()).catch(() => []),
    ])
      .then(([enc, , monsters]) => {
        const monsterIds = new Set(
          (enc?.combatants || [])
            .filter((c) => c.kind === 'monster' && c.ref_id)
            .map((c) => c.ref_id)
        );
        const fighting = monsters.filter((m) => monsterIds.has(m.id) && !m.is_dead);
        if (!fighting.length) {
          encounterHost.hidden = true;
          return;
        }
        encounterHost.hidden = false;
        encounterList.innerHTML = '';
        fighting.forEach((m) => encounterList.appendChild(this._renderMonsterCard(m)));
      })
      .catch((err) => console.warn('[HubPage] encounter monsters load', err));

    const gridHost = createElement('div');
    gridHost.appendChild(createElement('p', {
      class: 'hub-empty',
      textContent: 'A carregar jogadores…',
    }));
    this.container.appendChild(gridHost);

    // Load campaign roster (Supabase-first) and refresh nav badge.
    this._renderToken = (this._renderToken || 0) + 1;
    const token = this._renderToken;

    Promise.all([
      getPlayersAsync({ includeUnsaved: isGameMaster }),
      getPlayerCount(),
    ]).then(([players, totalCount]) => {
      // Ignore the result if a later render() superseded this one.
      if (token !== this._renderToken) return;

      countEl.textContent = `${totalCount} jogador${totalCount !== 1 ? 'es' : ''}`;
      updatePlayerCountBadge(totalCount);

      gridHost.innerHTML = '';
      if (players.length === 0) {
        gridHost.appendChild(createElement('div', {
          class: 'hub-empty',
          textContent: 'Nenhum jogador encontrado.',
        }));
        return;
      }

      const grid = createElement('div', { class: 'hub-grid' });
      players.forEach((player) => {
        grid.appendChild(this.createPlayerCard(player, currentUsername));
      });
      gridHost.appendChild(grid);

      // Trade + GM tools live BELOW the player grid (per design feedback).
      // Only re-render if not done in this pass.
      this._renderBelowGrid(currentUsername, incomingTradeCount);
    }).catch((err) => {
      if (token !== this._renderToken) return;
      console.warn('[HubPage.render] roster load failed, using local snapshot', err);
      const snapshot = getPlayers({ includeUnsaved: isGameMaster });
      countEl.textContent = `${snapshot.length} jogador${snapshot.length !== 1 ? 'es' : ''}`;
      updatePlayerCountBadge(snapshot.length);
      gridHost.innerHTML = '';
      const grid = createElement('div', { class: 'hub-grid' });
      snapshot.forEach((player) => {
        grid.appendChild(this.createPlayerCard(player, currentUsername));
      });
      gridHost.appendChild(grid);
      this._renderBelowGrid(currentUsername, incomingTradeCount);
    });
  }

  /**
   * Render the secondary content (trade tools + GM-only tools) below the
   * player grid. Kept in a separate method so both happy/fallback paths
   * append it after the cards.
   */
  _renderBelowGrid(currentUsername, incomingTradeCount) {
    if (currentUsername) {
      // Async — Supabase-backed listing. Fire-and-forget; errors degrade
      // to the empty state.
      this.renderTradeSection(currentUsername, incomingTradeCount).catch((err) => {
        console.warn('[HubPage] trade section render failed', err);
      });
    }
    if (this.authManager?.hasRole('gm')) {
      this.renderGMTools();
    }
  }

  async renderTradeSection(currentUsername, incomingTradeCount) {
    const trades = await this.tradeManager.getPendingTradesAsync(currentUsername);
    const incoming = trades.filter((trade) => sameUsername(trade.to_username, currentUsername));
    const outgoing = trades.filter((trade) => sameUsername(trade.from_username, currentUsername));

    // Skip rendering entirely when there is nothing to show.
    if (incoming.length === 0 && outgoing.length === 0) return;

    const section = createElement('section', { class: 'hub-trade-section' });
    const header = createElement('div', { class: 'hub-trade-section-header' });
    header.appendChild(createElement('h2', { textContent: 'Trocas' }));
    header.appendChild(createElement('small', {
      textContent: incomingTradeCount > 0 ? `${incomingTradeCount} proposta(s) recebida(s)` : '',
    }));
    section.appendChild(header);

    const columns = createElement('div', { class: 'hub-trade-columns' });
    columns.appendChild(this.createTradeColumn('Recebidas', incoming, true));
    columns.appendChild(this.createTradeColumn('Enviadas', outgoing, false));
    section.appendChild(columns);

    this.container.appendChild(section);
  }

  createTradeColumn(title, trades, isIncoming) {
    const column = createElement('div', { class: 'hub-trade-column' });
    column.appendChild(createElement('h3', { textContent: title }));

    if (trades.length === 0) {
      column.appendChild(createElement('p', {
        class: 'trade-empty-state',
        textContent: isIncoming ? 'Sem trocas recebidas.' : 'Sem trocas enviadas.',
      }));
      return column;
    }

    const list = createElement('div', { class: 'hub-trade-list' });

    trades.forEach((trade) => {
      const card = createElement('article', { class: 'hub-trade-card' });
      const content = createElement('div', { class: 'hub-trade-card-content' });
      const counterpart = isIncoming ? trade.from_username : trade.to_username;
      const offer = { items: trade.offer_items || [], gold: trade.offer_gold || 0 };
      const request = { items: trade.request_items || [], gold: trade.request_gold || 0 };

      content.appendChild(createElement('strong', { textContent: counterpart }));
      content.appendChild(createElement('p', { textContent: `Oferece: ${tradeSummary(offer)}` }));
      content.appendChild(createElement('p', { textContent: `Pede: ${tradeSummary(request)}` }));
      content.appendChild(createElement('small', {
        textContent: new Date(trade.created_at).toLocaleString('pt-PT'),
      }));

      const actions = createElement('div', { class: 'hub-trade-card-actions' });
      const viewButton = createElement('button', {
        type: 'button',
        textContent: isIncoming ? 'Responder' : 'Ver',
      });
      on(viewButton, 'click', () => this.tradeModal.showPending(trade));
      actions.appendChild(viewButton);

      card.append(content, actions);
      list.appendChild(card);
    });

    column.appendChild(list);
    return column;
  }

  /**
   * Render GM tools section (collapsible — same pattern as the map).
   */
  renderGMTools() {
    const STORAGE_KEY = 'avatar_rpg_hub_gmtools_collapsed';
    let collapsed = false;
    try { collapsed = localStorage.getItem(STORAGE_KEY) === '1'; } catch {}

    const section = createElement('div', {
      style: 'padding: 10px 12px; background: var(--bg2); border: 1px solid var(--gold); border-radius: 6px; margin-bottom: 14px;',
    });

    const header = createElement('div', {
      style: 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;',
    });
    const title = createElement('div', {
      style: 'font-size: 12px; font-weight: 600; color: var(--gold);',
      textContent: '⚔ Ferramentas GM',
    });
    const toggleBtn = createElement('button', {
      type: 'button',
      style: 'padding: 3px 10px; border-radius: 5px; border: 1px solid var(--gold); background: transparent; color: var(--gold); cursor: pointer; font-size: 11px;',
      textContent: collapsed ? '▼ Mostrar' : '▲ Esconder',
      title: collapsed ? 'Mostrar ferramentas' : 'Esconder ferramentas',
    });
    header.append(title, toggleBtn);
    section.appendChild(header);

    const body = createElement('div', { class: 'gm-tools-body' });
    if (collapsed) body.hidden = true;
    section.appendChild(body);

    on(toggleBtn, 'click', () => {
      const next = !body.hidden;
      body.hidden = next;
      toggleBtn.textContent = next ? '▼ Mostrar' : '▲ Esconder';
      toggleBtn.title = next ? 'Mostrar ferramentas' : 'Esconder ferramentas';
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch {}
    });

    const btnRow = createElement('div', { style: 'display: flex; gap: 8px; flex-wrap: wrap;' });

    const addGoldBtn = createElement('button', {
      style: 'padding: 5px 12px; border-radius: 5px; border: 1px solid var(--gold); background: transparent; color: var(--gold); cursor: pointer; font-size: 11px;',
      textContent: '💰 Dar Ouro',
    });
    on(addGoldBtn, 'click', async () => {
      const input = await promptDialog('Quanto ouro dar ao jogador?', { placeholder: 'Ex: 50' });
      const amount = parseInt(input, 10);
      if (!isNaN(amount) && amount > 0 && this.character) {
        this.character.addGold(amount);
        log('gm_reward', { type: 'gold', amount, target: 'self' }, 'gm');
        toast(`+${amount} 💰 ouro adicionado!`, 'success');
      }
    });
    btnRow.appendChild(addGoldBtn);

    const addXpBtn = createElement('button', {
      style: 'padding: 5px 12px; border-radius: 5px; border: 1px solid var(--accent); background: transparent; color: var(--accent); cursor: pointer; font-size: 11px;',
      textContent: '✨ Dar XP',
    });
    on(addXpBtn, 'click', async () => {
      const input = await promptDialog('Quanto XP dar ao jogador?', { placeholder: 'Ex: 200' });
      const amount = parseInt(input, 10);
      if (!isNaN(amount) && amount > 0 && this.character) {
        this.character.addXP(amount);
        log('gm_reward', { type: 'xp', amount, target: 'self' }, 'gm');
        toast(`+${amount} XP adicionado!`, 'success');
      }
    });
    btnRow.appendChild(addXpBtn);

    body.appendChild(btnRow);

    const groupRewardsContainer = createElement('div');
    on(groupRewardsContainer, 'group-rewards:updated', (event) => {
      const loggedUsername = this.getCurrentUsername();
      const updatedPlayers = event.detail?.players || [];

      if (loggedUsername && updatedPlayers.includes(loggedUsername)) {
        this.syncCurrentCharacter(loggedUsername);
      }

      this.refresh();
    });
    body.appendChild(groupRewardsContainer);

    if (!this.groupRewards) {
      this.groupRewards = new GroupRewards(groupRewardsContainer, this.authManager);
    } else {
      this.groupRewards.container = groupRewardsContainer;
    }
    this.groupRewards.render();

    const lootDeliveryContainer = createElement('div');
    body.appendChild(lootDeliveryContainer);

    if (!this.lootDelivery) {
      this.lootDelivery = new LootDelivery(lootDeliveryContainer, this.authManager);
    } else {
      this.lootDelivery.container = lootDeliveryContainer;
    }
    this.lootDelivery.render();

    const giftContainer = createElement('div');
    on(giftContainer, GIFT_TRANSFER_UPDATED_EVENT, (event) => {
      const loggedUsername = this.getCurrentUsername();
      const updatedPlayers = event.detail?.players || [];

      if (loggedUsername && updatedPlayers.includes(loggedUsername)) {
        this.syncCurrentCharacter(loggedUsername);
      }

      this.refresh();
    });
    body.appendChild(giftContainer);

    if (!this.giftTransfer) {
      this.giftTransfer = new GiftTransfer(giftContainer, this.authManager);
    } else {
      this.giftTransfer.container = giftContainer;
    }
    this.giftTransfer.render();

    this.container.appendChild(section);
  }

  async openCharacterModal(player) {
    if (!this.authManager?.hasRole('gm')) return;

    const username = player?.username || player?.id;
    if (!username) {
      toast('Ficha completa indisponível para este jogador.', 'warning');
      return;
    }

    // 1. Prefer Supabase when enabled — that's where the canonical seed
    //    lives for test profiles like sokka/aang/toph.
    let characterData = null;
    try {
      const { isSupabaseEnabled } = await import('../api/config.js');
      if (isSupabaseEnabled()) {
        const { loadCharacter } = await import('../api/supabase-characters.js');
        characterData = await loadCharacter(username);
      }
    } catch (err) {
      console.warn('[HubPage.openCharacterModal] Supabase fetch failed', err);
    }

    // 2. Fall back to localStorage for offline / pure-local mode.
    if (!characterData && typeof localStorage !== 'undefined') {
      const rawCharacter = localStorage.getItem(`avatar_rpg_character_${username}`);
      if (rawCharacter) {
        try { characterData = JSON.parse(rawCharacter); } catch {}
      }
    }

    if (!characterData) {
      toast('Ficha completa indisponível para este jogador.', 'warning');
      return;
    }

    this.characterModal.show(characterData, username);
  }

  openTradeModal(targetUsername) {
    if (!this.getCurrentUsername()) {
      toast('Tens de iniciar sessão para propor trocas.', 'warning');
      return;
    }

    this.tradeModal.showCreate(targetUsername);
  }

  /**
   * Build (once) and return the interactive ATLA map embed section. The
   * iframe is cached on the instance so subsequent `render()` calls just
   * re-append the same node — preventing the map from reloading every
   * time a status effect / trade / monster update triggers a refresh.
   *
   * Map by iYiyo (https://iyiyo.itch.io/avatarlastairbendermap) — embedded
   * via the public itch.zone HTML host with a credit link back.
   *
   * Requires Cross-Origin Isolation (COOP=same-origin + COEP=require-corp)
   * because the Godot WASM runtime inside the iframe asks for
   * SharedArrayBuffer. Those headers are emitted by `public/serve.json`
   * (local dev via `serve`) and `netlify.toml` (production). The Supabase
   * client loader was moved to jsdelivr.net (which sends CORP) so that the
   * isolation doesn't break our other cross-origin fetches.
   */
  _getOrCreateMapSection() {
    if (this._mapSection) return this._mapSection;

    const STORAGE_KEY = 'avatar_rpg_hub_map_collapsed';
    let collapsed = false;
    try { collapsed = localStorage.getItem(STORAGE_KEY) === '1'; } catch {}

    const section = createElement('section', { class: 'hub-map-section' });

    const header = createElement('div', { class: 'hub-map-header' });
    const title = createElement('h2', {
      class: 'hub-map-title',
      textContent: '🗺 Mapa Interativo do Mundo',
    });
    const credit = createElement('a', {
      class: 'hub-map-credit',
      href: 'https://iyiyo.itch.io/avatarlastairbendermap',
      target: '_blank',
      rel: 'noopener noreferrer',
      textContent: 'por iYiyo ↗',
    });
    const toggleBtn = createElement('button', {
      type: 'button',
      class: 'hub-map-toggle',
      textContent: collapsed ? '▼ Mostrar' : '▲ Esconder',
      title: collapsed ? 'Mostrar mapa' : 'Esconder mapa',
    });

    const titleWrap = createElement('div', { class: 'hub-map-title-wrap' });
    titleWrap.append(title, credit);
    header.append(titleWrap, toggleBtn);
    section.appendChild(header);

    const frameWrap = createElement('div', {
      class: 'hub-map-frame-wrap',
    });
    if (collapsed) frameWrap.hidden = true;

    const iframe = createElement('iframe', {
      class: 'hub-map-iframe',
      src: 'https://html.itch.zone/html/8396265/index.html',
      title: 'Mapa Interativo Avatar: The Last Airbender',
      loading: 'lazy',
      allowfullscreen: 'true',
      scrolling: 'no',
    });
    iframe.setAttribute('allow', 'fullscreen; gamepad; gyroscope; accelerometer; cross-origin-isolated');
    iframe.setAttribute('frameborder', '0');
    frameWrap.appendChild(iframe);
    section.appendChild(frameWrap);

    on(toggleBtn, 'click', () => {
      const next = !frameWrap.hidden;
      frameWrap.hidden = next;
      toggleBtn.textContent = next ? '▼ Mostrar' : '▲ Esconder';
      toggleBtn.title = next ? 'Mostrar mapa' : 'Esconder mapa';
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch {}
    });

    this._mapSection = section;
    return section;
  }

  /**
   * Create a player profile card
   * @param {object} player
   * @param {string|null} currentUsername
   * @returns {HTMLElement}
   */
  createPlayerCard(player, currentUsername) {
    const canViewCharacter = this.authManager?.hasRole('gm');
    const playerUsername = player?.username || player?.id;
    const isCurrentUser = currentUsername && sameUsername(playerUsername, currentUsername);

    // Look up the matching combatant in the active encounter so we can
    // surface the initiative number and "on turn" glow on the card itself.
    const enc = this.activeEncounter;
    const combatantIdx = enc?.combatants?.findIndex(
      (c) => c.kind === 'character' && sameUsername(c.name, playerUsername)
    ) ?? -1;
    const combatant = combatantIdx >= 0 ? enc.combatants[combatantIdx] : null;
    const isOnTurn = combatant && enc && enc.current_turn_index === combatantIdx;

    const card = createElement('div', {
      class: `player-card${isCurrentUser ? ' is-self' : ''}${isOnTurn ? ' on-turn' : ''}`,
      title: canViewCharacter ? `Ver ficha completa de ${player.name}` : '',
    });
    if (combatant) {
      // Position the floating order badge on the card.
      const order = (combatant.turn_order ?? combatantIdx) + 1;
      card.style.position = 'relative';
      card.appendChild(createElement('div', {
        class: 'player-card-initiative',
        textContent: `#${order}`,
        title: `Posição #${order} (iniciativa ${combatant.initiative})`,
      }));
    }

    if (canViewCharacter) {
      card.style.cursor = 'pointer';
      on(card, 'click', () => this.openCharacterModal(player));
    }

    const header = createElement('div', { class: 'player-card-header' });
    header.appendChild(createElement('div', { class: 'player-name', textContent: player.name }));
    header.appendChild(createElement('div', { class: 'player-level', textContent: `Nv. ${player.level}` }));
    card.appendChild(header);

    if (player.unsaved) {
      card.appendChild(createElement('div', {
        style: 'font-size: 10px; color: var(--text3); margin-bottom: 8px; font-style: italic;',
        textContent: 'Sem ficha guardada',
      }));
    }

    const elementBadge = createElement('div', {
      class: `player-element ${player.element}`,
      textContent: ELEMENT_LABELS[player.element] || player.element,
    });
    card.appendChild(elementBadge);

    if (player.subclass) {
      card.appendChild(createElement('div', {
        style: 'font-size: 10px; color: var(--text2); margin-bottom: 8px; font-style: italic;',
        textContent: player.subclass,
      }));
    }

    const stats = createElement('div', { class: 'player-stats' });

    const statItems = [
      { label: 'VIDA', value: `${player.hp}/${player.hpMax}` },
      { label: 'CHI', value: `${player.chi}/${player.chiMax}` },
      { label: 'ESP', value: `${player.espiritu}/${player.espirituMax}` },
      { label: 'DEF', value: player.defense },
      { label: 'ESQ', value: player.dodge },
    ];

    statItems.forEach(({ label, value }) => {
      const stat = createElement('div', { class: 'player-stat' });
      stat.appendChild(createElement('div', { class: 'player-stat-lbl', textContent: label }));
      stat.appendChild(createElement('div', { class: 'player-stat-val', textContent: String(value) }));
      stats.appendChild(stat);
    });

    card.appendChild(stats);

    const hpPercent = player.hpMax > 0 ? (player.hp / player.hpMax) * 100 : 0;
    const hpBar = createElement('div', { class: 'player-hp-bar' });
    const hpFill = createElement('div', { class: 'player-hp-fill' });
    hpFill.style.width = `${hpPercent}%`;

    if (hpPercent <= 25) {
      hpFill.style.background = 'linear-gradient(90deg, #a01010, #c02020)';
    } else if (hpPercent <= 50) {
      hpFill.style.background = 'linear-gradient(90deg, #c07010, #e09020)';
    }

    hpBar.appendChild(hpFill);
    card.appendChild(hpBar);

    const allEffects = [
      ...(player.buffs || []).map((buff) => normalizeStatusEffect({ ...buff, type: 'positive' })),
      ...(player.debuffs || []).map((debuff) => normalizeStatusEffect({ ...debuff, type: 'negative' })),
    ].filter(Boolean);

    if (allEffects.length > 0) {
      const buffsContainer = createElement('div', { class: 'player-buffs' });
      allEffects.forEach((effect) => {
        const chip = createElement('span', { class: `player-buff ${effect.type}` });
        if (effect.icon) {
          chip.appendChild(createElement('span', { class: 'player-buff-icon', textContent: effect.icon }));
        }
        chip.appendChild(createElement('span', { class: 'player-buff-name', textContent: effect.name }));
        if (effect.description) chip.title = effect.description;
        buffsContainer.appendChild(chip);
      });
      card.appendChild(buffsContainer);
    }

    // Per-card action row: trade button (players only) + status effects
    // button (GM/Admin only). GM doesn't trade with players.
    const isGameMaster = this.authManager?.hasRole?.('gm');
    if (currentUsername && (!isCurrentUser || isGameMaster)) {
      const actionRow = createElement('div', { class: 'hub-player-actions' });
      on(actionRow, 'click', (event) => event.stopPropagation());

      // "Propor Troca" só faz sentido entre jogadores.
      if (!isCurrentUser && !isGameMaster) {
        const tradeButton = createElement('button', {
          type: 'button',
          textContent: 'Propor Troca',
        });
        tradeButton.disabled = !playerUsername;
        on(tradeButton, 'click', (event) => {
          event.stopPropagation();
          if (playerUsername) {
            this.openTradeModal(playerUsername);
          }
        });
        actionRow.appendChild(tradeButton);
      }

      if (isGameMaster) {
        const effectsButton = createElement('button', {
          type: 'button',
          class: 'hub-player-actions-secondary',
          textContent: '⚡ Efeitos',
        });
        on(effectsButton, 'click', (event) => {
          event.stopPropagation();
          this.statusEffectManager.openFor(player);
        });
        actionRow.appendChild(effectsButton);
      }

      // Only mount the row if it actually has a button.
      if (actionRow.children.length > 0) card.appendChild(actionRow);
    }

    return card;
  }

  /**
   * Render a compact, read-only monster card for the Hub overlay. Uses
   * the same visual idiom as MonstersPage but strips management actions
   * (they live in the dedicated GM tab).
   */
  _renderMonsterCard(monster) {
    const card = createElement('article', { class: 'monster-card in-play' });
    card.style.position = 'relative';

    // Floating order badge: if this monster has a combatant slot in the
    // active encounter, surface its position #N (matches player cards).
    const enc = this.activeEncounter;
    const combIdx = enc?.combatants?.findIndex(
      (c) => c.kind === 'monster' && c.ref_id === monster.id
    ) ?? -1;
    if (combIdx >= 0) {
      const comb = enc.combatants[combIdx];
      const order = (comb.turn_order ?? combIdx) + 1;
      card.appendChild(createElement('div', {
        class: 'player-card-initiative',
        textContent: `#${order}`,
        title: `Posição #${order} (iniciativa ${comb.initiative})`,
      }));
    }

    const head = createElement('header', { class: 'monster-card-head' });
    head.appendChild(createElement('h4', { textContent: monster.name }));
    head.appendChild(createElement('span', { class: 'monster-level', textContent: `Nv. ${monster.level}` }));
    card.appendChild(head);

    const hpRow = createElement('div', { class: 'monster-hp' });
    hpRow.appendChild(createElement('span', {
      class: 'monster-hp-text',
      textContent: `${monster.hp_current}/${monster.hp_max} HP`,
    }));
    const bar = createElement('div', { class: 'monster-hp-bar' });
    const fill = createElement('div', { class: 'monster-hp-fill' });
    const pct = monster.hp_max > 0 ? (monster.hp_current / monster.hp_max) * 100 : 0;
    fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    if (pct <= 25) fill.style.background = 'linear-gradient(90deg, #a01010, #c02020)';
    else if (pct <= 50) fill.style.background = 'linear-gradient(90deg, #c07010, #e09020)';
    bar.appendChild(fill);
    hpRow.appendChild(bar);
    card.appendChild(hpRow);

    const stats = createElement('div', { class: 'monster-stats' });
    [['DEF', monster.defense], ['ESQ', monster.dodge]].forEach(([label, value]) => {
      const cell = createElement('div', { class: 'monster-stat' });
      cell.appendChild(createElement('span', { class: 'monster-stat-lbl', textContent: label }));
      cell.appendChild(createElement('span', { class: 'monster-stat-val', textContent: String(value) }));
      stats.appendChild(cell);
    });
    card.appendChild(stats);

    const effects = Array.isArray(monster.status_effects)
      ? monster.status_effects.map(normalizeStatusEffect).filter(Boolean)
      : [];
    if (effects.length) {
      const chips = createElement('div', { class: 'player-buffs' });
      effects.forEach((effect) => {
        const chip = createElement('span', { class: `player-buff ${effect.type}` });
        if (effect.icon) chip.appendChild(createElement('span', { class: 'player-buff-icon', textContent: effect.icon }));
        chip.appendChild(createElement('span', { class: 'player-buff-name', textContent: effect.name }));
        if (effect.description) chip.title = effect.description;
        chips.appendChild(chip);
      });
      card.appendChild(chips);
    }

    return card;
  }

  refresh() {
    // Debounce: avoid multiple rapid re-renders from concurrent events
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = null;
      this.render();
    }, 50);
  }

  destroy() {
    window.removeEventListener(TRADE_UPDATED_EVENT, this.handleTradeUpdate);
    window.removeEventListener(STATUS_EFFECTS_UPDATED_EVENT, this.handleStatusEffectsUpdate);
    window.removeEventListener(MONSTERS_UPDATED_EVENT, this.handleMonstersUpdate);
    window.removeEventListener(ENCOUNTER_UPDATED_EVENT, this.handleEncounterUpdate);
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    // Bump the realtime seq so any in-flight subscribe resolutions drop
    // their channels instead of attaching to this disposed HubPage.
    this._realtimeSeq = (this._realtimeSeq || 0) + 1;
    if (typeof this._unsubMonstersRealtime === 'function') this._unsubMonstersRealtime();
    if (typeof this._unsubTradesRealtime === 'function') this._unsubTradesRealtime();
    this.encounterPanel?.destroy?.();
    this.encounterPanel = null;
    this.statusEffectManager?.close?.();
    this.characterModal.close();
    this._mapSection = null;
  }
}
