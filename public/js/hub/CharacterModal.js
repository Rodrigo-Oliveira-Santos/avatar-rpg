/**
 * GM character sheet modal (read-only)
 */

import { createElement, on, $ } from '../utils/dom.js';
import { calculateAllStats } from '../character/stats.js';

const ELEMENT_LABELS = {
  fire: 'Fogo',
  water: 'Água',
  earth: 'Terra',
  air: 'Ar',
  none: 'Sem Dobra',
};

const ATTRIBUTE_LABELS = ['FOR', 'AGI', 'CHI', 'PER', 'RES', 'ESP'];
const EQUIPMENT_LABELS = {
  arma: 'Arma',
  armadura: 'Armadura',
  acessorio: 'Acessório',
};

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getCharacterStats(characterData) {
  const derived = calculateAllStats({
    identidade: characterData?.identidade || {},
    atributos: characterData?.atributos || {},
    subclass_bonus: characterData?.subclass_bonus || {},
    equipamentos: characterData?.equipamentos || {},
  });

  return {
    hp: derived.maxHP,
    chi: derived.maxCP,
    spirit: derived.maxSP,
    defense: derived.defense,
    dodge: derived.dodge,
  };
}

function formatItemName(item) {
  if (!item || typeof item !== 'object') return '—';
  return item.name || item.nome || item.id || '—';
}

function formatEquipmentDetails(item) {
  if (!item || typeof item !== 'object') return '—';

  const details = [];
  const defenseValue = item.defense ?? item.defense_bonus;
  const dodgePenalty = item.penalty ?? item.dodge_penalty;

  if (item.damage) details.push(`DMG ${item.damage}`);
  if (defenseValue) {
    details.push(defenseValue > 0 ? `DEF +${defenseValue}` : `DEF ${defenseValue}`);
  }
  if (dodgePenalty) {
    details.push(dodgePenalty > 0 ? `ESQ -${dodgePenalty}` : `ESQ +${Math.abs(dodgePenalty)}`);
  }
  if (item.effect) details.push(item.effect);

  return details.join(' • ');
}

function getInventoryItems(characterData) {
  const inventory = Array.isArray(characterData?.inventario) ? characterData.inventario : [];
  if (inventory.length > 0) return inventory;

  return Array.isArray(characterData?.itens) ? characterData.itens : [];
}

