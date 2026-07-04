/**
 * PlayerShopModal — GM-side "buy this item for a specific player" UI.
 *
 * Opens from the per-player card on the GM Control page. Behaves like the
 * shop page but the buyer is *the targeted player*: gold/nation coin is
 * deducted from their character, the item is appended to their inventory,
 * and the row is persisted via the Supabase-first `gm-characters` helper
 * so the change is visible to the player without manual sync.
 */

import { createElement, on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { NATION_CURRENCIES } from '../utils/constants.js';
import { getShopItems } from '../shop/data.js';
import { loadPlayerCharacter, savePlayerCharacter } from '../api/gm-characters.js';
import { log } from '../admin/LogService.js';

const TYPE_LABELS = {
  weapon: 'Arma', armor: 'Armadura', accessory: 'Acessório',
  consumable: 'Consumível', scroll: 'Pergaminho', other: 'Outro',
};
const RARITY_LABELS = {
  common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário',
};

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function findCurrencyById(id) {
  return Object.values(NATION_CURRENCIES).find((c) => c.id === id) || null;
}

function slugify(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, '-');
}

export class PlayerShopModal {
  constructor({ authManager } = {}) {
    this.authManager = authManager;
    this.overlay = null;
    this.player = null;
    this.character = null;
    this.searchTerm = '';
    this.activeCategory = 'all';
    this.refs = {};
  }

  async open(player) {
    if (!player?.username) {
      toast('Sem jogador selecionado.', 'warning');
      return;
    }
    // Tear down any previous session before starting a new one.
    this.close();
    this.player = player;

    try {
      this.character = await loadPlayerCharacter(player.username);
    } catch (err) {
      toast(`Falha a carregar ficha: ${err.message}`, 'error');
      return;
    }
    if (!this.character) {
      toast(`Não foi possível carregar a ficha de ${player.name || player.username}.`, 'warning');
      return;
    }

    this.render();
  }

  close() {
    this.overlay?.remove?.();
    this.overlay = null;
    this.player = null;
    this.character = null;
    this.refs = {};
  }

