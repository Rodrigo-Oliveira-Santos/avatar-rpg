/**
 * Skill Tree Renderer
 * Manages display and interaction of skill trees
 */

import { createElement, on } from '../utils/dom.js';
import { CATEGORIES } from '../utils/constants.js';
import { toast } from '../utils/toast.js';
import { canActivateSubSkill, getAvailableSlots } from '../character/slots.js';
import { createSkillCard } from './SkillCard.js';
import { loadSkills } from './data.js';

function getSubSkillCost(subSkill) {
  const cost = Number(subSkill?.cost);
  return Number.isFinite(cost) && cost > 0 ? cost : 1;
}

/**
 * Create category tabs
 * @param {string} activeCategory - Currently active category
 * @param {Function} onCategoryChange - Callback
 * @returns {HTMLElement} Tabs container
 */
function createCategoryTabs(activeCategory, onCategoryChange) {
  const container = createElement('div', { class: 'cat-tabs' });

  Object.keys(CATEGORIES).forEach(cat => {
    const btn = createElement('button', {
      class: `ctab ${cat} ${cat === activeCategory ? 'on' : ''}`,
      textContent: CATEGORIES[cat],
    });

    on(btn, 'click', () => onCategoryChange(cat));
    container.appendChild(btn);
  });

  return container;
}

/**
 * Create category description box
 * @param {string} category - Category key
 * @returns {HTMLElement} Description element
 */
function createCategoryDescription(category) {
  const descriptions = {
    spirit: 'Habilidades de conexão espiritual, meditação e manipulação de energia.',
    agility: 'Habilidades de movimento, esquiva e velocidade.',
    precise: 'Técnicas de precisão, controle fino e ataques cirúrgicos.',
    brute: 'Ataques poderosos, destruição em área e força bruta.',
  };

  return createElement('div', {
    class: 'cat-desc',
    textContent: descriptions[category] || '',
  });
}

function createSlotBar(slots) {
  const stateClass = slots.available <= 0 ? 'full' : slots.available < 2 ? 'warning' : 'available';
  const bar = createElement('div', { class: `slot-bar ${stateClass}` });
  const fill = createElement('div', { class: 'slot-bar-fill' });
  const text = createElement('div', {
    class: 'slot-bar-text',
    textContent: `🎯 Slots: ${slots.used}/${slots.total} usados (${slots.available} livres)`,
  });

  fill.style.width = `${slots.total > 0 ? (slots.used / slots.total) * 100 : 0}%`;

  bar.appendChild(fill);
  bar.appendChild(text);
  return bar;
}

function createTierLabel(tier, activeCount) {
  const label = createElement('div', { class: 'tier-lbl' });
  label.appendChild(createElement('span', { textContent: `Tier ${tier}` }));
  label.appendChild(createElement('span', {
    class: 'tier-meta',
    textContent: `Ativas nesta categoria: ${activeCount}`,
  }));
  return label;
}

/**
 * Group skills by tier
 * @param {array} skills - Skills array
 * @returns {object} Skills grouped by tier
 */
function groupByTier(skills) {
  return skills.reduce((groups, skill) => {
    const tier = skill.tier || 1;
    if (!groups[tier]) groups[tier] = [];
    groups[tier].push(skill);
    return groups;
  }, {});
}

/**
 * Check if character meets skill requirements
 * @param {object} skill - Skill data
 * @param {object} charData - Character data
 * @returns {{ met: boolean, reasons: string[] }}
 */
function checkRequirements(skill, charData) {
  const reasons = [];
  const atributos = charData.atributos || {};
  const nivel = charData.identidade?.nivel || 1;

  // Check attribute requirements
  if (skill.requirements) {
    Object.entries(skill.requirements).forEach(([attr, value]) => {
      if (value > 0 && (atributos[attr] || 0) < value) {
        reasons.push(`${attr} ${atributos[attr] || 0}/${value}`);
      }
    });
  }

  // Check minimum level
  if (skill.min_level && nivel < skill.min_level) {
    reasons.push(`Nível ${nivel}/${skill.min_level}`);
  }

  return { met: reasons.length === 0, reasons };
}

/**
 * Create skill grid for a tier
 * @param {array} skills - Skills in this tier
 * @param {array} allSkills - All skills in this element (for prereq lookup)
 * @param {object} characterSkills - Character's unlocked skills
 * @param {object} charData - Full character data (for requirement checks)
 * @param {Function} onSkillToggle - Toggle callback
 * @param {object} cardOptions - Extra card options
 * @returns {HTMLElement} Grid element
 */
function createTierGrid(skills, allSkills, characterSkills, charData, onSkillToggle, cardOptions = {}) {
  const grid = createElement('div', { class: 'skills-grid' });

  skills.forEach(skill => {
    // Check prerequisites: match by name → find corresponding id
    const prereqsMet = !skill.prerequisites || skill.prerequisites.length === 0 || skill.prerequisites.every(
      prereqName => {
        const prereqSkill = allSkills.find(s => s.name === prereqName);
        const prereqId = prereqSkill ? prereqSkill.id : prereqName;
        return characterSkills[prereqId]?.active;
      }
    );

    // Check attribute/level requirements
    const { met: reqsMet } = checkRequirements(skill, charData);

    const isUnlocked = prereqsMet && reqsMet;
    const skillState = characterSkills[skill.id] || {};
    const isActive = skillState.active || false;

    const card = createSkillCard(skill, isUnlocked, isActive, onSkillToggle, {
      ...cardOptions,
      scrollSlots: charData.scrolls?.[skill.id] || 0,
      mastered: Boolean(skillState.mastered),
    });
    grid.appendChild(card);
  });

  return grid;
}

