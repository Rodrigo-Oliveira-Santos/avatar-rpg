/**
 * Shop Page Renderer
 * Displays shop items with search and category filtering
 */

import { createElement, on, $ } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { NATION_CURRENCIES } from '../utils/constants.js';
import { getShopItems } from './data.js';
import { addItem } from '../items/inventory.js';
import { log } from '../admin/LogService.js';

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'weapon', label: 'Armas' },
  { id: 'armor', label: 'Armaduras' },
  { id: 'accessory', label: 'Acessórios' },
  { id: 'consumable', label: 'Consumíveis' },
  { id: 'scroll', label: 'Pergaminhos' },
];

const RARITY_LABELS = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

function getStoredUsername() {
  try {
    return JSON.parse(localStorage.getItem('avatar_rpg_user') || 'null')?.username || 'unknown';
  } catch {
    return 'unknown';
  }
}

function getCurrencyById(currencyId) {
  return Object.values(NATION_CURRENCIES).find(currency => currency.id === currencyId) || null;
}

/**
 * ShopPage Class
 */
export class ShopPage {
  /**
   * @param {HTMLElement} container - DOM container for the shop
   * @param {object} character - Character instance
   */
  constructor(container, character, authManager = null) {
    this.container = container;
    this.character = character;
    this.authManager = authManager;
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.balanceBar = null;

    this.render();
  }

  getCharacterElement() {
    return this.character?.data?.identidade?.elemento || 'none';
  }

  getNativeCurrency() {
    return NATION_CURRENCIES[this.getCharacterElement()] || NATION_CURRENCIES.none;
  }

  getVisibleCurrencies() {
    const balances = this.character?.getNationCoins?.() || {};
    const nativeCurrency = this.getNativeCurrency();
    const visible = [{ ...nativeCurrency, amount: balances[nativeCurrency.id] || 0, primary: true }];

    const orderedExtras = [
      NATION_CURRENCIES.none,
      ...Object.values(NATION_CURRENCIES).filter(currency => currency.id !== nativeCurrency.id && currency.id !== NATION_CURRENCIES.none.id),
    ];

    orderedExtras.forEach(currency => {
      if (!currency || currency.id === nativeCurrency.id) return;
      const amount = balances[currency.id] || 0;
      if (amount > 0) {
        visible.push({ ...currency, amount, primary: false });
      }
    });

    return visible;
  }

  canUseNationPrice(item) {
    if (!item.nationPrice?.currency) return false;
    return this.getNativeCurrency().id === item.nationPrice.currency;
  }

  renderBalanceBar() {
    if (!this.balanceBar) return;

    const gold = this.character ? this.character.getGold() : 0;
    this.balanceBar.innerHTML = '';
    this.balanceBar.appendChild(createElement('span', {
      className: 'shop-gold-summary',
      textContent: `💰 Ouro: ${gold}`,
    }));

    const currenciesWrap = createElement('div', { class: 'shop-balance-currencies' });
    this.getVisibleCurrencies().forEach(currency => {
      const chip = createElement('span', {
        className: `currency-chip compact${currency.primary ? ' primary' : ''}`,
      });
      chip.style.setProperty('--currency-color', currency.color);
      chip.append(
        createElement('span', { className: 'currency-icon', textContent: currency.icon }),
        createElement('span', { className: 'currency-value', textContent: String(currency.amount) })
      );
      currenciesWrap.appendChild(chip);
    });

    this.balanceBar.appendChild(currenciesWrap);
  }

