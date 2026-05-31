/**
 * Inventory Page Renderer
 */

import { createElement, on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { getEquipmentEffect } from '../character/stats.js';
import { equipItem, unequipItem, removeItem, getInventory, getEquipped } from './inventory.js';
import { applyScroll, getEligibleSkills } from './scrolls.js';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'weapon', label: 'Armas' },
  { id: 'armor', label: 'Armaduras' },
  { id: 'accessory', label: 'Acessórios' },
  { id: 'consumable', label: 'Consumíveis' },
  { id: 'scroll', label: 'Pergaminhos' },
];

const SLOT_META = {
  arma: { label: 'Arma', icon: '⚔' },
  armadura: { label: 'Armadura', icon: '🛡' },
  acessorio: { label: 'Acessório', icon: '💍' },
};

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

function normalizeRarity(rarity) {
  return ['common', 'rare', 'epic', 'legendary'].includes(rarity) ? rarity : 'common';
}

function normalizeQuantity(quantity = 1) {
  const parsed = Number.parseInt(quantity, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function isConsumable(item) {
  return item?.type === 'consumable' || item?.type === 'scroll' || !item?.type;
}

function isEquippable(item) {
  return ['weapon', 'armor', 'accessory', 'shield', 'ring', 'amulet'].includes(item?.type);
}

function getItemSlot(type) {
  const slots = {
    weapon: 'arma',
    armor: 'armadura',
    accessory: 'acessorio',
    shield: 'armadura',
    ring: 'acessorio',
    amulet: 'acessorio',
  };
  return slots[type] || null;
}

function formatValue(value) {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.0', '');
}

function formatBaseStat(effect) {
  if (!effect) return '0';

  if (typeof effect.baseDisplay === 'string') {
    return effect.baseNumeric > 0
      ? `${effect.baseDisplay} (média ${formatValue(effect.baseNumeric)})`
      : effect.baseDisplay;
  }

  return formatValue(effect.baseNumeric);
}

function getItemMeta(item, { includePrimaryStat = true } = {}) {
  const meta = [];

  const defenseValue = item.defense ?? item.defense_bonus;
  const dodgePenalty = item.penalty ?? item.dodge_penalty;

  if (includePrimaryStat && item.damage) meta.push(`DMG ${item.damage}`);
  if (includePrimaryStat && defenseValue) meta.push(`DEF +${defenseValue}`);
  if (dodgePenalty) {
    meta.push(dodgePenalty > 0 ? `ESQ -${dodgePenalty}` : `ESQ +${Math.abs(dodgePenalty)}`);
  }
  if (item.effect) meta.push(item.effect);
  if (item.scrollType === 'slot_expand') {
    const scrollValue = Number.parseInt(item.scrollValue, 10) || 1;
    meta.push(`+${scrollValue} slot${scrollValue === 1 ? '' : 's'} na skill`);
  }
  if (item.scrollType === 'mastery') meta.push('Marca uma skill como Dominada');
  if (item.element) meta.push(`Elemento: ${item.element}`);

  return meta;
}

export class InventoryPage {
  constructor(container, character) {
    this.container = container;
    this.character = character;
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.selectedItemRef = null;
    this.selectedScrollSkillId = '';

    this.render();
  }

  getFilteredInventory() {
    const query = this.searchQuery.trim().toLowerCase();

    return getInventory(this.character).filter(item => {
      const matchesFilter = this.activeFilter === 'all'
        || item.type === this.activeFilter
        || (this.activeFilter === 'consumable' && !item.type);
      const matchesSearch = !query || item.name?.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }

  resolveSelectedItem() {
    if (!this.selectedItemRef) return null;

    const inventoryItems = getInventory(this.character);
    const equippedItems = getEquipped(this.character);
    const { id, source, slot } = this.selectedItemRef;

    if (source === 'equipped' && slot && equippedItems?.[slot]?.id === id) {
      return { source: 'equipped', item: equippedItems[slot], slot };
    }

    const inventoryItem = inventoryItems.find(item => item.id === id);
    if (inventoryItem) {
      return { source: 'inventory', item: inventoryItem };
    }

    if (slot && equippedItems?.[slot]?.id === id) {
      return { source: 'equipped', item: equippedItems[slot], slot };
    }

    this.selectedItemRef = null;
    this.selectedScrollSkillId = '';
    return null;
  }

  selectItem(item, source = 'inventory', slot = null) {
    const sameSelection = item
      && this.selectedItemRef?.id === item.id
      && this.selectedItemRef?.source === source
      && this.selectedItemRef?.slot === slot;

    this.selectedItemRef = item ? { id: item.id, source, slot } : null;
    if (!sameSelection) {
      this.selectedScrollSkillId = '';
    }
    this.render();
  }

  createSectionHeader(title, extraContent = null) {
    const header = createElement('div', { class: 'inventory-section-header' });
    header.appendChild(createElement('h3', { class: 'inventory-section-title', textContent: title }));
    if (extraContent) header.appendChild(extraContent);
    return header;
  }

  createRarityBadge(item) {
    const rarity = normalizeRarity(item.rarity);
    return createElement('span', {
      class: `inv-rarity-badge rarity-${rarity}`,
      textContent: RARITY_LABELS[rarity],
    });
  }

  createEffectiveStatMeta(slot, item) {
    const effect = getEquipmentEffect(slot, item);
    if (!effect) return null;

    const meta = createElement('div', { class: 'equip-slot-card-meta' });
    const basePrefix = effect.slot === 'acessorio'
      ? `${effect.label} +${formatValue(effect.baseNumeric)}`
      : `${effect.label} ${effect.baseDisplay}`;

    meta.appendChild(createElement('span', { textContent: basePrefix }));

    if (effect.finalValue > effect.baseNumeric) {
      const finalPrefix = effect.slot === 'acessorio' ? '+' : '';
      meta.appendChild(createElement('span', {
        class: 'inv-stat-boost',
        textContent: ` → ${finalPrefix}${formatValue(effect.finalValue)}`,
      }));
    }

    if (effect.penalty) {
      meta.appendChild(createElement('span', {
        class: 'inv-stat-muted',
        textContent: effect.penalty > 0
          ? ` • ESQ -${formatValue(effect.penalty)}`
          : ` • ESQ +${formatValue(Math.abs(effect.penalty))}`,
      }));
    }

    return meta;
  }

  createEffectBreakdown(slot, item) {
    const effect = getEquipmentEffect(slot, item);
    if (!effect) return null;

    const breakdown = createElement('div', { class: 'inv-detail-breakdown' });
    breakdown.appendChild(createElement('h4', {
      class: 'inv-detail-breakdown-title',
      textContent: 'Bónus de raridade',
    }));

    const rarityPercent = Math.round((effect.rarity.multiplier - 1) * 100);
    const rows = [
      { label: `${effect.detailLabel} base`, value: formatBaseStat(effect) },
      {
        label: 'Raridade',
        value: `+${rarityPercent}% (${RARITY_LABELS[effect.rarityKey]}) = ${formatValue(effect.scaledValue)}`,
      },
      { label: 'Extra', value: `+${effect.extraStat} bónus` },
      { label: `${effect.detailLabel} efetivo`, value: formatValue(effect.finalValue), boost: true },
    ];

    if (effect.penalty) {
      rows.push({
        label: 'Penalidade de esquiva',
        value: effect.penalty > 0 ? `-${formatValue(effect.penalty)}` : `+${formatValue(Math.abs(effect.penalty))}`,
      });
    }

    rows.forEach(({ label, value, boost = false }) => {
      const row = createElement('div', { class: 'inv-detail-breakdown-row' });
      row.appendChild(createElement('span', {
        class: 'inv-detail-breakdown-label',
        textContent: label,
      }));
      row.appendChild(createElement('span', {
        class: `inv-detail-breakdown-value${boost ? ' inv-stat-boost' : ''}`,
        textContent: value,
      }));
      breakdown.appendChild(row);
    });

    return breakdown;
  }

  createItemCard(item) {
    const rarity = normalizeRarity(item.rarity);
    const isSelected = this.selectedItemRef?.id === item.id && this.selectedItemRef?.source === 'inventory';
    const card = createElement('button', {
      type: 'button',
      class: `inv-item-card rarity-${rarity}${isSelected ? ' is-selected' : ''}`,
    });

    card.appendChild(createElement('div', { class: 'inv-item-name', textContent: item.name || 'Item sem nome' }));
    card.appendChild(createElement('div', { class: 'inv-item-type', textContent: TYPE_LABELS[item.type] || 'Consumível' }));
    card.appendChild(this.createRarityBadge(item));

    const quantity = createElement('span', {
      class: 'inv-quantity-badge',
      textContent: `x${normalizeQuantity(item.quantity)}`,
    });
    card.appendChild(quantity);

    const meta = getItemMeta(item);
    if (meta.length > 0) {
      card.appendChild(createElement('div', {
        class: 'inv-item-meta',
        textContent: meta[0],
      }));
    }

    on(card, 'click', () => this.selectItem(item, 'inventory'));
    return card;
  }

  createEquipmentCard(slot, item) {
    const { label, icon } = SLOT_META[slot];
    const card = createElement('div', {
      class: `equip-slot-card${item ? ' has-item' : ''}`,
    });

    card.appendChild(createElement('div', {
      class: 'equip-slot-card-label',
      textContent: `${icon} ${label}`,
    }));

    if (!item) {
      card.appendChild(createElement('div', {
        class: 'equip-slot-card-name is-empty',
        textContent: 'Vazio',
      }));
      return card;
    }

    const rarity = normalizeRarity(item.rarity);
    card.classList.add(`rarity-${rarity}`);
    card.appendChild(createElement('div', {
      class: 'equip-slot-card-name',
      textContent: item.name,
    }));

    const effectiveMeta = this.createEffectiveStatMeta(slot, item);
    if (effectiveMeta) {
      card.appendChild(effectiveMeta);
    }

    const meta = getItemMeta(item, { includePrimaryStat: false });
    if (meta.length > 0) {
      card.appendChild(createElement('div', {
        class: 'equip-slot-card-meta',
        textContent: meta[0],
      }));
    }

    const actions = createElement('div', { class: 'equip-slot-card-actions' });
    const detailsBtn = createElement('button', {
      type: 'button',
      class: 'inv-secondary-btn',
      textContent: 'Detalhes',
    });
    on(detailsBtn, 'click', () => this.selectItem(item, 'equipped', slot));

    const unequipBtn = createElement('button', {
      type: 'button',
      class: 'inv-primary-btn',
      textContent: 'Desequipar',
    });
    on(unequipBtn, 'click', async () => {
      const confirmed = await confirmDialog(`Desequipar "${item.name}"?`);
      if (!confirmed) return;

      const result = unequipItem(this.character, slot);
      if (result.success) {
        this.selectedItemRef = null;
        this.selectedScrollSkillId = '';
        toast(`"${item.name}" foi desequipado.`, 'success');
        this.render();
      } else {
        toast(result.error || 'Não foi possível desequipar o item.', 'error');
      }
    });

    actions.appendChild(detailsBtn);
    actions.appendChild(unequipBtn);
    card.appendChild(actions);

    return card;
  }

  createDetailPanel() {
    const selected = this.resolveSelectedItem();
    if (!selected) return null;

    const { item, source, slot } = selected;
    const detailSlot = slot || getItemSlot(item.type);
    const panel = createElement('div', { class: 'inv-detail-panel' });
    const backdrop = createElement('button', {
      type: 'button',
      class: 'inv-detail-backdrop',
      ariaLabel: 'Fechar detalhes do item',
    });
    on(backdrop, 'click', () => this.selectItem(null));

    const closeBtn = createElement('button', {
      type: 'button',
      class: 'inv-detail-close',
      textContent: '✕',
      ariaLabel: 'Fechar',
    });
    on(closeBtn, 'click', () => this.selectItem(null));

    const rarity = normalizeRarity(item.rarity);
    panel.appendChild(closeBtn);
    panel.appendChild(createElement('div', {
      class: 'inv-detail-eyebrow',
      textContent: source === 'equipped' ? `Equipado • ${SLOT_META[slot]?.label || 'Slot'}` : 'Mochila',
    }));

    const header = createElement('div', { class: 'inv-detail-header' });
    header.appendChild(createElement('h3', { class: 'inv-detail-title', textContent: item.name || 'Item sem nome' }));
    header.appendChild(createElement('span', {
      class: `inv-rarity-badge rarity-${rarity}`,
      textContent: RARITY_LABELS[rarity],
    }));
    panel.appendChild(header);

    panel.appendChild(createElement('div', {
      class: 'inv-detail-type',
      textContent: TYPE_LABELS[item.type] || 'Consumível',
    }));

    panel.appendChild(createElement('p', {
      class: 'inv-detail-description',
      textContent: item.description || 'Sem descrição disponível.',
    }));

    const breakdown = this.createEffectBreakdown(detailSlot, item);
    if (breakdown) {
      panel.appendChild(breakdown);
    }

    const statList = createElement('div', { class: 'inv-detail-stats' });
    getItemMeta(item, { includePrimaryStat: !breakdown }).forEach(entry => {
      statList.appendChild(createElement('span', {
        class: 'inv-detail-stat',
        textContent: entry,
      }));
    });

    if (source === 'inventory') {
      statList.appendChild(createElement('span', {
        class: 'inv-detail-stat',
        textContent: `Quantidade: ${normalizeQuantity(item.quantity)}`,
      }));
    }

    if (statList.children.length > 0) {
      panel.appendChild(statList);
    }

    if (source === 'inventory' && item.type === 'scroll') {
      panel.appendChild(this.createScrollUsageSection(item));
    }

    const actions = createElement('div', { class: 'inv-detail-actions' });

    if (source === 'inventory' && isEquippable(item)) {
      const equipBtn = createElement('button', {
        type: 'button',
        class: 'inv-primary-btn',
        textContent: 'Equipar',
      });
      on(equipBtn, 'click', () => this.handleEquip(item));
      actions.appendChild(equipBtn);
    }

    if (source === 'inventory' && isConsumable(item) && item.type !== 'scroll') {
      const useBtn = createElement('button', {
        type: 'button',
        class: 'inv-primary-btn',
        textContent: 'Usar',
      });
      on(useBtn, 'click', () => this.handleUse(item));
      actions.appendChild(useBtn);
    }

    if (source === 'equipped') {
      const unequipBtn = createElement('button', {
        type: 'button',
        class: 'inv-primary-btn',
        textContent: 'Desequipar',
      });
      on(unequipBtn, 'click', async () => {
        const confirmed = await confirmDialog(`Desequipar "${item.name}"?`);
        if (!confirmed) return;

        const result = unequipItem(this.character, slot);
        if (result.success) {
          this.selectedItemRef = null;
          this.selectedScrollSkillId = '';
          toast(`"${item.name}" foi desequipado.`, 'success');
          this.render();
        } else {
          toast(result.error || 'Não foi possível desequipar o item.', 'error');
        }
      });
      actions.appendChild(unequipBtn);
    }

    if (actions.children.length > 0) {
      panel.appendChild(actions);
    }

    const wrapper = createElement('div', { class: 'inv-detail-overlay' }, [backdrop, panel]);
    return wrapper;
  }

  createScrollUsageSection(item) {
    const section = createElement('div', { class: 'inv-scroll-section' });
    section.appendChild(createElement('h4', {
      class: 'inv-scroll-title',
      textContent: 'Selecionar habilidade alvo',
    }));

    const eligibleSkills = getEligibleSkills(this.character, item);
    if (eligibleSkills.length === 0) {
      section.appendChild(createElement('p', {
        class: 'inv-scroll-empty',
        textContent: 'Não tens habilidades ativas compatíveis para este pergaminho.',
      }));
      return section;
    }

    const controls = createElement('div', { class: 'inv-scroll-controls' });
    const select = createElement('select', { class: 'inv-filter-select inv-scroll-select' });
    select.appendChild(createElement('option', {
      value: '',
      textContent: 'Escolher habilidade...',
    }));

    eligibleSkills.forEach(({ skillId, skillName }) => {
      select.appendChild(createElement('option', {
        value: skillId,
        textContent: skillName,
      }));
    });

    const hasSelectedSkill = eligibleSkills.some(({ skillId }) => skillId === this.selectedScrollSkillId);
    if (hasSelectedSkill) {
      select.value = this.selectedScrollSkillId;
    }

    const applyBtn = createElement('button', {
      type: 'button',
      class: 'inv-primary-btn',
      textContent: 'Aplicar',
      disabled: !select.value,
    });

    on(select, 'change', () => {
      this.selectedScrollSkillId = select.value;
      applyBtn.disabled = !select.value;
    });
    on(applyBtn, 'click', () => this.handleApplyScroll(item, select.value));

    controls.appendChild(select);
    controls.appendChild(applyBtn);
    section.appendChild(controls);
    section.appendChild(createElement('p', {
      class: 'inv-scroll-note',
      textContent: 'Os pergaminhos são consumidos e o efeito é permanente.',
    }));

    return section;
  }

  async handleEquip(item) {
    const result = equipItem(this.character, item.id);
    if (!result.success) {
      toast(result.error || 'Não foi possível equipar o item.', 'error');
      return;
    }

    this.selectedItemRef = null;
    this.selectedScrollSkillId = '';
    toast(result.previousItem ? `"${item.name}" equipado. O item anterior voltou para a mochila.` : `"${item.name}" equipado!`, 'success');
    this.render();
  }

  async handleApplyScroll(item, skillId) {
    const targetSkill = getEligibleSkills(this.character, item).find(skill => skill.skillId === skillId);
    if (!targetSkill) {
      toast('Seleciona uma habilidade válida para aplicar o pergaminho.', 'error');
      return;
    }

    const confirmed = await confirmDialog(
      `Aplicar "${item.name}" em "${targetSkill.skillName}"? Esta ação é permanente e o pergaminho será consumido.`
    );
    if (!confirmed) return;

    const result = applyScroll(this.character, item, skillId);
    if (!result.success) {
      toast(result.message || 'Não foi possível aplicar o pergaminho.', 'error');
      return;
    }

    this.selectedItemRef = null;
    this.selectedScrollSkillId = '';
    toast(result.message, 'success');
    this.render();
  }

  async handleUse(item) {
    const confirmed = await confirmDialog(`Usar "${item.name}"?`);
    if (!confirmed) return;

    const success = removeItem(this.character, item.id, 1);
    if (!success) {
      toast('Não foi possível usar o item.', 'error');
      return;
    }

    this.selectedItemRef = null;
    this.selectedScrollSkillId = '';
    toast(`Usaste "${item.name}".`, 'success');
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const page = createElement('section', { class: 'inventory-page' });

    const header = createElement('div', { class: 'inventory-page-header' });
    header.appendChild(createElement('h2', { class: 'inventory-page-title', textContent: '📦 Inventário' }));

    const filterBar = createElement('div', { class: 'inv-filter-bar' });
    const filterSelect = createElement('select', { class: 'inv-filter-select' });
    FILTERS.forEach(filter => {
      filterSelect.appendChild(createElement('option', {
        value: filter.id,
        textContent: filter.label,
      }));
    });
    filterSelect.value = this.activeFilter;
    on(filterSelect, 'change', () => {
      this.activeFilter = filterSelect.value;
      this.render();
    });

    const searchInput = createElement('input', {
      type: 'search',
      class: 'inv-search-input',
      placeholder: '🔍 Procurar item...',
      value: this.searchQuery,
    });
    on(searchInput, 'input', () => {
      this.searchQuery = searchInput.value;
      this.render();
    });

    filterBar.appendChild(filterSelect);
    filterBar.appendChild(searchInput);
    header.appendChild(filterBar);
    page.appendChild(header);

    const equipSection = createElement('section', { class: 'equip-section' });
    equipSection.appendChild(this.createSectionHeader('Equipado'));

    const equipGrid = createElement('div', { class: 'equip-slots-grid' });
    const equipped = getEquipped(this.character);
    Object.keys(SLOT_META).forEach(slot => {
      equipGrid.appendChild(this.createEquipmentCard(slot, equipped?.[slot] || null));
    });
    equipSection.appendChild(equipGrid);
    page.appendChild(equipSection);

    const backpackSection = createElement('section', { class: 'backpack-section' });
    const inventoryItems = this.getFilteredInventory();
    backpackSection.appendChild(this.createSectionHeader('Mochila', createElement('span', {
      class: 'inventory-count',
      textContent: `${inventoryItems.length} item${inventoryItems.length === 1 ? '' : 's'}`,
    })));

    if (inventoryItems.length === 0) {
      backpackSection.appendChild(createElement('div', {
        class: 'inventory-empty-state',
        textContent: 'Nenhum item encontrado com os filtros atuais.',
      }));
    } else {
      const grid = createElement('div', { class: 'backpack-grid' });
      inventoryItems.forEach(item => grid.appendChild(this.createItemCard(item)));
      backpackSection.appendChild(grid);
    }

    page.appendChild(backpackSection);

    const detailPanel = this.createDetailPanel();
    if (detailPanel) page.appendChild(detailPanel);

    this.container.appendChild(page);
  }

  refresh() {
    this.render();
  }

  destroy() {}
}

export { InventoryPage as ItemList };
