/**
 * Hub Page Renderer
 * Displays player profile cards with simplified stats
 */

import { createElement, on } from '../utils/dom.js';
import { toast, promptDialog } from '../utils/toast.js';
import { getPlayers } from './data.js';

const ELEMENT_LABELS = {
  fire: 'Fogo',
  water: 'Água',
  earth: 'Terra',
  air: 'Ar',
  none: 'Sem Dobra',
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
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const players = getPlayers();

    // Header
    const header = createElement('div', { class: 'hub-header' });
    header.appendChild(createElement('div', { class: 'hub-title', textContent: 'Hub de Jogadores' }));
    header.appendChild(createElement('div', {
      class: 'hub-count',
      textContent: `${players.length} jogador${players.length !== 1 ? 'es' : ''}`,
    }));
    this.container.appendChild(header);

    // GM Tools section (only for gm/admin)
    if (this.authManager?.hasRole('gm')) {
      this.renderGMTools();
    }

    // Mock notice
    const notice = createElement('div', {
      style: 'padding: 8px 12px; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; margin-bottom: 14px; font-size: 11px; color: var(--text3);',
      textContent: '⚠ Dados de exemplo — dados reais na Fase 3',
    });
    this.container.appendChild(notice);

    if (players.length === 0) {
      this.container.appendChild(createElement('div', {
        class: 'hub-empty',
        textContent: 'Nenhum jogador encontrado.',
      }));
      return;
    }

    // Grid
    const grid = createElement('div', { class: 'hub-grid' });

    players.forEach(player => {
      grid.appendChild(this.createPlayerCard(player));
    });

    this.container.appendChild(grid);
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

    // Add gold button
    const addGoldBtn = createElement('button', {
      style: 'padding: 5px 12px; border-radius: 5px; border: 1px solid var(--gold); background: transparent; color: var(--gold); cursor: pointer; font-size: 11px;',
      textContent: '💰 Dar Ouro',
    });
    on(addGoldBtn, 'click', async () => {
      const input = await promptDialog('Quanto ouro dar ao jogador?', { placeholder: 'Ex: 50' });
      const amount = parseInt(input, 10);
      if (!isNaN(amount) && amount > 0 && this.character) {
        this.character.addGold(amount);
        toast(`+${amount} 💰 ouro adicionado!`, 'success');
      }
    });
    btnRow.appendChild(addGoldBtn);

    // Add XP button
    const addXpBtn = createElement('button', {
      style: 'padding: 5px 12px; border-radius: 5px; border: 1px solid var(--accent); background: transparent; color: var(--accent); cursor: pointer; font-size: 11px;',
      textContent: '✨ Dar XP',
    });
    on(addXpBtn, 'click', async () => {
      const input = await promptDialog('Quanto XP dar ao jogador?', { placeholder: 'Ex: 200' });
      const amount = parseInt(input, 10);
      if (!isNaN(amount) && amount > 0 && this.character) {
        this.character.addXP(amount);
        toast(`+${amount} XP adicionado!`, 'success');
      }
    });
    btnRow.appendChild(addXpBtn);

    section.appendChild(btnRow);
    this.container.appendChild(section);
  }

  /**
   * Create a player profile card
   * @param {object} player
   * @returns {HTMLElement}
   */
  createPlayerCard(player) {
    const card = createElement('div', { class: 'player-card' });

    // Header: name + level
    const header = createElement('div', { class: 'player-card-header' });
    header.appendChild(createElement('div', { class: 'player-name', textContent: player.name }));
    header.appendChild(createElement('div', { class: 'player-level', textContent: `Nv. ${player.level}` }));
    card.appendChild(header);

    // Element badge
    const elementBadge = createElement('div', {
      class: `player-element ${player.element}`,
      textContent: ELEMENT_LABELS[player.element] || player.element,
    });
    card.appendChild(elementBadge);

    // Subclass (if any)
    if (player.subclass) {
      card.appendChild(createElement('div', {
        style: 'font-size: 10px; color: var(--text2); margin-bottom: 8px; font-style: italic;',
        textContent: player.subclass,
      }));
    }

    // Stats row
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

    // HP bar
    const hpPercent = player.hpMax > 0 ? (player.hp / player.hpMax) * 100 : 0;
    const hpBar = createElement('div', { class: 'player-hp-bar' });
    const hpFill = createElement('div', { class: 'player-hp-fill' });
    hpFill.style.width = `${hpPercent}%`;

    // Color based on HP percentage
    if (hpPercent <= 25) {
      hpFill.style.background = 'linear-gradient(90deg, #a01010, #c02020)';
    } else if (hpPercent <= 50) {
      hpFill.style.background = 'linear-gradient(90deg, #c07010, #e09020)';
    }

    hpBar.appendChild(hpFill);
    card.appendChild(hpBar);

    // Buffs/Debuffs
    const allEffects = [
      ...(player.buffs || []).map(b => ({ ...b, type: 'positive' })),
      ...(player.debuffs || []).map(b => ({ ...b, type: 'negative' })),
    ];

    if (allEffects.length > 0) {
      const buffsContainer = createElement('div', { class: 'player-buffs' });
      allEffects.forEach(effect => {
        buffsContainer.appendChild(createElement('span', {
          class: `player-buff ${effect.type}`,
          textContent: effect.name,
        }));
      });
      card.appendChild(buffsContainer);
    }

    return card;
  }

  refresh() {
    this.render();
  }
}
