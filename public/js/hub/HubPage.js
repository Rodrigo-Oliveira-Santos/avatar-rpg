/**
 * Hub Page Renderer
 * Displays player profile cards with simplified stats
 */

import { createElement, on } from '../utils/dom.js';
import { toast, promptDialog } from '../utils/toast.js';
import { getPlayers } from './data.js';
import { CharacterModal } from './CharacterModal.js';
import { LootDelivery } from './LootDelivery.js';
import { GroupRewards } from './GroupRewards.js';
import { GiftTransfer, GIFT_TRANSFER_UPDATED_EVENT } from './GiftTransfer.js';
import { log } from '../admin/LogService.js';
import { TradeManager, TradeModal, TRADE_UPDATED_EVENT, getTradeNotificationCount, updateTradeBadge } from '../trade/index.js';

const ELEMENT_LABELS = {
  fire: 'Fogo',
  water: 'Água',
  earth: 'Terra',
  air: 'Ar',
  none: 'Sem Dobra',
};

const sameUsername = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

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
    this.groupRewards = null;
    this.lootDelivery = null;
    this.giftTransfer = null;
    this._refreshTimer = null;

    this.handleTradeUpdate = this.handleTradeUpdate.bind(this);
    window.addEventListener(TRADE_UPDATED_EVENT, this.handleTradeUpdate);
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

    if (
      type === 'accepted'
      && currentUsername
      && trade
      && (sameUsername(trade.from, currentUsername) || sameUsername(trade.to, currentUsername))
    ) {
      this.syncCurrentCharacter(currentUsername);
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
    const players = getPlayers();
    const incomingTradeCount = getTradeNotificationCount(currentUsername);

    updateTradeBadge(currentUsername);

    const header = createElement('div', { class: 'hub-header' });
    header.appendChild(createElement('div', { class: 'hub-title', textContent: 'Hub de Jogadores' }));
    header.appendChild(createElement('div', {
      class: 'hub-count',
      textContent: `${players.length} jogador${players.length !== 1 ? 'es' : ''}`,
    }));
    this.container.appendChild(header);

    if (currentUsername) {
      this.renderTradeSection(currentUsername, incomingTradeCount);
    }

    if (this.authManager?.hasRole('gm')) {
      this.renderGMTools();
    }

    if (players.length === 0) {
      this.container.appendChild(createElement('div', {
        class: 'hub-empty',
        textContent: 'Nenhum jogador encontrado.',
      }));
      return;
    }

    const grid = createElement('div', { class: 'hub-grid' });

    players.forEach((player) => {
      grid.appendChild(this.createPlayerCard(player, currentUsername));
    });

    this.container.appendChild(grid);
  }

  renderTradeSection(currentUsername, incomingTradeCount) {
    const trades = this.tradeManager.getPendingTrades(currentUsername);
    const incoming = trades.filter((trade) => sameUsername(trade.to, currentUsername));
    const outgoing = trades.filter((trade) => sameUsername(trade.from, currentUsername));

    const section = createElement('section', { class: 'hub-trade-section' });
    const header = createElement('div', { class: 'hub-trade-section-header' });
    header.appendChild(createElement('h2', { textContent: 'Trocas Pendentes' }));
    header.appendChild(createElement('small', {
      textContent: incomingTradeCount > 0 ? `${incomingTradeCount} proposta(s) recebida(s)` : 'Sem propostas recebidas',
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
      const counterpart = isIncoming ? trade.from : trade.to;

      content.appendChild(createElement('strong', { textContent: counterpart }));
      content.appendChild(createElement('p', { textContent: `Oferece: ${tradeSummary(trade.offer)}` }));
      content.appendChild(createElement('p', { textContent: `Pede: ${tradeSummary(trade.request)}` }));
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
   * Render GM tools section
   */
  renderGMTools() {
    const section = createElement('div', {
      style: 'padding: 10px 12px; background: var(--bg2); border: 1px solid var(--gold); border-radius: 6px; margin-bottom: 14px;',
    });

    const title = createElement('div', {
      style: 'font-size: 12px; font-weight: 600; color: var(--gold); margin-bottom: 8px;',
      textContent: '⚔ Ferramentas GM (simulado)',
    });
    section.appendChild(title);

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

    section.appendChild(btnRow);

    const groupRewardsContainer = createElement('div');
    on(groupRewardsContainer, 'group-rewards:updated', (event) => {
      const loggedUsername = this.getCurrentUsername();
      const updatedPlayers = event.detail?.players || [];

      if (loggedUsername && updatedPlayers.includes(loggedUsername)) {
        this.syncCurrentCharacter(loggedUsername);
      }

      this.refresh();
    });
    section.appendChild(groupRewardsContainer);

    if (!this.groupRewards) {
      this.groupRewards = new GroupRewards(groupRewardsContainer, this.authManager);
    } else {
      this.groupRewards.container = groupRewardsContainer;
    }
    this.groupRewards.render();

    const lootDeliveryContainer = createElement('div');
    section.appendChild(lootDeliveryContainer);

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
    section.appendChild(giftContainer);

    if (!this.giftTransfer) {
      this.giftTransfer = new GiftTransfer(giftContainer, this.authManager);
    } else {
      this.giftTransfer.container = giftContainer;
    }
    this.giftTransfer.render();

    this.container.appendChild(section);
  }

  openCharacterModal(player) {
    if (!this.authManager?.hasRole('gm')) return;

    const username = player?.id;
    if (!username || typeof localStorage === 'undefined') {
      toast('Ficha completa indisponível para este jogador.', 'warning');
      return;
    }

    const rawCharacter = localStorage.getItem(`avatar_rpg_character_${username}`);
    if (!rawCharacter) {
      toast('Ficha completa indisponível para este jogador.', 'warning');
      return;
    }

    try {
      const characterData = JSON.parse(rawCharacter);
      this.characterModal.show(characterData, username);
    } catch {
      toast('Não foi possível carregar a ficha do jogador.', 'error');
    }
  }

  openTradeModal(targetUsername) {
    if (!this.getCurrentUsername()) {
      toast('Tens de iniciar sessão para propor trocas.', 'warning');
      return;
    }

    this.tradeModal.showCreate(targetUsername);
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

    const card = createElement('div', {
      class: 'player-card',
      title: canViewCharacter ? `Ver ficha completa de ${player.name}` : '',
    });

    if (canViewCharacter) {
      card.style.cursor = 'pointer';
      on(card, 'click', () => this.openCharacterModal(player));
    }

    const header = createElement('div', { class: 'player-card-header' });
    header.appendChild(createElement('div', { class: 'player-name', textContent: player.name }));
    header.appendChild(createElement('div', { class: 'player-level', textContent: `Nv. ${player.level}` }));
    card.appendChild(header);

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
      ...(player.buffs || []).map((buff) => ({ ...buff, type: 'positive' })),
      ...(player.debuffs || []).map((debuff) => ({ ...debuff, type: 'negative' })),
    ];

    if (allEffects.length > 0) {
      const buffsContainer = createElement('div', { class: 'player-buffs' });
      allEffects.forEach((effect) => {
        buffsContainer.appendChild(createElement('span', {
          class: `player-buff ${effect.type}`,
          textContent: effect.name,
        }));
      });
      card.appendChild(buffsContainer);
    }

    if (currentUsername) {
      const actionRow = createElement('div', { class: 'hub-player-actions' });
      on(actionRow, 'click', (event) => event.stopPropagation());
      const tradeButton = createElement('button', {
        type: 'button',
        textContent: isCurrentUser ? 'És tu' : 'Propor Troca',
      });
      tradeButton.disabled = Boolean(isCurrentUser) || !playerUsername;

      on(tradeButton, 'click', (event) => {
        event.stopPropagation();
        if (!isCurrentUser && playerUsername) {
          this.openTradeModal(playerUsername);
        }
      });

      actionRow.appendChild(tradeButton);
      card.appendChild(actionRow);
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
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this.characterModal.close();
  }
}
