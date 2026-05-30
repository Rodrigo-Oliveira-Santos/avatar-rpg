/**
 * Skill Tree Renderer
 * Manages display and interaction of skill trees
 */

import { createElement, on } from '../utils/dom.js';
import { CATEGORIES } from '../utils/constants.js';
import { createSkillCard } from './SkillCard.js';
import { loadSkills } from './data.js';

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
 * @returns {HTMLElement} Grid element
 */
function createTierGrid(skills, allSkills, characterSkills, charData, onSkillToggle) {
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
    const isActive = characterSkills[skill.id]?.active || false;

    const card = createSkillCard(skill, isUnlocked, isActive, onSkillToggle);
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

    // Get character's skill state
    const charData = this.character.getData();
    const characterSkills = charData.habilidades || {};

    // Render each tier
    [1, 2, 3, 4].forEach(tier => {
      if (byTier[tier] && byTier[tier].length > 0) {
        const tierLabel = createElement('div', {
          class: 'tier-lbl',
          textContent: `Tier ${tier}`,
        });
        this.container.appendChild(tierLabel);

        const grid = createTierGrid(byTier[tier], this.skills, characterSkills, charData, (skill) => {
          this.toggleSkill(skill);
        });
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
      const slots = this.character.getSlots();
      if (slots.available <= 0) {
        alert('Sem slots de sub-habilidade disponíveis!');
        return;
      }

      // Check attribute/level requirements
      const { met, reasons } = checkRequirements(skill, charData);
      if (!met) {
        alert(`Requisitos não cumpridos:\n${reasons.join('\n')}`);
        return;
      }
    }

    this.character.toggleSkill(skill.id, !current);
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
