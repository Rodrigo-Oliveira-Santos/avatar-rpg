/**
 * PlayerInventoryModal — GM-side view of another player's inventory.
 *
 * Loads the targeted player's character (Supabase-first via
 * `gm-characters`), wraps it in a temporary `Character` instance so the
 * existing equip/unequip/use helpers from `items/inventory.js` can be
 * reused unchanged, then persists the mutated data back through the
 * same helper.
 *
 * Scope: equip/unequip/decrement-consumable. Scrolls (which require
 * picking a target skill) are intentionally not actionable here — the
 * GM should use the player's own sheet for that nuanced flow.
 */

import { createElement, on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { Character } from '../character/index.js';
import {
  equipItem,
  unequipItem,
  removeItem,
  getInventory,
  getEquipped,
} from '../items/inventory.js';
import { loadPlayerCharacter, savePlayerCharacter } from '../api/gm-characters.js';

const SLOT_META = {
  arma:      { label: 'Arma',      icon: '⚔' },
  armadura:  { label: 'Armadura',  icon: '🛡' },
  acessorio: { label: 'Acessório', icon: '💍' },
};

const TYPE_LABELS = {
  weapon: 'Arma', armor: 'Armadura', accessory: 'Acessório',
  consumable: 'Consumível', scroll: 'Pergaminho', other: 'Outro',
};
const RARITY_LABELS = {
  common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário',
};
const RARITY_COLORS = {
  common: 'var(--text3)',
  rare: 'var(--water)',
  epic: 'var(--spirit)',
  legendary: 'var(--gold)',
};

const FILTERS = [
  { id: 'all',        label: 'Todos' },
  { id: 'weapon',     label: 'Armas' },
  { id: 'armor',      label: 'Armaduras' },
  { id: 'accessory',  label: 'Acessórios' },
  { id: 'consumable', label: 'Consumíveis' },
  { id: 'scroll',     label: 'Pergaminhos' },
];

function isEquippable(item) {
  return ['weapon', 'armor', 'accessory', 'shield', 'ring', 'amulet'].includes(item?.type);
}

function isConsumable(item) {
  return item?.type === 'consumable' || (!item?.type);
}

function normalizeQuantity(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export class PlayerInventoryModal {
  constructor({ authManager, onChanged } = {}) {
    this.authManager = authManager;
    this.onChanged = typeof onChanged === 'function' ? onChanged : null;
    this.overlay = null;
    this.player = null;
    /** @type {Character|null} */
    this.tempCharacter = null;
    this.activeFilter = 'all';
    this.searchQuery = '';
  }

  async open(player) {
    if (!player?.username) {
      toast('Sem jogador selecionado.', 'warning');
      return;
    }
    // Tear down any previous session before starting a new one.
    this.close();
    this.player = player;

    let raw = null;
    try {
      raw = await loadPlayerCharacter(player.username);
    } catch (err) {
      toast(`Falha a carregar ficha: ${err.message}`, 'error');
      return;
    }
    if (!raw) {
      toast(`Sem ficha para ${player.name || player.username}.`, 'warning');
      return;
    }

    // Wrap in a throwaway Character so the existing equip/unequip
    // helpers (which speak the Character interface) work without
    // reimplementation.
    this.tempCharacter = new Character();
    this.tempCharacter.load(raw);

    this.render();
  }

  close() {
    this.overlay?.remove?.();
    this.overlay = null;
    this.player = null;
    this.tempCharacter = null;
  }

  async persist() {
    if (!this.tempCharacter || !this.player) return false;
    try {
      await savePlayerCharacter(this.player.username, this.tempCharacter.serialize());
      this.onChanged?.(this.player);
      return true;
    } catch (err) {
      toast(`Falha a gravar: ${err.message}`, 'error');
      return false;
    }
  }

  render() {
    this.overlay?.remove?.();

    const overlay = createElement('div', { class: 'modal-overlay' });
    const box = createElement('div', {
      class: 'modal-box',
      style: 'max-width: 760px; max-height: 90vh; display: flex; flex-direction: column;',
    });

    const title = createElement('h2', {
      class: 'modal-title',
      textContent: `🎒 Inventário de ${this.player?.name || this.player?.username}`,
    });
    box.appendChild(title);

    // Equipped slots
    box.appendChild(this.renderEquippedSection());

    // Filter + search
    const controls = createElement('div', {
      style: 'display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 10px 0 8px;',
    });
    const filterSelect = createElement('select', {
      style: 'padding: 6px 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; color: var(--text);',
    });
    FILTERS.forEach((f) => {
      const opt = createElement('option', { value: f.id, textContent: f.label });
      filterSelect.appendChild(opt);
    });
    filterSelect.value = this.activeFilter;
    on(filterSelect, 'change', () => { this.activeFilter = filterSelect.value; this.render(); });

    const search = createElement('input', {
      type: 'search',
      placeholder: '🔍 Procurar…',
      value: this.searchQuery,
      style: 'flex: 1; padding: 6px 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; color: var(--text);',
    });
    on(search, 'input', () => { this.searchQuery = search.value; this.renderInventoryList(); });

    controls.appendChild(filterSelect);
    controls.appendChild(search);
    box.appendChild(controls);

    // Inventory list
    const listHost = createElement('div', {
      style: 'flex: 1 1 auto; overflow-y: auto; display: grid; gap: 6px; padding-right: 4px; min-height: 200px;',
    });
    this.listHost = listHost;
    box.appendChild(listHost);
    this.renderInventoryList();

    const actions = createElement('div', { class: 'modal-actions' });
    const close = createElement('button', {
      type: 'button',
      class: 'modal-btn modal-btn-cancel',
      textContent: 'Fechar',
    });
    on(close, 'click', () => this.close());
    actions.appendChild(close);
    box.appendChild(actions);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    on(overlay, 'click', (e) => { if (e.target === overlay) this.close(); });
    this.overlay = overlay;
  }

  renderEquippedSection() {
    const wrap = createElement('section', {
      style: 'padding: 8px; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px;',
    });
    wrap.appendChild(createElement('div', {
      style: 'font-size: 11px; font-weight: 600; color: var(--text2); margin-bottom: 6px;',
      textContent: 'Equipado',
    }));

    const grid = createElement('div', {
      style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;',
    });
    const equipped = getEquipped(this.tempCharacter) || {};
    Object.entries(SLOT_META).forEach(([slot, meta]) => {
      grid.appendChild(this.renderSlot(slot, meta, equipped[slot]));
    });
    wrap.appendChild(grid);
    return wrap;
  }

  renderSlot(slot, meta, item) {
    const cell = createElement('div', {
      style: 'padding: 8px; border: 1px solid var(--border); border-radius: 5px; background: var(--bg); display: flex; flex-direction: column; gap: 4px;',
    });
    const head = createElement('div', { style: 'font-size: 10px; color: var(--text3);' });
    head.textContent = `${meta.icon} ${meta.label}`;
    cell.appendChild(head);

    if (item && (item.name || item.id)) {
      cell.appendChild(createElement('div', {
        style: 'font-size: 12px; font-weight: 600;',
        textContent: item.name || `(${item.id || 'item'})`,
      }));
      if (item.rarity) {
        cell.appendChild(createElement('span', {
          style: `font-size: 10px; color: ${RARITY_COLORS[item.rarity] || 'var(--text3)'};`,
          textContent: RARITY_LABELS[item.rarity] || item.rarity,
        }));
      }
      const unequipBtn = createElement('button', {
        type: 'button',
        class: 'gm-action-btn',
        textContent: 'Desequipar',
        style: 'margin-top: 4px;',
      });
      on(unequipBtn, 'click', () => this.handleUnequip(slot, item));
      cell.appendChild(unequipBtn);
    } else {
      cell.appendChild(createElement('div', {
        style: 'font-size: 11px; color: var(--text3); font-style: italic;',
        textContent: '— vazio —',
      }));
    }
    return cell;
  }

  getFilteredInventory() {
    const items = getInventory(this.tempCharacter) || [];
    const search = this.searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      if (!item) return false;
      if (this.activeFilter !== 'all') {
        const matches = item.type === this.activeFilter
          || (this.activeFilter === 'consumable' && !item.type);
        if (!matches) return false;
      }
      if (search && !String(item.name || '').toLowerCase().includes(search)) return false;
      return true;
    });
  }

  renderInventoryList() {
    const host = this.listHost;
    if (!host) return;
    host.innerHTML = '';

    const items = this.getFilteredInventory();
    if (items.length === 0) {
      host.appendChild(createElement('div', {
        style: 'padding: 16px; text-align: center; color: var(--text3); font-size: 12px;',
        textContent: 'Nenhum item no inventário com este filtro.',
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
    const head = createElement('div', { style: 'display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap;' });
    head.appendChild(createElement('strong', { textContent: item.name || '(item)', style: 'font-size: 13px;' }));
    head.appendChild(createElement('span', {
      style: 'font-size: 10px; color: var(--text3);',
      textContent: `${TYPE_LABELS[item.type] || 'Consumível'} • x${normalizeQuantity(item.quantity)}`,
    }));
    if (item.rarity) {
      head.appendChild(createElement('span', {
        style: `font-size: 10px; color: ${RARITY_COLORS[item.rarity] || 'var(--text3)'};`,
        textContent: RARITY_LABELS[item.rarity] || item.rarity,
      }));
    }
    info.appendChild(head);
    if (item.description) {
      info.appendChild(createElement('div', {
        style: 'font-size: 11px; color: var(--text2); margin-top: 2px;',
        textContent: item.description,
      }));
    }
    row.appendChild(info);

    const buttons = createElement('div', { style: 'display: flex; flex-direction: column; gap: 4px; min-width: 100px;' });

    if (isEquippable(item)) {
      const equipBtn = createElement('button', {
        type: 'button',
        class: 'gm-action-btn',
        textContent: 'Equipar',
      });
      on(equipBtn, 'click', () => this.handleEquip(item));
      buttons.appendChild(equipBtn);
    }

    if (isConsumable(item)) {
      const useBtn = createElement('button', {
        type: 'button',
        class: 'gm-action-btn',
        textContent: 'Usar',
      });
      on(useBtn, 'click', () => this.handleUse(item));
      buttons.appendChild(useBtn);
    }

    const removeBtn = createElement('button', {
      type: 'button',
      class: 'gm-action-btn',
      textContent: 'Remover -1',
      style: 'color: #f08070; border-color: rgba(196, 48, 48, 0.45);',
    });
    on(removeBtn, 'click', () => this.handleRemoveOne(item));
    buttons.appendChild(removeBtn);

    row.appendChild(buttons);
    return row;
  }

  async handleEquip(item) {
    const result = equipItem(this.tempCharacter, item.id);
    if (!result?.success) {
      toast(result?.error || 'Falha ao equipar.', 'error');
      return;
    }
    if (!(await this.persist())) return;
    toast(`${this.player.name || this.player.username}: equipou "${item.name}".`, 'success');
    this.render();
  }

  async handleUnequip(slot, item) {
    const result = unequipItem(this.tempCharacter, slot);
    if (!result?.success) {
      toast(result?.error || 'Falha ao desequipar.', 'error');
      return;
    }
    if (!(await this.persist())) return;
    toast(`${this.player.name || this.player.username}: desequipou "${item?.name || slot}".`, 'info');
    this.render();
  }

  async handleUse(item) {
    const confirmed = await confirmDialog(`Usar "${item.name}" em nome do jogador?`);
    if (!confirmed) return;
    const ok = removeItem(this.tempCharacter, item.id, 1);
    if (!ok) {
      toast('Não foi possível usar o item.', 'error');
      return;
    }
    if (!(await this.persist())) return;
    toast(`${this.player.name || this.player.username} usou "${item.name}".`, 'success');
    this.render();
  }

  async handleRemoveOne(item) {
    const confirmed = await confirmDialog(`Remover 1 x "${item.name}" do inventário?`);
    if (!confirmed) return;
    const ok = removeItem(this.tempCharacter, item.id, 1);
    if (!ok) {
      toast('Não foi possível remover.', 'error');
      return;
    }
    if (!(await this.persist())) return;
    toast(`Removido 1 x "${item.name}".`, 'warning');
    this.render();
  }
}
