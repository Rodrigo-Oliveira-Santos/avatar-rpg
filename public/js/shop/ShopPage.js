/**
 * Shop Page Renderer
 * Displays shop items with search and category filtering
 */

import { createElement, on, $, setClasses } from '../utils/dom.js';
import { getShopItems } from './data.js';

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'weapon', label: 'Armas' },
  { id: 'armor', label: 'Armaduras' },
  { id: 'accessory', label: 'Acessórios' },
  { id: 'consumable', label: 'Consumíveis' },
];

const RARITY_LABELS = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

/**
 * ShopPage Class
 */
export class ShopPage {
  /**
   * @param {HTMLElement} container - DOM container for the shop
   */
  constructor(container) {
    this.container = container;
    this.activeCategory = 'all';
    this.searchQuery = '';

    this.render();
  }

  render() {
    this.container.innerHTML = '';

    // Gold bar (mock)
    const goldBar = createElement('div', { class: 'shop-gold-bar' });
    goldBar.innerHTML = `💰 Ouro: <span class="shop-gold-val">—</span> <span style="color:var(--text3);font-size:11px;">(Fase 2)</span>`;
    this.container.appendChild(goldBar);

    // Search bar
    const searchWrap = createElement('div', { class: 'shop-search-wrap' });
    const searchInput = createElement('input', {
      class: 'shop-search',
      type: 'text',
      placeholder: 'Procurar itens...',
      value: this.searchQuery,
    });
    on(searchInput, 'input', () => {
      this.searchQuery = searchInput.value;
      this.renderItems();
    });
    searchWrap.appendChild(searchInput);
    this.container.appendChild(searchWrap);

    // Category filters
    const filters = createElement('div', { class: 'shop-filters' });
    CATEGORIES.forEach(cat => {
      const btn = createElement('button', {
        class: 'shop-filter-btn',
        textContent: cat.label,
      });
      if (cat.id === this.activeCategory) {
        setClasses(btn, 'on');
      }
      on(btn, 'click', () => {
        this.activeCategory = cat.id;
        this.render();
      });
      filters.appendChild(btn);
    });
    this.container.appendChild(filters);

    // Items grid container
    const gridContainer = createElement('div', { id: 'shop-items-grid' });
    this.container.appendChild(gridContainer);

    this.renderItems();
  }

  renderItems() {
    const gridContainer = $('#shop-items-grid', this.container);
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const items = getShopItems(this.activeCategory, this.searchQuery);

    if (items.length === 0) {
      gridContainer.appendChild(createElement('div', {
        class: 'shop-empty',
        textContent: 'Nenhum item encontrado.',
      }));
      return;
    }

    const grid = createElement('div', { class: 'shop-grid' });

    items.forEach(item => {
      grid.appendChild(this.createShopCard(item));
    });

    gridContainer.appendChild(grid);
  }

  /**
   * Create a shop item card
   * @param {object} item
   * @returns {HTMLElement}
   */
  createShopCard(item) {
    const card = createElement('div', { class: 'shop-card' });

    // Header (name + price)
    const header = createElement('div', { class: 'shop-card-header' });
    header.appendChild(createElement('div', { class: 'shop-card-name', textContent: item.name }));
    header.appendChild(createElement('div', { class: 'shop-card-price', textContent: `${item.price} 💰` }));
    card.appendChild(header);

    // Description
    card.appendChild(createElement('div', { class: 'shop-card-desc', textContent: item.description }));

    // Meta chips
    const meta = createElement('div', { class: 'shop-card-meta' });

    // Rarity badge
    const rarityValue = item.rarity || 'common';
    const rarityClass = `rarity-badge rarity-${rarityValue}`;
    meta.appendChild(createElement('span', { class: rarityClass, textContent: RARITY_LABELS[rarityValue] || rarityValue }));

    // Type chip
    meta.appendChild(createElement('span', { class: 'item-chip ic-wt', textContent: this.getTypeLabel(item.type) }));

    // Damage
    if (item.damage) {
      meta.appendChild(createElement('span', { class: 'item-chip ic-dmg', textContent: `DMG ${item.damage}` }));
    }

    // Defense
    if (item.defense_bonus) {
      meta.appendChild(createElement('span', { class: 'item-chip ic-def', textContent: `DEF +${item.defense_bonus}` }));
    }

    // Dodge penalty
    if (item.dodge_penalty) {
      const penaltyText = item.dodge_penalty > 0 ? `ESQ -${item.dodge_penalty}` : `ESQ +${Math.abs(item.dodge_penalty)}`;
      meta.appendChild(createElement('span', { class: 'item-chip ic-wt', textContent: penaltyText }));
    }

    // Element
    if (item.element) {
      meta.appendChild(createElement('span', { class: `item-chip ic-elem ic-${item.element}`, textContent: item.element }));
    }

    // Effect
    if (item.effect) {
      meta.appendChild(createElement('span', { class: 'item-chip ic-special', textContent: item.effect }));
    }

    card.appendChild(meta);

    // Buy button (disabled — Phase 2)
    const buyBtn = createElement('button', {
      class: 'shop-buy-btn',
      textContent: 'Comprar (Fase 2)',
    });
    buyBtn.disabled = true;
    card.appendChild(buyBtn);

    return card;
  }

  getTypeLabel(type) {
    const labels = {
      weapon: 'Arma',
      armor: 'Armadura',
      accessory: 'Acessório',
      consumable: 'Consumível',
      other: 'Outro',
    };
    return labels[type] || type;
  }

  refresh() {
    this.renderItems();
  }
}
