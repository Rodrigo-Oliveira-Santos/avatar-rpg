/**
 * GM loot delivery tool for the hub page.
 */

import { createElement, on } from '../utils/dom.js';
import { getPlayerUsernames } from './data.js';
import { getShopItems } from '../shop/data.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { log } from '../admin/LogService.js';
import {
  loadPlayerCharacter,
  savePlayerCharacter,
  listPlayerUsernames,
} from '../api/gm-characters.js';
import { isSupabaseEnabled } from '../api/config.js';

const TYPE_LABELS = {
  weapon: 'Arma',
  armor: 'Armadura',
  accessory: 'Acessório',
  consumable: 'Consumível',
  scroll: 'Pergaminho',
  other: 'Outro',
};
const RARITY_LABELS = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};
const RARITY_COLORS = {
  common: 'var(--text3)',
  rare: 'var(--water)',
  epic: 'var(--spirit)',
  legendary: 'var(--gold)',
};

function slugifyItemName(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function toInventoryItem(item, quantity) {
  return {
    ...item,
    id: item.id || slugifyItemName(item.name),
    name: item.name,
    type: item.type || 'other',
    rarity: item.rarity || 'common',
    quantity,
  };
}

function normalizeQuantity(value) {
  const quantity = Number.parseInt(value, 10);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

export class LootDelivery {
  constructor(container, authManager) {
    this.container = container;
    this.authManager = authManager;
    this.selectedPlayer = '';
    this.selectedItem = null;
    this.searchTerm = '';
    this.quantity = 1;
    this.refs = {};
  }

  render() {
    this.container.innerHTML = '';
    this.refs = {};

    if (!this.authManager?.hasRole('gm')) {
      return;
    }

    const section = createElement('div', {
      style: 'display: grid; gap: 10px; padding: 12px; background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; margin-top: 12px;',
    });

    section.appendChild(createElement('div', {
      style: 'font-size: 12px; font-weight: 600; color: var(--text);',
      textContent: '🎁 Entregar Loot',
    }));

    const controls = createElement('div', {
      style: 'display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: start;',
    });

    controls.appendChild(this.createPlayerField());
    controls.appendChild(this.createSearchField());
    controls.appendChild(this.createQuantityField());
    section.appendChild(controls);

    const preview = createElement('div', {
      style: 'padding: 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; min-height: 74px;',
    });
    this.refs.preview = preview;
    section.appendChild(preview);

    const actionRow = createElement('div', {
      style: 'display: flex; justify-content: flex-end;',
    });
    const deliverBtn = createElement('button', {
      type: 'button',
      style: 'padding: 8px 14px; border-radius: 5px; border: 1px solid var(--gold); background: transparent; color: var(--gold); cursor: pointer; font-size: 12px; font-weight: 600;',
      textContent: 'Entregar',
    });
    on(deliverBtn, 'click', () => this.handleDeliver());
    this.refs.deliverBtn = deliverBtn;
    actionRow.appendChild(deliverBtn);
    section.appendChild(actionRow);

    this.container.appendChild(section);

    this.updateResults();
    this.updatePreview();
    this.updateDeliverButton();
  }

  createPlayerField() {
    const field = createElement('label', {
      style: 'display: grid; gap: 6px; font-size: 11px; color: var(--text2);',
    });

    field.appendChild(createElement('span', { textContent: 'Jogador' }));

    const select = createElement('select', {
      value: this.selectedPlayer,
      style: 'padding: 8px 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; color: var(--text);',
    });
    select.appendChild(createElement('option', { value: '', textContent: 'Selecionar jogador' }));

    // Local list first (renders synchronously); refreshed with the
    // Supabase roster as soon as it resolves.
    getPlayerUsernames().forEach(username => {
      select.appendChild(createElement('option', { value: username, textContent: username }));
    });

    listPlayerUsernames().then((remote) => {
      if (!Array.isArray(remote) || remote.length === 0) return;
      const seen = new Set(Array.from(select.options).map((o) => o.value));
      remote.forEach((username) => {
        if (!seen.has(username)) {
          select.appendChild(createElement('option', { value: username, textContent: username }));
        }
      });
    }).catch(() => {});

    on(select, 'change', () => {
      this.selectedPlayer = select.value;
      this.updateDeliverButton();
    });

    this.refs.playerSelect = select;
    field.appendChild(select);
    return field;
  }

  createSearchField() {
    const field = createElement('div', {
      style: 'display: grid; gap: 6px; min-width: 0;',
    });

    field.appendChild(createElement('div', {
      style: 'font-size: 11px; color: var(--text2);',
      textContent: 'Item',
    }));

    const input = createElement('input', {
      type: 'text',
      value: this.searchTerm,
      placeholder: 'Procurar item por nome...',
      style: 'padding: 8px 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; color: var(--text);',
    });
    on(input, 'input', () => {
      this.searchTerm = input.value;
      this.updateResults();
    });
    this.refs.searchInput = input;
    field.appendChild(input);

    const results = createElement('div', {
      style: 'display: grid; gap: 6px; max-height: 180px; overflow-y: auto; padding-right: 2px;',
    });
    this.refs.results = results;
    field.appendChild(results);

    return field;
  }

  createQuantityField() {
    const field = createElement('label', {
      style: 'display: grid; gap: 6px; font-size: 11px; color: var(--text2);',
    });

    field.appendChild(createElement('span', { textContent: 'Quantidade' }));

    const input = createElement('input', {
      type: 'number',
      min: '1',
      value: String(this.quantity),
      style: 'padding: 8px 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; color: var(--text);',
    });
    on(input, 'input', () => {
      this.quantity = normalizeQuantity(input.value);
      input.value = String(this.quantity);
    });

    this.refs.quantityInput = input;
    field.appendChild(input);
    return field;
  }

  getFilteredItems() {
    return getShopItems('all', this.searchTerm).slice(0, 10);
  }

  updateResults() {
    const results = this.refs.results;
    if (!results) return;

    results.innerHTML = '';
    const items = this.getFilteredItems();

    if (items.length === 0) {
      results.appendChild(createElement('div', {
        style: 'padding: 10px; border: 1px dashed var(--border); border-radius: 5px; color: var(--text3); font-size: 11px;',
        textContent: 'Nenhum item encontrado.',
      }));
      return;
    }

    items.forEach(item => {
      const isSelected = this.selectedItem && (this.selectedItem.id || this.selectedItem.name) === (item.id || item.name);
      const option = createElement('button', {
        type: 'button',
        style: `display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 8px 10px; background: ${isSelected ? 'var(--bg3)' : 'var(--bg2)'}; border: 1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}; border-radius: 5px; color: var(--text); cursor: pointer; text-align: left;`,
      });

      const info = createElement('div', { style: 'min-width: 0;' });
      info.appendChild(createElement('div', {
        style: 'font-size: 12px; font-weight: 600; color: var(--text);',
        textContent: item.name,
      }));
      info.appendChild(createElement('div', {
        style: 'font-size: 10px; color: var(--text2); margin-top: 2px;',
        textContent: TYPE_LABELS[item.type] || item.type || 'Outro',
      }));

      const badge = createElement('span', {
        style: `padding: 2px 8px; border-radius: 999px; border: 1px solid ${RARITY_COLORS[item.rarity] || 'var(--text3)'}; color: ${RARITY_COLORS[item.rarity] || 'var(--text3)'}; font-size: 10px; white-space: nowrap;`,
        textContent: RARITY_LABELS[item.rarity] || item.rarity || 'Comum',
      });

      on(option, 'click', () => this.selectItem(item));
      option.appendChild(info);
      option.appendChild(badge);
      results.appendChild(option);
    });
  }

  updatePreview() {
    const preview = this.refs.preview;
    if (!preview) return;

    preview.innerHTML = '';

    if (!this.selectedItem) {
      preview.appendChild(createElement('div', {
        style: 'font-size: 11px; color: var(--text3);',
        textContent: 'Seleciona um item para ver os detalhes antes da entrega.',
      }));
      return;
    }

    const header = createElement('div', {
      style: 'display: flex; justify-content: space-between; gap: 8px; align-items: center; margin-bottom: 6px;',
    });
    header.appendChild(createElement('div', {
      style: 'font-size: 13px; font-weight: 600; color: var(--text);',
      textContent: this.selectedItem.name,
    }));
    header.appendChild(createElement('span', {
      style: `padding: 2px 8px; border-radius: 999px; border: 1px solid ${RARITY_COLORS[this.selectedItem.rarity] || 'var(--text3)'}; color: ${RARITY_COLORS[this.selectedItem.rarity] || 'var(--text3)'}; font-size: 10px; white-space: nowrap;`,
      textContent: RARITY_LABELS[this.selectedItem.rarity] || this.selectedItem.rarity || 'Comum',
    }));

    preview.appendChild(header);
    preview.appendChild(createElement('div', {
      style: 'font-size: 10px; color: var(--text2); margin-bottom: 6px;',
      textContent: TYPE_LABELS[this.selectedItem.type] || this.selectedItem.type || 'Outro',
    }));
    preview.appendChild(createElement('div', {
      style: 'font-size: 11px; color: var(--text2); line-height: 1.4;',
      textContent: this.selectedItem.description || 'Sem descrição disponível.',
    }));
  }

  updateDeliverButton() {
    const deliverBtn = this.refs.deliverBtn;
    if (!deliverBtn) return;

    const enabled = Boolean(this.selectedPlayer && this.selectedItem);
    deliverBtn.disabled = !enabled;
    deliverBtn.style.opacity = enabled ? '1' : '0.55';
    deliverBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  selectItem(item) {
    this.selectedItem = item;
    this.searchTerm = item.name;

    if (this.refs.searchInput) {
      this.refs.searchInput.value = item.name;
    }

    this.updateResults();
    this.updatePreview();
    this.updateDeliverButton();
  }

  resetSelection() {
    this.selectedPlayer = '';
    this.selectedItem = null;
    this.searchTerm = '';
    this.quantity = 1;
    this.render();
  }

  async handleDeliver() {
    const username = this.selectedPlayer;
    const item = this.selectedItem;
    const quantity = normalizeQuantity(this.refs.quantityInput?.value || this.quantity);

    if (!username || !item) {
      toast('Seleciona um jogador e um item.', 'warning');
      return;
    }

    const confirmed = await confirmDialog(`Entregar ${quantity} x ${item.name} a ${username}?`);
    if (!confirmed) return;

    let character = null;
    try {
      character = await loadPlayerCharacter(username);
    } catch (err) {
      console.warn('[LootDelivery.handleDeliver] load failed', err);
    }

    if (!character) {
      toast('Não foi possível carregar a ficha do jogador.', 'error');
      return;
    }

    if (!Array.isArray(character.inventario)) {
      character.inventario = [];
    }

    const inventoryItem = toInventoryItem(item, quantity);
    const existingItem = character.inventario.find(entry => {
      if (!entry || typeof entry !== 'object') return false;
      return entry.id === inventoryItem.id || entry.name === inventoryItem.name;
    });

    if (existingItem) {
      existingItem.quantity = normalizeQuantity(existingItem.quantity) + quantity;
    } else {
      character.inventario.push(inventoryItem);
    }

    try {
      await savePlayerCharacter(username, character);
    } catch (err) {
      toast(`Falha a gravar ficha: ${err.message}`, 'error');
      return;
    }

    const gmUsername = this.authManager?.getUser()?.username || 'gm';
    log('loot_delivery', { item: item.name, quantity, target: username, backend: isSupabaseEnabled() ? 'supabase' : 'local' }, gmUsername);
    toast(`${quantity} x ${item.name} entregue a ${username}.`, 'success');
    this.resetSelection();
  }
}
