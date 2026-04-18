/**
 * Skill Tree Renderer
 * Manages display and interaction of skill trees
 */

import { createElement, $$, on, setClasses, removeClasses } from '../utils/dom.js';
import { CATEGORIES, ELEMENTS } from '../utils/constants.js';
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
 * Create skill grid for a tier
 * @param {array} skills - Skills in this tier
 * @param {object} characterSkills - Character's unlocked skills
 * @param {Function} onSkillToggle - Toggle callback
 * @returns {HTMLElement} Grid element
 */
function createTierGrid(skills, characterSkills, onSkillToggle) {
  const grid = createElement('div', { class: 'skills-grid' });

  skills.forEach(skill => {
    const isUnlocked = !skill.prerequisites || skill.prerequisites.every(
      prereq => characterSkills[prereq]?.active
    );

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
    this.loading = true;

    this.loadSkills();
  }

  /**
   * Load skills for this element
   */
  async loadSkills() {
    this.loading = true;
    this.container.innerHTML = '<p style="color: var(--text2); padding: 20px;">Loading skills...</p>';

    try {
      const data = await loadSkills(this.element);
      this.skills = data.skills || [];
      this.loading = false;
      this.render();
    } catch (err) {
      this.container.innerHTML = `<p style="color: var(--red);">Failed to load skills: ${err.message}</p>`;
    }
  }

  /**
   * Render the skill tree
   */
  render() {
    this.container.innerHTML = '';

    // Category tabs
    const tabs = createCategoryTabs(this.activeCategory, (cat) => {
      this.activeCategory = cat;
      this.render();
    });
    this.container.appendChild(tabs);

    // Description
    this.container.appendChild(createCategoryDescription(this.activeCategory));

    // Filter skills by category
    const categorySkills = this.skills.filter(s => s.category === this.activeCategory);

    if (categorySkills.length === 0) {
      this.container.appendChild(createElement('p', {
        class: 'cat-desc',
        textContent: 'No skills in this category yet.',
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

        const grid = createTierGrid(byTier[tier], characterSkills, (skill) => {
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

    // Check slot availability for activation
    if (!current) {
      const slots = this.character.getSlots();
      if (slots.available <= 0) {
        alert('No available sub-skill slots!');
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