/**
 * SkillTree Class
 */
export class SkillTree {
  /**
   * @param {string} element - Element name (fire, water, etc.)
   * @param {object} character - Character instance
   * @param {HTMLElement} container - DOM container
   */
  constructor(element, character, container) {
    this.element = element;
    this.character = character;
    this.container = container;
    this.skills = [];
    this.activeCategory = 'spirit';
    this.searchQuery = '';
    this.loading = true;

    this.loadSkills();
  }

  /**
   * Load skills for this element
   */
  async loadSkills() {
    this.loading = true;
    this.container.innerHTML = '<p style="color: var(--text2); padding: 20px;">A carregar habilidades...</p>';

    try {
      const data = await loadSkills(this.element);
      this.skills = data.skills || [];
      this.loading = false;
      this.render();
    } catch (err) {
      this.container.innerHTML = `<p style="color: var(--red);">Falha ao carregar habilidades: ${err.message}</p>`;
    }
  }

  /**
   * Render the skill tree
   */
  render() {
    this.container.innerHTML = '';

    // Search bar
    const searchInput = createElement('input', {
      class: 'field-input',
      placeholder: 'Pesquisar habilidades...',
      value: this.searchQuery,
    });
    searchInput.style.marginBottom = '10px';
    searchInput.style.fontSize = '12px';
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.render();
    });
    this.container.appendChild(searchInput);

    // Get character's skill state
    const charData = this.character.getData();
    const characterSkills = charData.habilidades || {};
    const slots = getAvailableSlots(charData, this.skills);
    this.container.appendChild(createSlotBar(slots));

    // Category tabs
    const tabs = createCategoryTabs(this.activeCategory, (cat) => {
      this.activeCategory = cat;
      this.render();
    });
    this.container.appendChild(tabs);

    // Description
    this.container.appendChild(createCategoryDescription(this.activeCategory));

    // Filter skills by category and search
    let categorySkills = this.skills.filter(s => s.category === this.activeCategory);

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      categorySkills = categorySkills.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }

    if (categorySkills.length === 0) {
      this.container.appendChild(createElement('p', {
        class: 'cat-desc',
        textContent: 'Nenhuma habilidade nesta categoria.',
      }));
      return;
    }

    // Group by tier
    const byTier = groupByTier(categorySkills);
    const activeCategoryCount = categorySkills.filter(skill => characterSkills[skill.id]?.active).length;
    const cardOptions = {
      characterData: charData,
      onSubSkillToggle: (skill, subSkill, shouldActivate) => {
        this.toggleSubSkill(skill, subSkill, shouldActivate);
      },
      slotsAvailable: slots,
    };

    // Render each tier
    [1, 2, 3, 4].forEach(tier => {
      if (byTier[tier] && byTier[tier].length > 0) {
        this.container.appendChild(createTierLabel(tier, activeCategoryCount));

        const grid = createTierGrid(byTier[tier], this.skills, characterSkills, charData, (skill) => {
          this.toggleSkill(skill);
        }, cardOptions);
        this.container.appendChild(grid);
      }
    });
  }

  /**
   * Toggle skill activation
   * @param {object} skill - Skill data
   */
  toggleSkill(skill) {
    const charData = this.character.getData();
    const current = charData.habilidades?.[skill.id]?.active || false;

    // Only validate when activating
    if (!current) {
      // Check slot availability
      const slots = getAvailableSlots(charData, this.skills);
      if (slots.available <= 0) {
        toast('Sem slots de sub-habilidade disponíveis!', 'warning');
        return;
      }

      // Check attribute/level requirements
      const { met, reasons } = checkRequirements(skill, charData);
      if (!met) {
        toast(`Requisitos não cumpridos: ${reasons.join(', ')}`, 'error');
        return;
      }
    }

    this.character.toggleSkill(skill.id, !current);
    this.render();
  }

  /**
   * Toggle sub-skill activation
   * @param {object} skill - Parent skill data
   * @param {object} subSkill - Sub-skill data
   * @param {boolean} shouldActivate - Target activation state
   */
  toggleSubSkill(skill, subSkill, shouldActivate) {
    const charData = this.character.serialize();
    charData.habilidades ||= {};
    charData.habilidades[skill.id] ||= { active: false, activeSubSkills: [] };

    if (!charData.habilidades[skill.id].active) {
      return;
    }

    const activeSubSkills = Array.isArray(charData.habilidades[skill.id].activeSubSkills)
      ? [...charData.habilidades[skill.id].activeSubSkills]
      : [];
    const isActive = activeSubSkills.includes(subSkill.id);
    const nextState = typeof shouldActivate === 'boolean' ? shouldActivate : !isActive;

    if (nextState === isActive) {
      return;
    }

    if (nextState) {
      if (!canActivateSubSkill(charData, skill.id)) {
        toast('Limite de sub-habilidades desta habilidade atingido.', 'warning');
        return;
      }

      const cost = getSubSkillCost(subSkill);
      const slots = getAvailableSlots(charData, this.skills);
      if (slots.available < cost) {
        toast(`Slots insuficientes para ativar ${subSkill.name}.`, 'warning');
        return;
      }

      activeSubSkills.push(subSkill.id);
    } else {
      const nextSubSkills = activeSubSkills.filter(subSkillId => subSkillId !== subSkill.id);
      charData.habilidades[skill.id].activeSubSkills = nextSubSkills;
      this.character.load(charData);
      this.render();
      return;
    }

    charData.habilidades[skill.id].activeSubSkills = activeSubSkills;
    this.character.load(charData);
    this.render();
  }

  /**
   * Refresh the tree (after character data changes)
   */
  refresh() {
    if (!this.loading) {
      this.render();
    }
  }
}
