/**
 * Skill Card Component
 * Renders individual skill cards
 */

import { createElement, on } from '../utils/dom.js';
import { GAME, TIERS, POSITIONS, STATUS_EFFECTS } from '../utils/constants.js';

function getSubSkillCost(subSkill) {
  const cost = Number(subSkill?.cost);
  return Number.isFinite(cost) && cost > 0 ? cost : 1;
}

function normalizeCardOptions(options = {}) {
  if (typeof options === 'boolean') {
    return {
      slotsAvailable: {
        available: options ? Number.POSITIVE_INFINITY : 0,
      },
    };
  }

  return options || {};
}

/**
 * Create tier badge element
 * @param {number} tier - Skill tier
 * @returns {HTMLElement} Badge element
 */
function createTierBadge(tier) {
  const badge = createElement('span', { class: 'sbadge' });
  const tierClass = tier >= 5 ? 'sb-leg' : `sb-t${tier}`;
  badge.classList.add(tierClass);
  badge.textContent = TIERS[tier] || `Tier ${tier}`;
  return badge;
}

/**
 * Mastery badge — shows the M0..M3 progression for an unlocked skill.
 * @param {number} level - 0..3
 * @param {number} uses
 * @param {number} nextThreshold - uses required for the next level (null if maxed)
 */
function createMasteryBadge(level, uses, nextThreshold) {
  const badge = createElement('span', { class: `sbadge sb-mastery sb-m${level}` });
  badge.textContent = nextThreshold
    ? `M${level} · ${uses}/${nextThreshold}`
    : `M${level} (máx.)`;
  badge.title = `Maestria atual: ${level}. Total de usos: ${uses}.`;
  return badge;
}

/**
 * Create position badge
 * @param {string} position - Position (off, def, pass, any)
 * @returns {HTMLElement} Badge element
 */
function createPositionBadge(position) {
  const badge = createElement('span', { class: 'pos-badge' });
  badge.classList.add(`pos-${position}`);
  badge.textContent = POSITIONS[position] || position;
  return badge;
}

/**
 * Create requirement chips
 * @param {object} requirements - Attribute requirements
 * @returns {HTMLElement} Container with chips
 */
function createRequirementChips(requirements) {
  const container = createElement('div', { class: 'req-attr' });

  Object.entries(requirements || {}).forEach(([attr, value]) => {
    if (value > 0) {
      const chip = createElement('span', {
        class: `chip c${attr}`,
        textContent: `${attr}: ${value}`,
      });
      container.appendChild(chip);
    }
  });

  return container;
}

/**
 * Create status badges
 * @param {string[]} statuses - Status effect keys
 * @returns {HTMLElement} Container with badges
 */
function createStatusBadges(statuses) {
  const container = createElement('div', { class: 'atk-chips' });

  statuses.forEach(status => {
    const effect = STATUS_EFFECTS[status];
    if (effect) {
      const badge = createElement('span', {
        class: `st s-${status}`,
        textContent: effect.label,
        title: effect.desc,
      });
      container.appendChild(badge);
    }
  });

  return container;
}

/**
 * Create attack row
 * @param {object} attack - Attack definition
 * @returns {HTMLElement} Attack row element
 */
function createAttackRow(attack) {
  const row = createElement('div', { class: 'atk-row' });

  const name = createElement('span', { class: 'an', textContent: attack.name });
  row.appendChild(name);

  if (attack.damage) {
    const dmg = createElement('span', {
      class: 'achip ac-dmg',
      textContent: attack.damage,
    });
    row.appendChild(dmg);
  }

  if (attack.chi_cost) {
    const chi = createElement('span', {
      class: 'achip ac-chi',
      textContent: `Chi: ${attack.chi_cost}`,
    });
    row.appendChild(chi);
  }

  return row;
}