export class CharacterModal {
  constructor() {
    this.overlay = null;
    this.removeOverlayClick = null;
    this.removeCloseClick = null;
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  show(characterData, username = '') {
    if (!characterData || typeof document === 'undefined') return;

    this.close();

    const identidade = characterData.identidade || {};
    const atributos = characterData.atributos || {};
    const equipamentos = characterData.equipamentos || {};
    const inventory = getInventoryItems(characterData);
    const stats = getCharacterStats(characterData);
    const element = String(identidade.elemento || 'none').toLowerCase();
    const name = identidade.nome || username || 'Sem nome';
    const level = Math.max(1, toNumber(identidade.nivel, 1));

    const overlay = createElement('div', { class: 'character-modal-overlay' });
    const modal = createElement('div', {
      class: 'character-modal',
      role: 'dialog',
      ariaModal: 'true',
      ariaLabel: `Ficha de ${name}`,
      tabIndex: -1,
    });

    const header = createElement('div', { class: 'character-modal-header' });
    const titleWrap = createElement('div', { class: 'character-modal-title-wrap' });
    titleWrap.appendChild(createElement('h2', {
      class: 'character-modal-title',
      textContent: name,
    }));

    const meta = createElement('div', { class: 'character-modal-meta' });
    meta.appendChild(createElement('span', {
      class: `character-modal-element ${element}`,
      textContent: ELEMENT_LABELS[element] || 'Sem Dobra',
    }));
    meta.appendChild(createElement('span', {
      class: 'character-modal-chip',
      textContent: `Nv. ${level}`,
    }));
    meta.appendChild(createElement('span', {
      class: 'character-modal-chip',
      textContent: identidade.subclasse || 'Sem subclasse',
    }));
    if (username) {
      meta.appendChild(createElement('span', {
        class: 'character-modal-chip subtle',
        textContent: `@${username}`,
      }));
    }
    titleWrap.appendChild(meta);

    const closeBtn = createElement('button', {
      class: 'character-modal-close',
      type: 'button',
      ariaLabel: 'Fechar ficha',
      textContent: '×',
    });

    header.appendChild(titleWrap);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    modal.appendChild(createElement('div', {
      class: 'character-modal-gold',
      textContent: `💰 Ouro: ${toNumber(characterData.ouro, 0)}`,
    }));

    const statsGrid = createElement('div', { class: 'character-modal-stats-grid' });

    const attributesSection = createElement('section', { class: 'character-modal-panel' });
    attributesSection.appendChild(createElement('h3', {
      class: 'character-modal-section-title',
      textContent: 'Atributos',
    }));
    const attributesList = createElement('div', { class: 'character-modal-list' });
    ATTRIBUTE_LABELS.forEach(label => {
      const row = createElement('div', { class: 'character-modal-row' });
      row.appendChild(createElement('span', { textContent: label }));
      row.appendChild(createElement('strong', { textContent: String(toNumber(atributos[label], 0)) }));
      attributesList.appendChild(row);
    });
    attributesSection.appendChild(attributesList);

    const derivedSection = createElement('section', { class: 'character-modal-panel' });
    derivedSection.appendChild(createElement('h3', {
      class: 'character-modal-section-title',
      textContent: 'Stats Derivados',
    }));
    const derivedList = createElement('div', { class: 'character-modal-list' });
    [
      ['HP', stats.hp],
      ['Chi', stats.chi],
      ['Espírito', stats.spirit],
      ['Defesa', stats.defense],
      ['Esquiva', stats.dodge],
    ].forEach(([label, value]) => {
      const row = createElement('div', { class: 'character-modal-row' });
      row.appendChild(createElement('span', { textContent: label }));
      row.appendChild(createElement('strong', { textContent: String(value) }));
      derivedList.appendChild(row);
    });
    derivedSection.appendChild(derivedList);

    statsGrid.appendChild(attributesSection);
    statsGrid.appendChild(derivedSection);
    modal.appendChild(statsGrid);

    const equipmentSection = createElement('section', { class: 'character-modal-panel' });
    equipmentSection.appendChild(createElement('h3', {
      class: 'character-modal-section-title',
      textContent: 'Equipamento',
    }));
    const equipmentList = createElement('div', { class: 'character-modal-list' });
    Object.entries(EQUIPMENT_LABELS).forEach(([slot, label]) => {
      const item = equipamentos[slot];
      const row = createElement('div', { class: 'character-modal-stack' });
      row.appendChild(createElement('div', { class: 'character-modal-row' }, [
        createElement('span', { textContent: label }),
        createElement('strong', { textContent: formatItemName(item) }),
      ]));
      if (item) {
        row.appendChild(createElement('div', {
          class: 'character-modal-detail',
          textContent: formatEquipmentDetails(item),
        }));
      }
      equipmentList.appendChild(row);
    });
    equipmentSection.appendChild(equipmentList);
    modal.appendChild(equipmentSection);

    const inventorySection = createElement('section', { class: 'character-modal-panel' });
    inventorySection.appendChild(createElement('h3', {
      class: 'character-modal-section-title',
      textContent: 'Inventário',
    }));

    if (inventory.length === 0) {
      inventorySection.appendChild(createElement('p', {
        class: 'character-modal-empty',
        textContent: 'Sem itens no inventário.',
      }));
    } else {
      const inventoryList = createElement('div', { class: 'character-modal-list' });
      inventory.forEach(item => {
        const row = createElement('div', { class: 'character-modal-row' });
        row.appendChild(createElement('span', { textContent: formatItemName(item) }));
        row.appendChild(createElement('strong', {
          textContent: `x${Math.max(1, toNumber(item?.quantity ?? item?.quantidade, 1))}`,
        }));
        inventoryList.appendChild(row);
      });
      inventorySection.appendChild(inventoryList);
    }
    modal.appendChild(inventorySection);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    this.overlay = overlay;
    this.removeOverlayClick = on(overlay, 'click', event => {
      if (event.target === overlay) {
        this.close();
      }
    });
    this.removeCloseClick = on(closeBtn, 'click', () => this.close());
    document.addEventListener('keydown', this.handleKeydown);

    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      $('.character-modal-close', overlay)?.focus();
    });
  }

  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  close() {
    if (!this.overlay) return;

    this.removeOverlayClick?.();
    this.removeCloseClick?.();
    document.removeEventListener('keydown', this.handleKeydown);
    this.overlay.remove();
    this.overlay = null;
    this.removeOverlayClick = null;
    this.removeCloseClick = null;
  }
}