  render() {
    this.container.innerHTML = '';

    this.balanceBar = createElement('div', { class: 'shop-gold-bar' });
    this.container.appendChild(this.balanceBar);
    this.renderBalanceBar();

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

    const filters = createElement('div', { class: 'shop-filters' });
    CATEGORIES.forEach(cat => {
      const btn = createElement('button', {
        class: `shop-filter-btn ${cat.id === this.activeCategory ? 'on' : ''}`,
        textContent: cat.label,
      });
      on(btn, 'click', () => {
        this.activeCategory = cat.id;
        this.render();
      });
      filters.appendChild(btn);
    });
    this.container.appendChild(filters);

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
    const card = createElement('div', { class: `shop-card rarity-border-${item.rarity || 'common'}` });

    const header = createElement('div', { class: 'shop-card-header' });
    const priceWrap = createElement('div', { class: 'shop-card-prices' });
    priceWrap.appendChild(createElement('div', { class: 'shop-card-price', textContent: `${item.price} 💰` }));

    if (item.nationPrice) {
      const nationCurrency = getCurrencyById(item.nationPrice.currency);
      if (nationCurrency) {
        const nationPrice = createElement('div', {
          className: 'shop-card-price shop-card-price-nation',
          textContent: `${item.nationPrice.amount} ${nationCurrency.icon}`,
        });
        nationPrice.style.setProperty('--currency-color', nationCurrency.color);
        priceWrap.appendChild(nationPrice);
      }
    }

    header.appendChild(createElement('div', { class: 'shop-card-name', textContent: item.name }));
    header.appendChild(priceWrap);
    card.appendChild(header);

    card.appendChild(createElement('div', { class: 'shop-card-desc', textContent: item.description }));

    const meta = createElement('div', { class: 'shop-card-meta' });
    const rarityClass = `rarity-badge rarity-${item.rarity}`;
    meta.appendChild(createElement('span', { class: rarityClass, textContent: RARITY_LABELS[item.rarity] || item.rarity }));
    meta.appendChild(createElement('span', { class: 'item-chip ic-wt', textContent: this.getTypeLabel(item.type) }));

    if (item.damage) {
      meta.appendChild(createElement('span', { class: 'item-chip ic-dmg', textContent: `DMG ${item.damage}` }));
    }

    if (item.defense_bonus) {
      meta.appendChild(createElement('span', { class: 'item-chip ic-def', textContent: `DEF +${item.defense_bonus}` }));
    }

    if (item.dodge_penalty) {
      const penaltyText = item.dodge_penalty > 0 ? `ESQ -${item.dodge_penalty}` : `ESQ +${Math.abs(item.dodge_penalty)}`;
      meta.appendChild(createElement('span', { class: 'item-chip ic-wt', textContent: penaltyText }));
    }

    if (item.element) {
      meta.appendChild(createElement('span', { class: `item-chip ic-elem ic-${item.element}`, textContent: item.element }));
    }

    if (item.effect) {
      meta.appendChild(createElement('span', { class: 'item-chip ic-special', textContent: item.effect }));
    }

    card.appendChild(meta);

    const actions = createElement('div', { class: 'shop-buy-actions' });
    const buyGoldBtn = createElement('button', {
      class: 'shop-buy-btn',
      textContent: `Comprar — ${item.price} 💰`,
    });
    on(buyGoldBtn, 'click', () => this.handlePurchase(item, 'gold'));
    actions.appendChild(buyGoldBtn);

    if (item.nationPrice && this.canUseNationPrice(item)) {
      const nationCurrency = getCurrencyById(item.nationPrice.currency);
      const balance = this.character?.getNationCoins?.()[item.nationPrice.currency] || 0;
      const nationBtn = createElement('button', {
        className: 'shop-buy-btn nation',
        textContent: `Comprar — ${item.nationPrice.amount} ${nationCurrency?.icon || '🪙'}`,
        disabled: balance < item.nationPrice.amount,
      });
      if (nationCurrency) {
        nationBtn.style.setProperty('--currency-color', nationCurrency.color);
      }
      on(nationBtn, 'click', () => this.handlePurchase(item, 'nation'));
      actions.appendChild(nationBtn);
    }

    card.appendChild(actions);

    return card;
  }

  /**
   * Handle item purchase
   */
  async handlePurchase(item, paymentMethod = 'gold') {
    if (!this.character) {
      toast('Erro: personagem não carregado.', 'error');
      return;
    }

    if (paymentMethod === 'nation') {
      if (!this.canUseNationPrice(item) || !item.nationPrice) {
        toast('Este item não aceita pagamento com moedas nacionais para o teu elemento.', 'warning');
        return;
      }

      const nationCurrency = getCurrencyById(item.nationPrice.currency);
      const balances = this.character.getNationCoins();
      const currentAmount = balances[item.nationPrice.currency] || 0;
      if (currentAmount < item.nationPrice.amount) {
        toast(`${nationCurrency?.label || 'Moedas nacionais'} insuficientes!`, 'warning');
        return;
      }

      const confirmed = await confirmDialog(`Comprar "${item.name}" por ${item.nationPrice.amount} ${nationCurrency?.icon || '🪙'}?`);
      if (!confirmed) return;

      this.character.spendNationCoins(item.nationPrice.currency, item.nationPrice.amount);
      this.finishPurchase(item, {
        type: 'nation',
        value: item.nationPrice.amount,
        currency: nationCurrency,
      });
      return;
    }

    const gold = this.character.getGold();
    if (gold < item.price) {
      toast(`Ouro insuficiente! Precisas de ${item.price} 💰 (tens ${gold}).`, 'warning');
      return;
    }

    const confirmed = await confirmDialog(`Comprar "${item.name}" por ${item.price} 💰?`);
    if (!confirmed) return;

    this.character.spendGold(item.price);
    this.finishPurchase(item, { type: 'gold', value: item.price });
  }

  finishPurchase(item, payment) {
    addItem(this.character, item);

    const username = this.authManager?.getUser()?.username || getStoredUsername();
    log('purchase', {
      item: item.name,
      price: payment.type === 'gold' ? payment.value : item.price,
      payment_method: payment.type,
      nation_price: payment.type === 'nation'
        ? { currency: payment.currency?.id, amount: payment.value }
        : item.nationPrice || null,
    }, username);

    const paidLabel = payment.type === 'nation'
      ? `${payment.value} ${payment.currency?.icon || '🪙'}`
      : `${payment.value} 💰`;
    toast(`Compraste "${item.name}" por ${paidLabel}!`, 'success');
    this.render();
  }

  getTypeLabel(type) {
    const labels = {
      weapon: 'Arma',
      armor: 'Armadura',
      accessory: 'Acessório',
      consumable: 'Consumível',
      scroll: 'Pergaminho',
      other: 'Outro',
    };
    return labels[type] || type;
  }

  refreshBalance() {
    this.renderBalanceBar();
  }

  refresh() {
    this.render();
  }
}
