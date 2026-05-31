/**
 * GM forced transfer tool for gold, national coins, and items.
 */

import { createElement, on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { log } from '../admin/LogService.js';
import { NATION_CURRENCIES } from '../utils/constants.js';

const CHARACTER_STORAGE_PREFIX = 'avatar_rpg_character_';
const USER_REGISTRY_KEY = 'avatar_rpg_users_registry';
const PRESET_USERS = ['zuko', 'katara', 'toph', 'aang', 'sokka'];
const SYSTEM_USERS = new Set(['gm', 'admin']);
const TRANSFER_TYPES = {
  gold: 'Ouro',
  nation_coins: 'Moedas Nacionais',
  item: 'Item',
};
const CURRENCY_OPTIONS = Object.values(NATION_CURRENCIES);
export const GIFT_TRANSFER_UPDATED_EVENT = 'gift-transfer:updated';

function getCharacterStorageKey(username) {
  return `${CHARACTER_STORAGE_PREFIX}${username}`;
}

function parseCharacter(rawCharacter) {
  if (!rawCharacter) return null;

  try {
    const parsed = JSON.parse(rawCharacter);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePositiveInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function ensureNationCoins(character) {
  if (!character.moedas || typeof character.moedas !== 'object') {
    character.moedas = {};
  }

  CURRENCY_OPTIONS.forEach(currency => {
    character.moedas[currency.id] = Math.max(0, toNumber(character.moedas[currency.id], 0));
  });
}

function ensureInventory(character) {
  if (!Array.isArray(character.inventario)) {
    character.inventario = [];
  }
}

function slugifyItemName(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

function normalizeItemName(name = '') {
  return String(name).trim().toLowerCase();
}

function findInventoryItem(inventory, itemName) {
  const normalizedName = normalizeItemName(itemName);

  return inventory.find(item => {
    if (!item || typeof item !== 'object') return false;
    return normalizeItemName(item.name) === normalizedName || normalizeItemName(item.id) === normalizedName;
  }) || null;
}

function addInventoryItem(inventory, item, quantity) {
  const normalizedQuantity = normalizePositiveInteger(quantity, 1);
  const existing = inventory.find(entry => entry?.id === item.id || normalizeItemName(entry?.name) === normalizeItemName(item.name));

  if (existing) {
    existing.quantity = normalizePositiveInteger(existing.quantity, 1) + normalizedQuantity;
    return existing;
  }

  const nextItem = {
    ...item,
    id: item.id || slugifyItemName(item.name),
    name: item.name,
    quantity: normalizedQuantity,
  };

  inventory.push(nextItem);
  return nextItem;
}

function removeInventoryItem(inventory, item, quantity) {
  const normalizedQuantity = normalizePositiveInteger(quantity, 1);
  const currentQuantity = normalizePositiveInteger(item.quantity, 1);

  if (currentQuantity <= normalizedQuantity) {
    const index = inventory.indexOf(item);
    if (index >= 0) inventory.splice(index, 1);
    return;
  }

  item.quantity = currentQuantity - normalizedQuantity;
}

export class GiftTransfer {
  constructor(container, authManager) {
    this.container = container;
    this.authManager = authManager;
    this.players = [];
    this.fromPlayer = '';
    this.toPlayer = '';
    this.transferType = 'gold';
    this.goldAmount = 1;
    this.currencyId = CURRENCY_OPTIONS[0]?.id || 'fire_coins';
    this.coinsAmount = 1;
    this.itemName = '';
    this.itemQuantity = 1;
    this.refs = {};
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = '';
    this.refs = {};

    if (!this.authManager?.hasRole('gm')) {
      return;
    }

    this.players = this.getPlayerList();

    if (this.fromPlayer && !this.players.includes(this.fromPlayer)) {
      this.fromPlayer = '';
    }

    if (this.toPlayer && !this.players.includes(this.toPlayer)) {
      this.toPlayer = '';
    }

    const section = createElement('section', {
      style: 'display: grid; gap: 10px; padding: 12px; background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; margin-top: 12px;',
    });

    section.appendChild(createElement('div', {
      style: 'font-size: 12px; font-weight: 600; color: var(--text);',
      textContent: '🎁 Transferência Forçada (GM)',
    }));

    const playersGrid = createElement('div', {
      style: 'display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: start;',
    });
    playersGrid.appendChild(this.createPlayerSelectField('De', true));
    playersGrid.appendChild(this.createPlayerSelectField('Para', false));
    section.appendChild(playersGrid);

    section.appendChild(this.createTypeSelector());

    const dynamicFields = createElement('div', {
      style: 'display: grid; gap: 10px; padding: 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px;',
    });
    this.refs.dynamicFields = dynamicFields;
    section.appendChild(dynamicFields);

    const actionRow = createElement('div', {
      style: 'display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;',
    });

    const helperText = createElement('div', {
      style: 'font-size: 11px; color: var(--text2); line-height: 1.4;',
      textContent: 'Usa “Nenhum” para criar recursos diretamente para o destino, sem aceitação da troca.',
    });
    actionRow.appendChild(helperText);

    const transferBtn = createElement('button', {
      type: 'button',
      style: 'padding: 8px 14px; border-radius: 5px; border: 1px solid var(--gold); background: transparent; color: var(--gold); cursor: pointer; font-size: 12px; font-weight: 600;',
      textContent: 'Transferir',
    });
    on(transferBtn, 'click', async () => {
      await this.handleTransfer();
    });
    this.refs.transferBtn = transferBtn;
    actionRow.appendChild(transferBtn);

    section.appendChild(actionRow);
    this.container.appendChild(section);

    this.renderDynamicFields();
    this.updateTransferButton();
  }

  getPlayerList() {
    let registry = {};

    try {
      registry = JSON.parse(localStorage.getItem(USER_REGISTRY_KEY) || '{}') || {};
    } catch {
      registry = {};
    }

    const allUsers = new Set([...PRESET_USERS, ...Object.keys(registry)]);

    return Array.from(allUsers)
      .map(username => String(username || '').trim())
      .filter(username => username && !SYSTEM_USERS.has(username.toLowerCase()))
      .sort((left, right) => left.localeCompare(right, 'pt-PT'));
  }

  createPlayerSelectField(labelText, allowNone) {
    const field = createElement('label', {
      style: 'display: grid; gap: 6px; font-size: 11px; color: var(--text2);',
    });

    field.appendChild(createElement('span', { textContent: labelText }));

    const select = createElement('select', {
      style: 'padding: 8px 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; color: var(--text);',
    });

    if (allowNone) {
      select.appendChild(createElement('option', {
        value: '',
        textContent: 'Nenhum (criar do vazio)',
      }));
    } else {
      select.appendChild(createElement('option', {
        value: '',
        textContent: 'Selecionar jogador',
      }));
    }

    this.players.forEach(username => {
      select.appendChild(createElement('option', {
        value: username,
        textContent: username,
      }));
    });

    select.value = allowNone ? this.fromPlayer : this.toPlayer;

    on(select, 'change', () => {
      if (allowNone) {
        this.fromPlayer = select.value;
      } else {
        this.toPlayer = select.value;
      }
      this.updateTransferButton();
    });

    if (allowNone) {
      this.refs.fromSelect = select;
    } else {
      this.refs.toSelect = select;
    }

    field.appendChild(select);
    return field;
  }

  createTypeSelector() {
    const wrapper = createElement('div', {
      style: 'display: grid; gap: 6px;',
    });

    wrapper.appendChild(createElement('div', {
      style: 'font-size: 11px; color: var(--text2);',
      textContent: 'Tipo',
    }));

    const row = createElement('div', {
      style: 'display: flex; gap: 14px; flex-wrap: wrap; align-items: center;',
    });

    Object.entries(TRANSFER_TYPES).forEach(([value, label]) => {
      const optionLabel = createElement('label', {
        style: 'display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text); cursor: pointer;',
      });

      const radio = createElement('input', {
        type: 'radio',
        name: 'gift-transfer-type',
        value,
        checked: this.transferType === value,
      });
      radio.style.accentColor = 'var(--gold)';

      on(radio, 'change', () => {
        if (!radio.checked) return;
        this.transferType = value;
        this.renderDynamicFields();
        this.updateTransferButton();
      });

      optionLabel.appendChild(radio);
      optionLabel.appendChild(createElement('span', { textContent: label }));
      row.appendChild(optionLabel);
    });

    wrapper.appendChild(row);
    return wrapper;
  }

  createNumberField(labelText, value, min = '1') {
    const wrapper = createElement('label', {
      style: 'display: grid; gap: 6px; font-size: 11px; color: var(--text2);',
    });

    wrapper.appendChild(createElement('span', { textContent: labelText }));

    const input = createElement('input', {
      type: 'number',
      min,
      value: String(value),
      style: 'padding: 8px 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 5px; color: var(--text);',
    });

    wrapper.appendChild(input);
    return { wrapper, input };
  }

  createTextField(labelText, value, placeholder) {
    const wrapper = createElement('label', {
      style: 'display: grid; gap: 6px; font-size: 11px; color: var(--text2);',
    });

    wrapper.appendChild(createElement('span', { textContent: labelText }));

    const input = createElement('input', {
      type: 'text',
      value,
      placeholder,
      style: 'padding: 8px 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 5px; color: var(--text);',
    });

    wrapper.appendChild(input);
    return { wrapper, input };
  }

  createCurrencyField() {
    const wrapper = createElement('label', {
      style: 'display: grid; gap: 6px; font-size: 11px; color: var(--text2);',
    });

    wrapper.appendChild(createElement('span', { textContent: 'Moeda' }));

    const select = createElement('select', {
      style: 'padding: 8px 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 5px; color: var(--text);',
    });

    CURRENCY_OPTIONS.forEach(currency => {
      select.appendChild(createElement('option', {
        value: currency.id,
        textContent: `${currency.icon} ${currency.label}`,
      }));
    });

    select.value = this.currencyId;
    wrapper.appendChild(select);
    return { wrapper, select };
  }

  renderDynamicFields() {
    const dynamicFields = this.refs.dynamicFields;
    if (!dynamicFields) return;

    dynamicFields.innerHTML = '';

    const grid = createElement('div', {
      style: 'display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: start;',
    });

    if (this.transferType === 'gold') {
      const amountField = this.createNumberField('Ouro', this.goldAmount);
      on(amountField.input, 'input', () => {
        this.goldAmount = normalizePositiveInteger(amountField.input.value, 0);
        this.updateTransferButton();
      });
      this.refs.goldInput = amountField.input;
      grid.appendChild(amountField.wrapper);
    }

    if (this.transferType === 'nation_coins') {
      const currencyField = this.createCurrencyField();
      on(currencyField.select, 'change', () => {
        this.currencyId = currencyField.select.value;
        this.updateTransferButton();
      });

      const amountField = this.createNumberField('Quantidade', this.coinsAmount);
      on(amountField.input, 'input', () => {
        this.coinsAmount = normalizePositiveInteger(amountField.input.value, 0);
        this.updateTransferButton();
      });

      this.refs.currencySelect = currencyField.select;
      this.refs.coinsInput = amountField.input;
      grid.appendChild(currencyField.wrapper);
      grid.appendChild(amountField.wrapper);
    }

    if (this.transferType === 'item') {
      const nameField = this.createTextField('Nome do item', this.itemName, 'Ex: Katana de Fogo');
      on(nameField.input, 'input', () => {
        this.itemName = nameField.input.value;
        this.updateTransferButton();
      });

      const quantityField = this.createNumberField('Quantidade', this.itemQuantity);
      on(quantityField.input, 'input', () => {
        this.itemQuantity = normalizePositiveInteger(quantityField.input.value, 0);
        this.updateTransferButton();
      });

      this.refs.itemNameInput = nameField.input;
      this.refs.itemQuantityInput = quantityField.input;
      grid.appendChild(nameField.wrapper);
      grid.appendChild(quantityField.wrapper);
    }

    dynamicFields.appendChild(grid);
  }

  updateTransferButton() {
    const transferBtn = this.refs.transferBtn;
    if (!transferBtn) return;

    let enabled = Boolean(this.toPlayer);

    if (this.fromPlayer && this.toPlayer && this.fromPlayer === this.toPlayer) {
      enabled = false;
    }

    if (this.transferType === 'gold') {
      enabled = enabled && normalizePositiveInteger(this.refs.goldInput?.value ?? this.goldAmount, 0) > 0;
    }

    if (this.transferType === 'nation_coins') {
      enabled = enabled
        && Boolean(this.refs.currencySelect?.value || this.currencyId)
        && normalizePositiveInteger(this.refs.coinsInput?.value ?? this.coinsAmount, 0) > 0;
    }

    if (this.transferType === 'item') {
      enabled = enabled
        && String(this.refs.itemNameInput?.value ?? this.itemName).trim().length > 0
        && normalizePositiveInteger(this.refs.itemQuantityInput?.value ?? this.itemQuantity, 0) > 0;
    }

    transferBtn.disabled = !enabled;
    transferBtn.style.opacity = enabled ? '1' : '0.55';
    transferBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  getCurrentUsername() {
    return this.authManager?.getUser?.()?.username || 'gm';
  }

  getTransferPayload() {
    if (!this.toPlayer) {
      throw new Error('Seleciona o jogador de destino.');
    }

    if (this.fromPlayer && this.fromPlayer === this.toPlayer) {
      throw new Error('A origem e o destino não podem ser o mesmo jogador.');
    }

    if (this.transferType === 'gold') {
      const amount = normalizePositiveInteger(this.refs.goldInput?.value ?? this.goldAmount, 0);
      if (amount <= 0) throw new Error('Indica uma quantidade de ouro válida.');
      return { type: 'gold', details: { amount } };
    }

    if (this.transferType === 'nation_coins') {
      const currencyId = this.refs.currencySelect?.value || this.currencyId;
      const amount = normalizePositiveInteger(this.refs.coinsInput?.value ?? this.coinsAmount, 0);
      if (!CURRENCY_OPTIONS.some(currency => currency.id === currencyId)) {
        throw new Error('Seleciona uma moeda nacional válida.');
      }
      if (amount <= 0) throw new Error('Indica uma quantidade de moedas válida.');
      return { type: 'nation_coins', details: { currencyId, amount } };
    }

    const itemName = String(this.refs.itemNameInput?.value ?? this.itemName).trim();
    const quantity = normalizePositiveInteger(this.refs.itemQuantityInput?.value ?? this.itemQuantity, 0);
    if (!itemName) throw new Error('Indica o nome do item a transferir.');
    if (quantity <= 0) throw new Error('Indica uma quantidade de itens válida.');
    return { type: 'item', details: { itemName, quantity } };
  }

  getTransferSummary(from, to, type, details) {
    if (type === 'gold') {
      return `${details.amount} ouro de ${from || 'Nenhum'} para ${to}`;
    }

    if (type === 'nation_coins') {
      const currency = CURRENCY_OPTIONS.find(option => option.id === details.currencyId);
      return `${details.amount} ${currency?.icon || ''} ${currency?.label || 'moedas'} de ${from || 'Nenhum'} para ${to}`;
    }

    return `${details.quantity} x ${details.itemName} de ${from || 'Nenhum'} para ${to}`;
  }

  loadCharacter(username, label = 'jogador') {
    const character = parseCharacter(localStorage.getItem(getCharacterStorageKey(username)));
    if (!character) {
      throw new Error(`Não foi possível carregar a ficha de ${label}.`);
    }
    return character;
  }

  saveCharacter(username, character) {
    localStorage.setItem(getCharacterStorageKey(username), JSON.stringify(character));
  }

  validateTransfer(from, to, type, details) {
    const targetCharacter = this.loadCharacter(to, to);

    if (type === 'gold') {
      if (from) {
        const sourceCharacter = this.loadCharacter(from, from);
        if (Math.max(0, toNumber(sourceCharacter.ouro, 0)) < details.amount) {
          throw new Error(`${from} não tem ouro suficiente.`);
        }
      }
      return targetCharacter;
    }

    if (type === 'nation_coins') {
      if (from) {
        const sourceCharacter = this.loadCharacter(from, from);
        ensureNationCoins(sourceCharacter);
        if ((sourceCharacter.moedas[details.currencyId] || 0) < details.amount) {
          throw new Error(`${from} não tem moedas suficientes.`);
        }
      }
      return targetCharacter;
    }

    if (from) {
      const sourceCharacter = this.loadCharacter(from, from);
      ensureInventory(sourceCharacter);
      const sourceItem = findInventoryItem(sourceCharacter.inventario, details.itemName);
      if (!sourceItem) {
        throw new Error(`${from} não tem o item "${details.itemName}".`);
      }
      if (normalizePositiveInteger(sourceItem.quantity, 1) < details.quantity) {
        throw new Error(`${from} não tem quantidade suficiente desse item.`);
      }
    }

    return targetCharacter;
  }

  async handleTransfer() {
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('Armazenamento local indisponível.');
      }

      const { type, details } = this.getTransferPayload();
      const from = this.fromPlayer;
      const to = this.toPlayer;
      const summary = this.getTransferSummary(from, to, type, details);

      this.validateTransfer(from, to, type, details);

      const confirmed = await confirmDialog(`Confirmar transferência forçada: ${summary}?`, {
        confirmText: 'Transferir',
        cancelText: 'Cancelar',
      });

      if (!confirmed) return;

      this.executeTransfer(from, to, type, details);
    } catch (error) {
      toast(error?.message || 'Não foi possível concluir a transferência.', 'error');
    }
  }

  executeTransfer(from, to, type, details) {
    this.validateTransfer(from, to, type, details);

    const sourceCharacter = from ? this.loadCharacter(from, from) : null;
    const targetCharacter = this.loadCharacter(to, to);
    const actor = this.getCurrentUsername();

    if (type === 'gold') {
      if (sourceCharacter) {
        sourceCharacter.ouro = Math.max(0, toNumber(sourceCharacter.ouro, 0)) - details.amount;
      }
      targetCharacter.ouro = Math.max(0, toNumber(targetCharacter.ouro, 0)) + details.amount;
    }

    if (type === 'nation_coins') {
      ensureNationCoins(targetCharacter);
      if (sourceCharacter) {
        ensureNationCoins(sourceCharacter);
        sourceCharacter.moedas[details.currencyId] -= details.amount;
      }
      targetCharacter.moedas[details.currencyId] += details.amount;
    }

    if (type === 'item') {
      ensureInventory(targetCharacter);

      let itemToTransfer;
      if (sourceCharacter) {
        ensureInventory(sourceCharacter);
        const sourceItem = findInventoryItem(sourceCharacter.inventario, details.itemName);
        itemToTransfer = {
          ...sourceItem,
          quantity: details.quantity,
        };
        removeInventoryItem(sourceCharacter.inventario, sourceItem, details.quantity);
      } else {
        itemToTransfer = {
          id: slugifyItemName(details.itemName),
          name: details.itemName,
          type: 'other',
          rarity: 'common',
          quantity: details.quantity,
        };
      }

      addInventoryItem(targetCharacter.inventario, itemToTransfer, details.quantity);
    }

    if (sourceCharacter) {
      this.saveCharacter(from, sourceCharacter);
    }
    this.saveCharacter(to, targetCharacter);

    log('gm_gift', {
      from: from || 'none',
      to,
      type,
      ...details,
    }, actor);

    toast(`Transferência concluída: ${this.getTransferSummary(from, to, type, details)}.`, 'success');

    this.container.dispatchEvent(new CustomEvent(GIFT_TRANSFER_UPDATED_EVENT, {
      bubbles: true,
      detail: {
        players: [from, to].filter(Boolean),
        from: from || null,
        to,
        type,
        details,
      },
    }));

    this.resetForm();
  }

  resetForm() {
    this.fromPlayer = '';
    this.toPlayer = '';
    this.transferType = 'gold';
    this.goldAmount = 1;
    this.currencyId = CURRENCY_OPTIONS[0]?.id || 'fire_coins';
    this.coinsAmount = 1;
    this.itemName = '';
    this.itemQuantity = 1;
    this.render();
  }
}
