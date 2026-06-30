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
import { askCombatPath, askNonBenderPath } from './PathPicker.js';
import { mountCanvasTree } from './CanvasTreeView.js';
import { createSkillPanel, describeSkillState } from './SkillPanel.js';

/**
 * Maintain a window-level registry so non-skill code (scrolls, hub
 * tooltips, etc.) can resolve a skill by id without re-fetching JSON.
 */
function registerSkillDefinitions(skills) {
  if (typeof window === 'undefined') return;
  if (!(window.__SKILL_DEFINITIONS__ instanceof Map)) {
    window.__SKILL_DEFINITIONS__ = new Map();
  }
  skills.forEach((s) => {
    if (s?.id) window.__SKILL_DEFINITIONS__.set(s.id, s);
  });
}

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
    combat: 'Técnicas base partilhadas — disponíveis antes de escolher Preciso ou Bruto.',
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

  // Attribute requirements (canonical key is `attribute_requirements`;
  // fall back to legacy `requirements` for older imported data).
  const attrReqs = skill.attribute_requirements || skill.requirements || {};
  Object.entries(attrReqs).forEach(([attr, value]) => {
    if (value > 0 && (atributos[attr] || 0) < value) {
      reasons.push(`${attr} ${atributos[attr] || 0}/${value}`);
    }
  });

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
    // Check prerequisites: JSON canonical uses skill IDs; legacy imports
    // may reference skills by name. Try id-first, fall back to name lookup.
    const prereqsMet = !skill.prerequisites || skill.prerequisites.length === 0 || skill.prerequisites.every(
      (ref) => {
        if (characterSkills[ref]?.active) return true;
        const byName = allSkills.find((s) => s.name === ref);
        return byName ? !!characterSkills[byName.id]?.active : false;
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
      skillUses: charData.skill_uses?.[skill.id] || 0,
      masteryLevel: typeof cardOptions.getMasteryLevel === 'function'
        ? cardOptions.getMasteryLevel(skill.id)
        : 0,
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
    this.viewMode = 'tree';   // 'tree' (canvas) | 'cards'
    this._canvas = null;
    this._panel = null;
    // For element='none': which path is currently being *previewed*. If
    // the character has committed a path, that's the source of truth and
    // overrides this field. Otherwise it lets the player toggle between
    // the two trees without committing.
    this._previewPath = (this.element === 'none')
      ? (character?.getData?.()?.non_bender_path || 'chiblocker')
      : null;
    // Whether we've already prompted this session — prevents the picker
    // from popping up on every tab-switch back to Sem Dobra.
    this._pickerPrompted = false;

    this.loadSkills();
  }

  /**
   * Currently effective non-bender path: the committed one if any, else
   * the preview path. Returns null for non-`none` elements.
   */
  getEffectiveNonBenderPath() {
    if (this.element !== 'none') return null;
    const committed = this.character?.getData?.()?.non_bender_path || null;
    return committed || this._previewPath || 'chiblocker';
  }

  /** Whether the character has committed a non-bender path. */
  hasCommittedPath() {
    if (this.element !== 'none') return true;
    return !!this.character?.getData?.()?.non_bender_path;
  }

  /**
   * Called by the host (App.switchTab / GM modal) right after this tree
   * becomes visible to the user. For Sem Dobra trees with no committed
   * path, prompts the dismissable path picker once per session. Bender
   * trees are no-ops.
   */
  async notifyShown() {
    if (this.element !== 'none') return;
    if (this.hasCommittedPath()) return;
    if (this._pickerPrompted) return;
    this._pickerPrompted = true;
    await this._openPathPicker({ cancellable: true });
  }

  async _openPathPicker({ cancellable } = {}) {
    const subtitle = cancellable
      ? 'Podes pré-visualizar ambos os caminhos antes de decidir — usa "Esconder" para fechar este aviso e alternar entre as duas árvores via separadores no topo.'
      : undefined;
    const picked = await askNonBenderPath({
      cancellable: !!cancellable,
      currentPreview: this._previewPath,
      subtitle,
    });
    if (picked) {
      this.character.setNonBenderPath(picked);
      this._previewPath = picked;
      await this.loadSkills();
    }
  }

  /**
   * Load skills for this element (with non-bender path support).
   */
  async loadSkills() {
    this.loading = true;
    this.container.innerHTML = '<p style="color: var(--text2); padding: 20px;">A carregar habilidades...</p>';

    try {
      // nonBenderPath only matters for the 'none' element; passing it for
      // bender elements would request a non-existent fire-chiblocker.json
      // etc. and return zero skills.
      const nonBenderPath = this.element === 'none' ? this.getEffectiveNonBenderPath() : null;
      const data = await loadSkills(this.element, { nonBenderPath });
      this.skills = data.skills || [];
      registerSkillDefinitions(this.skills);
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
    if (this._canvas) {
      this._canvas.destroy();
      this._canvas = null;
    }
    if (this._panel) {
      this._panel.destroy();
      this._panel = null;
    }
    this.container.innerHTML = '';

    // Sem Dobra: path tab strip + preview banner (if not committed).
    if (this.element === 'none') {
      this.container.appendChild(this._renderNonBenderHeader());
    }

    // View toggle (Tree | Cards)
    const toggleWrap = createElement('div', { class: 'skill-view-toggle' });
    ['tree', 'cards'].forEach((mode) => {
      const btn = createElement('button', {
        type: 'button',
        textContent: mode === 'tree' ? '🌳 Árvore' : '🗂 Cartas',
      });
      if (this.viewMode === mode) btn.classList.add('on');
      btn.addEventListener('click', () => {
        this.viewMode = mode;
        this.render();
      });
      toggleWrap.appendChild(btn);
    });
    this.container.appendChild(toggleWrap);

    if (this.viewMode === 'tree') {
      this.renderCanvas();
      return;
    }
    this.renderCards();
  }

  /**
   * Build the Sem Dobra header: a tab strip to switch which path's tree
   * is shown, plus a preview banner when the player hasn't committed to
   * a path yet.
   */
  _renderNonBenderHeader() {
    const wrap = createElement('div', { class: 'non-bender-header' });
    const committed = this.character?.getData?.()?.non_bender_path || null;
    const effective = this.getEffectiveNonBenderPath();

    const tabs = createElement('div', { class: 'non-bender-path-tabs' });
    [
      { id: 'chiblocker', label: '🥋 Bloqueador de Chi' },
      { id: 'weapons',    label: '⚔ Utilizador de Armas' },
    ].forEach((p) => {
      const btn = createElement('button', {
        type: 'button',
        class: `non-bender-path-tab${effective === p.id ? ' on' : ''}`,
        textContent: p.label,
      });
      if (committed && committed !== p.id) {
        btn.disabled = true;
        btn.title = `Já escolheste ${committed === 'chiblocker' ? 'Bloqueador de Chi' : 'Utilizador de Armas'} — caminho fechado.`;
      } else {
        on(btn, 'click', () => {
          if (this._previewPath === p.id && effective === p.id) return;
          this._previewPath = p.id;
          this.loadSkills();
        });
      }
      tabs.appendChild(btn);
    });
    wrap.appendChild(tabs);

    if (!committed) {
      const banner = createElement('div', { class: 'non-bender-preview-banner' });
      banner.appendChild(createElement('span', {
        textContent: '👁 Modo pré-visualização — escolhe um caminho para desbloquear habilidades. ',
      }));
      const chooseBtn = createElement('button', {
        type: 'button',
        class: 'non-bender-choose-btn',
        textContent: 'Escolher caminho…',
      });
      on(chooseBtn, 'click', () => this._openPathPicker({ cancellable: true }));
      banner.appendChild(chooseBtn);
      wrap.appendChild(banner);
    }

    return wrap;
  }

  renderCanvas() {
    if (!this.skills.length) {
      this.container.appendChild(createElement('p', {
        class: 'cat-desc',
        textContent: 'Nenhuma habilidade disponível.',
      }));
      return;
    }

    // Legend (mirrors docs/skill-trees/*.html)
    const legend = createElement('div', { class: 'skill-tree-legend' });
    legend.innerHTML = `
      <div class="leg"><div class="lsq" style="background:#1e1a40;border:2px solid #7F77DD"></div>Espiritualidade</div>
      <div class="leg"><div class="lsq" style="background:#0a2e20;border:2px solid #1D9E75"></div>Agilidade</div>
      <div class="leg"><div class="lsq" style="background:#3a2006;border:2px solid #D88840"></div>Combate N1–N2</div>
      <div class="leg"><div class="lsq" style="background:#3a1606;border:2px solid #E8844A"></div>Preciso N3+</div>
      <div class="leg"><div class="lsq" style="background:#2e0804;border:2px solid #C03020"></div>Bruto N3+</div>
      <div class="leg"><div class="lsq" style="background:#2e1c02;border:2px solid #BA7517"></div>Lendário</div>
      <div class="hint">— sólida = mesma classe · - - - tracejada = outra classe · clica para abrir detalhes</div>
    `;
    this.container.appendChild(legend);

    const host = createElement('div');
    this.container.appendChild(host);

    // Side panel — mount inside the SkillTree container so it inherits
    // tab visibility (hidden when the user navigates away).
    this._panel = createSkillPanel({
      host: this.container,
      character: this.character,
      getAllSkills: () => this.skills,
      callbacks: {
        onUnlock: (skill) => this.requestUnlock(skill),
        onUse: (skill) => this.requestUse(skill),
        onUpgrade: (skill) => this.requestUpgrade(skill),
        onClose: () => { if (this._canvas) this._canvas.setSelected(null); },
      },
    });

    this._canvas = mountCanvasTree({
      container: host,
      skills: this.skills,
      character: this.character,
      canUnlock: (skill) => this.isUnlockable(skill),
      onNodeClick: (node) => {
        if (this._panel) this._panel.open(node.id);
      },
    });
  }

  renderCards() {
    // Preserve the view-toggle (added by render()) and wipe everything else
    // so successive renderCards() calls (tab clicks, search input) don't
    // stack search bars / tabs / grids on top of each other.
    Array.from(this.container.children).forEach((child) => {
      if (!child.classList.contains('skill-view-toggle')) child.remove();
    });

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
      this.renderCards();
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
      this.renderCards();
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
      getMasteryLevel: (skillId) =>
        typeof this.character?.getMasteryLevel === 'function'
          ? this.character.getMasteryLevel(skillId)
          : 0,
    };

    // Render each tier
    [1, 2, 3, 4, 5].forEach(tier => {
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
   * Visual gate used by the canvas to mark a node "unlockable". Combines
   * prerequisites, attribute requirements and combat-path conflicts.
   */
  isUnlockable(skill) {
    const charData = this.character.getData();
    const charSkills = charData.habilidades || {};
    if (charSkills[skill.id]?.active) return false;

    const depsOk = (skill.prerequisites || []).every((id) => !!charSkills[id]?.active);
    if (!depsOk) return false;

    const { met } = checkRequirements(skill, charData);
    if (!met) return false;

    if (skill.tier >= 3 && (skill.branch === 'pr' || skill.branch === 'br')) {
      const required = skill.branch === 'pr' ? 'precise' : 'brute';
      const charPath = charData.combat_path;
      if (charPath && charPath !== required) return false;
    }
    return true;
  }

  /**
   * If the player is on Sem Dobra without a committed path, prompt the
   * picker before allowing an unlock. Returns true if the unlock should
   * proceed, false otherwise.
   */
  async _ensureNonBenderPathCommitted() {
    if (this.element !== 'none') return true;
    if (this.hasCommittedPath()) return true;
    const previousPreview = this._previewPath;
    const chosen = await askNonBenderPath({
      cancellable: true,
      currentPreview: previousPreview,
      subtitle: 'Para desbloquear uma habilidade tens de comprometer-te com um caminho. A escolha é permanente.',
    });
    if (!chosen) return false;
    this.character.setNonBenderPath(chosen);
    this._previewPath = chosen;
    if (chosen !== previousPreview) {
      // User committed to a different tree than the one currently shown
      // — reload the new skill set and require a re-click on the target.
      await this.loadSkills();
      return false;
    }
    return true;
  }

  /**
   * Unlock a skill via the side panel. Handles combat-path locking
   * (with confirmation modal) and validates attributes/prerequisites.
   */
  async requestUnlock(skill) {
    if (!(await this._ensureNonBenderPathCommitted())) return;

    const charData = this.character.getData();
    if (charData.habilidades?.[skill.id]?.active) return;

    // Prerequisites
    const charSkills = charData.habilidades || {};
    const missingDeps = (skill.prerequisites || []).filter((id) => !charSkills[id]?.active);
    if (missingDeps.length) {
      toast('Faltam pré-requisitos desbloqueados.', 'error');
      return;
    }

    // Attribute / level requirements
    const { met, reasons } = checkRequirements(skill, charData);
    if (!met) {
      toast(`Requisitos não cumpridos: ${reasons.join(', ')}`, 'error');
      return;
    }

    // Combat-path gating (tier 3+ on pr/br)
    if (skill.tier >= 3 && (skill.branch === 'pr' || skill.branch === 'br')) {
      const required = skill.branch === 'pr' ? 'precise' : 'brute';
      const charPath = charData.combat_path;
      if (charPath && charPath !== required) {
        toast(
          `Esta habilidade pertence ao caminho ${required === 'precise' ? 'Preciso' : 'Bruto'}; já escolheste ${charPath === 'precise' ? 'Preciso' : 'Bruto'}.`,
          'error'
        );
        return;
      }
      if (!charPath) {
        const chosen = await askCombatPath();
        if (!chosen) return;
        this.character.setCombatPath(chosen);
        if (chosen !== required) {
          toast(`Escolheste ${chosen === 'precise' ? 'Preciso' : 'Bruto'}; esta habilidade é do outro ramo.`, 'warning');
          return;
        }
      }
    }

    // Slot availability (sub-skill slot model)
    const slots = getAvailableSlots(charData, this.skills);
    if (slots.available <= 0) {
      toast('Sem slots de sub-habilidade disponíveis!', 'warning');
      return;
    }

    this.character.toggleSkill(skill.id, true);
    toast(`✦ Desbloqueaste: ${skill.name}`, 'success');
  }

  /** Increment usage counter for an unlocked skill + apply chi cost/restore. */
  requestUse(skill) {
    const active = !!this.character.getData().habilidades?.[skill.id]?.active;
    if (!active) return;
    const result = this.character.useSkill(skill);
    toast(this._formatUseToast(skill, result), this._toastLevelForUse(result));
  }

  /** Same effect as a use, but with a distinct toast for mastery milestones. */
  requestUpgrade(skill) {
    const active = !!this.character.getData().habilidades?.[skill.id]?.active;
    if (!active) return;
    const result = this.character.useSkill(skill);
    if (result.mastery > result.masteryBefore) {
      toast(`⭐ Maestria M${result.mastery}: ${skill.name}`, 'success');
    } else {
      toast(this._formatUseToast(skill, result), this._toastLevelForUse(result));
    }
  }

  /**
   * Compose the use-toast text. Splits into multiple lines so each
   * piece of information (action / chi delta / mastery progress) is
   * legible — single-line was getting cramped at the top-right.
   */
  _formatUseToast(skill, result) {
    const lines = [`⚡ ${skill.name} usada`];
    const chiBits = [];
    if (result.chiCost > 0) chiBits.push(`−${result.chiCost} chi`);
    if (result.chiRestore > 0) chiBits.push(`+${result.chiRestore} chi`);
    if (chiBits.length) {
      const newChi = result.newChi != null ? ` → ${result.newChi}` : '';
      lines.push(`${chiBits.join(' · ')}${newChi}`);
    }
    lines.push(`${result.uses} usos · M${result.mastery}`);
    if (result.insufficientChi) lines.push('⚠ chi insuficiente');
    return lines.join('\n');
  }

  _toastLevelForUse(result) {
    return result.insufficientChi ? 'warning' : 'info';
  }

  /**
   * Toggle skill activation
   * @param {object} skill - Skill data
   */
  async toggleSkill(skill) {
    const charData = this.character.getData();
    const current = charData.habilidades?.[skill.id]?.active || false;

    // Only validate when activating
    if (!current) {
      // 0) Sem Dobra: prompt for path commitment if previewing
      if (!(await this._ensureNonBenderPathCommitted())) return;

      // 1) Combat-path gating: tier 3+ on pr/br requires combat_path.
      if (skill.tier >= 3 && (skill.branch === 'pr' || skill.branch === 'br')) {
        const required = skill.branch === 'pr' ? 'precise' : 'brute';
        const charPath = charData.combat_path;
        if (charPath && charPath !== required) {
          toast(`Esta habilidade pertence ao caminho ${required === 'precise' ? 'Preciso' : 'Bruto'}; já escolheste ${charPath === 'precise' ? 'Preciso' : 'Bruto'}.`, 'error');
          return;
        }
        if (!charPath) {
          const chosen = await askCombatPath();
          if (!chosen) return;
          this.character.setCombatPath(chosen);
          if (chosen !== required) {
            toast(`Escolheste ${chosen === 'precise' ? 'Preciso' : 'Bruto'}; esta habilidade é do outro ramo.`, 'warning');
            this.render();
            return;
          }
        }
      }

      // 2) Slot availability
      const slots = getAvailableSlots(charData, this.skills);
      if (slots.available <= 0) {
        toast('Sem slots de sub-habilidade disponíveis!', 'warning');
        return;
      }

      // 3) Attribute/level requirements
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
      // Store cost for accurate slot calculation without definitions
      charData.habilidades[skill.id].subSkillCosts ||= {};
      charData.habilidades[skill.id].subSkillCosts[subSkill.id] = cost;
    } else {
      const nextSubSkills = activeSubSkills.filter(subSkillId => subSkillId !== subSkill.id);
      charData.habilidades[skill.id].activeSubSkills = nextSubSkills;
      // Remove stored cost
      if (charData.habilidades[skill.id].subSkillCosts) {
        delete charData.habilidades[skill.id].subSkillCosts[subSkill.id];
      }
      this.character.load(charData);
      this.render();
      return;
    }

    charData.habilidades[skill.id].activeSubSkills = activeSubSkills;
    this.character.load(charData);
    this.render();
  }

  /**
   * Refresh the tree after character data changes.
   *
   * In **tree (canvas) mode** the heavy children — canvas + side panel —
   * both subscribe to `character.notify()` themselves and redraw on
   * their own. Calling `render()` here would destroy them (closing any
   * open side panel mid-action) so we deliberately no-op. Structural
   * changes that need the tree to rebuild (path commitment, JSON
   * reload) call `this.render()` explicitly.
   *
   * In **cards mode** the slot bar / active-count labels / individual
   * card chips are static at render time, so we do a full re-render.
   */
  refresh() {
    if (this.loading) return;
    if (this.viewMode === 'tree') {
      // Canvas + panel auto-update via their own character.subscribe().
      return;
    }
    this.render();
  }
}
