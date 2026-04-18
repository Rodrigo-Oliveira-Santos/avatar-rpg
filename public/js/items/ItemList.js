/**
 * Item List Renderer
 * Displays items in a grid with filtering
 */

import { createElement, on } from '../utils/dom.js';
import { addItem, equipItem, getInventory } from './inventory.js';

/**
 * Create item card
 * @param {object} item - Item data
 * @param {boolean} inInventory - Is in character inventory
 * @param {Function} onAdd - Add to inventory callback
 * @param {Function} onEquip - Equip callback
 * @returns {HTMLElement} Item card element
 */
export function createItemCard(item, inInventory = false, onAdd = null, onEquip = null) {
  const card = createElement('div', { class: 'item-card' });

  // Name
  card.appendChild(createElement('div', {
    class: 'item-name',
    textContent: item.name,
  }));

  // Description
  card.appendChild(createElement('div', {
    class: 'item-desc',
    textContent: item.description,
  }));

  // Chips
  const chips = createElement('div', { class: 'item-chips' });

  if (item.damage) {
    chips.appendChild(createElement('span', {
      class: 'item-chip ic-dmg',
      textContent: item.damage,
    }));
  }

  if (item.defense) {
    chips.appendChild(createElement('span', {
      class: 'item-chip ic-def',
      textContent: `DEF ${item.defense}`,
    }));
  }

  if (item.price) {
    chips.appendChild(createElement('span', {
      class: 'item-chip ic-price',
      textContent: `${item.price} gold`,
    }));
  }

  if (item.weight) {
    chips.appendChild(createElement('span', {
      class: 'item-chip ic-wt',
      textContent: `${item.weight} kg`,
    }));
  }

  if (item.element) {
    chips.appendChild(createElement('span', {
      class: `item-chip ic-elem ic-${item.element}`,
      textContent: item.element,
    }));
  }

  card.appendChild(chips);

  // Action button
  if (inInventory) {
    const equipBtn = createElement('button', {
      class: 'add-inv-btn',
      textContent: 'Equip',
    });
    on(equipBtn, 'click', () => onEquip?.(item));
    card.appendChild(equipBtn);
  } else {
    const addBtn = createElement('button', {
      class: 'add-inv-btn',
      textContent: 'Add to Inventory',
    });
    on(addBtn, 'click', () => onAdd?.(item));
    card.appendChild(addBtn);
  }

  return card;
}

/**
 * Create category filter tabs
 * @param {string} activeCategory - Active category
 * @param {Function} onCategoryChange - Callback
 * @returns {HTMLElement} Tabs container
 */
function createCategoryTabs(activeCategory, onCategoryChange) {
  const categories = ['all', 'weapon', 'armor', 'accessory', 'consumable', 'other'];
  const labels = {
    all: 'All',
    weapon: 'Weapons',
    armor: 'Armor',
    accessory: 'Accessories',
    consumable: 'Consumables',
    other: 'Other',
  };

  const container = createElement('div', { class: 'items-nav' });

  categories.forEach(cat => {
    const btn = createElement('button', {
      class: `icat-btn ${cat === activeCategory ? 'on' : ''}`,
      textContent: labels[cat],
    });
    on(btn, 'click', () => onCategoryChange(cat));
    container.appendChild(btn);
  });

  return container;
}

/**
 * ItemList Class
 */
export class ItemList {
  /**
   * @param {array} items - All available items
   * @param {object} character - Character instance
   * @param {HTMLElement} container - DOM container
   */
  constructor(items, character, container) {
    this.items = items;
    this.character = character;
    this.container = container;
    this.activeCategory = 'all';

    this.render();
  }

  /**
   * Render the item list
   */
  render() {
    this.container.innerHTML = '';

    // Category tabs
    const tabs = createCategoryTabs(this.activeCategory, (cat) => {
      this.activeCategory = cat;
      this.render();
    });
    this.container.appendChild(tabs);

    // Filter items
    let filtered = this.items;
    if (this.activeCategory !== 'all') {
      filtered = this.items.filter(item => item.type === this.activeCategory);
    }

    // Get inventory IDs
    const inventoryIds = new Set(
      (this.character.getData().inventario || []).map(i => i.id)
    );

    if (filtered.length === 0) {
      this.container.appendChild(createElement('p', {
        style: 'color: var(--text2); padding: 20px;',
        textContent: 'No items in this category.',
      }));
      return;
    }

    // Grid
    const grid = createElement('div', { class: 'items-grid' });

    filtered.forEach(item => {
      const inInventory = inventoryIds.has(item.id);
      const card = createItemCard(
        item,
        inInventory,
        (i) => this.addItem(i),
        (i) => this.equipItem(i)
      );
      grid.appendChild(card);
    });

    this.container.appendChild(grid);
  }

  /**
   * Add item to inventory
   * @param {object} item - Item data
   */
  addItem(item) {
    addItem(this.character, item);
    this.render();
  }

  /**
   * Equip item
   * @param {object} item - Item data
   */
  equipItem(item) {
    const result = equipItem(this.character, item.id);
    if (result.success) {
      this.render();
    } else {
      alert(result.error);
    }
  }

  /**
   * Refresh the list
   */
  refresh() {
    this.render();
  }
}