  render() {
    this.overlay?.remove?.();

    const overlay = createElement('div', { class: 'modal-overlay' });
    const box = createElement('div', {
      class: 'modal-box',
      style: 'max-width: 640px; max-height: 85vh; display: flex; flex-direction: column;',
    });

    const title = createElement('h2', {
      class: 'modal-title',
      textContent: `🛒 Comprar para ${this.player?.name || this.player?.username}`,
    });
    box.appendChild(title);

    const wallet = this.renderWallet();
    box.appendChild(wallet);

    const filters = createElement('div', { class: 'shop-filters', style: 'margin: 8px 0;' });
    [
      { id: 'all',        label: 'Todos' },
      { id: 'weapon',     label: 'Armas' },
      { id: 'armor',      label: 'Armaduras' },
      { id: 'accessory',  label: 'Acessórios' },
      { id: 'consumable', label: 'Consumíveis' },
      { id: 'scroll',     label: 'Pergaminhos' },
    ].forEach((cat) => {
      const btn = createElement('button', {
        type: 'button',
        class: `shop-filter-btn${cat.id === this.activeCategory ? ' on' : ''}`,
        textContent: cat.label,
      });
      on(btn, 'click', () => {
        this.activeCategory = cat.id;
        this.renderItems();
        filters.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.textContent === cat.label));
      });
      filters.appendChild(btn);
    });
    box.appendChild(filters);

    const search = createElement('input', {
      type: 'text',
      class: 'shop-search',
      placeholder: 'Procurar item…',
      value: this.searchTerm,
      style: 'margin-bottom: 8px;',
    });
    on(search, 'input', () => { this.searchTerm = search.value; this.renderItems(); });
    box.appendChild(search);

    const itemsHost = createElement('div', {
      style: 'flex: 1 1 auto; overflow-y: auto; display: grid; gap: 6px; padding-right: 4px; min-height: 200px;',
    });
    this.refs.itemsHost = itemsHost;
    box.appendChild(itemsHost);
    this.renderItems();

    const actions = createElement('div', { class: 'modal-actions' });
    const closeBtn = createElement('button', {
      type: 'button',
      class: 'modal-btn modal-btn-cancel',
      textContent: 'Fechar',
    });
    on(closeBtn, 'click', () => this.close());
    actions.appendChild(closeBtn);
    box.appendChild(actions);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    on(overlay, 'click', (e) => { if (e.target === overlay) this.close(); });
    this.overlay = overlay;
  }

  renderWallet() {
    const gold = toNumber(this.character?.ouro, 0);
    const coins = this.character?.moedas || {};
    const wrap = createElement('div', {
      style: 'display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; font-size: 12px;',
    });
    wrap.appendChild(createElement('span', { textContent: `💰 ${gold}` }));
    Object.values(NATION_CURRENCIES).forEach((c) => {
      const amount = toNumber(coins[c.id], 0);
      if (amount > 0) {
        wrap.appendChild(createElement('span', { textContent: `${c.icon} ${amount}` }));
      }
    });
    return wrap;
  }

  renderItems() {
    const host = this.refs.itemsHost;
    if (!host) return;
    host.innerHTML = '';

    const items = getShopItems(this.activeCategory, this.searchTerm);
    if (items.length === 0) {
      host.appendChild(createElement('div', {
        style: 'padding: 12px; color: var(--text3); text-align: center;',
        textContent: 'Nenhum item encontrado.',
      }));
      return;
    }

    items.forEach((item) => host.appendChild(this.renderItemRow(item)));
  }

  renderItemRow(item) {
    const row = createElement('div', {
      style: 'display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg2); align-items: center;',
    });

    const info = createElement('div');
    const head = createElement('div', { style: 'display: flex; gap: 8px; align-items: baseline;' });
    head.appendChild(createElement('strong', { textContent: item.name, style: 'font-size: 13px;' }));
    head.appendChild(createElement('span', {
      style: 'font-size: 10px; color: var(--text3);',
      textContent: `${TYPE_LABELS[item.type] || item.type} • ${RARITY_LABELS[item.rarity] || item.rarity}`,
    }));
    info.appendChild(head);
    if (item.description) {
      info.appendChild(createElement('div', {
        style: 'font-size: 11px; color: var(--text2); margin-top: 2px;',
        textContent: item.description,
      }));
    }
    row.appendChild(info);

    const buttons = createElement('div', { style: 'display: flex; flex-direction: column; gap: 4px; align-items: stretch;' });
    const gold = toNumber(this.character?.ouro, 0);
    const goldBtn = createElement('button', {
      type: 'button',
      class: 'gm-action-btn',
      textContent: `💰 ${item.price}`,
      disabled: gold < item.price,
      style: gold < item.price ? 'opacity: 0.55; cursor: not-allowed;' : '',
    });
    on(goldBtn, 'click', () => this.handleBuy(item, 'gold'));
    buttons.appendChild(goldBtn);

    if (item.nationPrice) {
      const currency = findCurrencyById(item.nationPrice.currency);
      const balance = toNumber(this.character?.moedas?.[item.nationPrice.currency], 0);
      const enabled = balance >= item.nationPrice.amount;
      const nationBtn = createElement('button', {
        type: 'button',
        class: 'gm-action-btn',
        textContent: `${currency?.icon || '🪙'} ${item.nationPrice.amount}`,
        disabled: !enabled,
        style: enabled ? '' : 'opacity: 0.55; cursor: not-allowed;',
      });
      on(nationBtn, 'click', () => this.handleBuy(item, 'nation'));
      buttons.appendChild(nationBtn);
    }

    row.appendChild(buttons);
    return row;
  }

  async handleBuy(item, paymentMethod) {
    if (!this.character || !this.player) return;

    if (paymentMethod === 'nation') {
      const currency = findCurrencyById(item.nationPrice?.currency);
      const balance = toNumber(this.character.moedas?.[item.nationPrice?.currency], 0);
      if (!currency || balance < (item.nationPrice?.amount || 0)) {
        toast('Moedas insuficientes.', 'warning');
        return;
      }
      const confirmed = await confirmDialog(
        `Comprar "${item.name}" para ${this.player.name || this.player.username} por ${item.nationPrice.amount} ${currency.icon}?`,
      );
      if (!confirmed) return;

      this.character.moedas[currency.id] = balance - item.nationPrice.amount;
    } else {
      const gold = toNumber(this.character.ouro, 0);
      if (gold < item.price) {
        toast('Ouro insuficiente.', 'warning');
        return;
      }
      const confirmed = await confirmDialog(
        `Comprar "${item.name}" para ${this.player.name || this.player.username} por ${item.price} 💰?`,
      );
      if (!confirmed) return;

      this.character.ouro = gold - item.price;
    }

    // Append to inventory (stack by id/name like the player's shop does).
    if (!Array.isArray(this.character.inventario)) this.character.inventario = [];
    const itemId = item.id || slugify(item.name);
    const existing = this.character.inventario.find((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      return entry.id === itemId || entry.name === item.name;
    });
    if (existing) {
      existing.quantity = toNumber(existing.quantity, 1) + 1;
    } else {
      this.character.inventario.push({
        ...item,
        id: itemId,
        name: item.name,
        type: item.type || 'other',
        rarity: item.rarity || 'common',
        quantity: 1,
      });
    }

    try {
      await savePlayerCharacter(this.player.username, this.character);
    } catch (err) {
      toast(`Falha a gravar: ${err.message}`, 'error');
      return;
    }

    const gmUsername = this.authManager?.getUser?.()?.username || 'gm';
    log('gm_purchase', {
      target: this.player.username,
      item: item.name,
      payment: paymentMethod,
      price: paymentMethod === 'nation' ? item.nationPrice?.amount : item.price,
      currency: paymentMethod === 'nation' ? item.nationPrice?.currency : 'gold',
    }, gmUsername);

    toast(`${this.player.name || this.player.username} comprou "${item.name}".`, 'success');

    // Refresh wallet + buy buttons (balance changed).
    this.render();
  }
}