function createSubSkillsSection(skill, characterData, onSubSkillToggle, slotsAvailable) {
  const section = createElement('div', { class: 'sub-skills-section' });
  const skillState = characterData?.habilidades?.[skill.id] || {};
  const activeSubSkills = Array.isArray(skillState.activeSubSkills)
    ? skillState.activeSubSkills
    : [];
  const scrollBonus = characterData?.scrolls?.[skill.id] || 0;
  const maxPerSkill = GAME.MAX_SUB_SKILLS_PER_SKILL + scrollBonus;
  const remainingGlobalSlots = Number.isFinite(slotsAvailable?.available)
    ? slotsAvailable.available
    : Number.POSITIVE_INFINITY;

  const header = createElement('div', { class: 'sub-skills-header' });
  header.appendChild(createElement('div', {
    class: 'sec-lbl',
    textContent: 'Sub-habilidades',
  }));
  header.appendChild(createElement('span', {
    class: 'sub-skill-counter',
    textContent: `${activeSubSkills.length}/${maxPerSkill}`,
  }));
  section.appendChild(header);

  skill.sub_skills.forEach(subSkill => {
    const isChecked = activeSubSkills.includes(subSkill.id);
    const cost = getSubSkillCost(subSkill);
    const perSkillLimitReached = !isChecked && activeSubSkills.length >= maxPerSkill;
    const globalLimitReached = !isChecked && remainingGlobalSlots < cost;
    const disabled = !isChecked && (!onSubSkillToggle || perSkillLimitReached || globalLimitReached);
    const row = createElement('label', {
      class: `sub-skill-row ${disabled ? 'disabled' : ''}`,
      title: subSkill.description || '',
    });

    const checkbox = createElement('input', {
      type: 'checkbox',
      checked: isChecked,
      disabled,
    });

    const content = createElement('div', { class: 'sub-skill-content' });
    const top = createElement('div', { class: 'sub-skill-top' });
    top.appendChild(createElement('span', {
      class: 'sub-skill-name',
      textContent: subSkill.name,
    }));
    top.appendChild(createElement('span', {
      class: 'sub-skill-cost',
      textContent: `${cost} ${cost === 1 ? 'slot' : 'slots'}`,
    }));
    content.appendChild(top);

    if (subSkill.description) {
      content.appendChild(createElement('div', {
        class: 'sub-skill-desc',
        textContent: subSkill.description,
      }));
    }

    row.appendChild(checkbox);
    row.appendChild(content);
    section.appendChild(row);

    on(row, 'click', (event) => {
      event.stopPropagation();
    });

    on(checkbox, 'click', (event) => {
      event.stopPropagation();
    });

    if (onSubSkillToggle) {
      on(checkbox, 'change', (event) => {
        event.stopPropagation();
        onSubSkillToggle(skill, subSkill, event.target.checked);
      });
    }
  });

  return section;
}

/**
 * Create skill card element
 * @param {object} skill - Skill data
 * @param {boolean} unlocked - Is skill unlocked
 * @param {boolean} active - Is skill active
 * @param {Function} onToggle - Toggle callback
 * @param {object} options - Rendering options
 * @returns {HTMLElement} Skill card element
 */
export function createSkillCard(skill, unlocked = false, active = false, onToggle = null, options = {}) {
  const {
    characterData = null,
    onSubSkillToggle = null,
    slotsAvailable = null,
    scrollSlots = 0,
    mastered = false,
  } = normalizeCardOptions(options);

  const hasGlobalSlots = (slotsAvailable?.available ?? Number.POSITIVE_INFINITY) > 0;
  const showSlotsFull = !hasGlobalSlots && !active;
  const isLegendary = skill.tier >= 5 || skill.is_legendary === true;
  const card = createElement('div', {
    class: `sc ${skill.category} ${isLegendary ? 'legend' : ''} ${active ? 'on' : ''} ${!unlocked ? 'locked' : ''} ${showSlotsFull ? 'slots-full' : ''}`,
  });

  // Status indicator
  if (active) {
    card.appendChild(createElement('div', { class: 'sdot' }));
  } else if (showSlotsFull) {
    card.appendChild(createElement('div', {
      class: 'slot-lock',
      textContent: '🔒',
      title: 'Slots cheios',
    }));
  }

  // Name
  card.appendChild(createElement('div', {
    class: 'sname',
    textContent: skill.name,
  }));

  // Description
  card.appendChild(createElement('div', {
    class: 'sdesc',
    textContent: skill.description,
  }));

  // Meta (tier + position + optional mastery)
  const meta = createElement('div', { class: 'smeta' });
  meta.appendChild(createTierBadge(skill.tier));
  meta.appendChild(createPositionBadge(skill.position));

  if (skill.tier_label && skill.tier_label !== TIERS[skill.tier]) {
    meta.appendChild(createElement('span', {
      class: 'sbadge sb-branch',
      textContent: skill.tier_label,
      title: 'Ramo · Tier',
    }));
  }

  if (unlocked && skill.mastery_levels && Array.isArray(skill.mastery_levels)) {
    const uses = Number(options.skillUses) || 0;
    const level = Math.min(3, options.masteryLevel ?? 0);
    const nextThreshold = level < 3 ? [15, 50, 150][level] : null;
    meta.appendChild(createMasteryBadge(level, uses, nextThreshold));
  }
  if (scrollSlots > 0) {
    meta.appendChild(createElement('span', {
      class: 'sbadge sb-scroll',
      textContent: `📜 +${scrollSlots} slot${scrollSlots === 1 ? '' : 's'}`,
    }));
  }
  if (mastered) {
    meta.appendChild(createElement('span', {
      class: 'sbadge sb-mastery',
      textContent: '⭐ Dominada',
    }));
  }
  card.appendChild(meta);

  // Requirements
  if (skill.requirements) {
    const hasReqs = Object.values(skill.requirements).some(v => v > 0);
    if (hasReqs) {
      card.appendChild(createRequirementChips(skill.requirements));
    }
  }

  // Prerequisites text
  if (skill.prerequisites && skill.prerequisites.length > 0) {
    card.appendChild(createElement('div', {
      class: 'req-line',
      textContent: `Requer: ${skill.prerequisites.join(', ')}`,
    }));
  }

  // Effects section
  if (skill.passive_effect) {
    const effSection = createElement('div', { class: 'eff-section' });
    effSection.appendChild(createElement('div', {
      class: 'sec-lbl',
      textContent: 'Efeito',
    }));

    if (skill.passive_effect.description) {
      effSection.appendChild(createElement('div', {
        class: 'ad',
        textContent: skill.passive_effect.description,
      }));
    }

    if (skill.passive_effect.chi_cost) {
      const chiChips = createElement('div', { class: 'atk-chips' });
      chiChips.appendChild(createElement('span', {
        class: 'achip ac-chi',
        textContent: `Chi: ${skill.passive_effect.chi_cost}`,
      }));
      effSection.appendChild(chiChips);
    }

    card.appendChild(effSection);
  }

  // Attacks section
  if (skill.attacks && skill.attacks.length > 0) {
    const atkSection = createElement('div', { class: 'atk-section' });
    atkSection.appendChild(createElement('div', {
      class: 'sec-lbl',
      textContent: 'Ataques',
    }));

    skill.attacks.forEach(attack => {
      atkSection.appendChild(createAttackRow(attack));

      if (attack.status && attack.status.length > 0) {
        atkSection.appendChild(createStatusBadges(attack.status));
      }
    });

    card.appendChild(atkSection);
  }

  if (active && Array.isArray(skill.sub_skills) && skill.sub_skills.length > 0 && characterData) {
    card.appendChild(createSubSkillsSection(skill, characterData, onSubSkillToggle, slotsAvailable));
  }

  // Click handler
  if (onToggle && unlocked) {
    card.style.cursor = 'pointer';
    on(card, 'click', () => onToggle(skill));
  } else if (!unlocked) {
    card.style.cursor = 'not-allowed';
  }

  return card;
}
