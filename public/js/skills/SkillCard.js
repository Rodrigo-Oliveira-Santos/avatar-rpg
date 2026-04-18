/**
 * Skill Card Component
 * Renders individual skill cards
 */

import { createElement, $$, on } from '../utils/dom.js';
import { TIERS, POSITIONS, ATTRIBUTES, STATUS_EFFECTS } from '../utils/constants.js';

/**
 * Create tier badge element
 * @param {number} tier - Skill tier
 * @returns {HTMLElement} Badge element
 */
function createTierBadge(tier) {
  const badge = createElement('span', { class: 'sbadge' });
  const tierClass = tier === 4 ? 'sb-leg' : `sb-t${tier}`;
  badge.classList.add(tierClass);
  badge.textContent = TIERS[tier] || `Tier ${tier}`;
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

/**
 * Create skill card element
 * @param {object} skill - Skill data
 * @param {boolean} unlocked - Is skill unlocked
 * @param {boolean} active - Is skill active
 * @param {Function} onToggle - Toggle callback
 * @returns {HTMLElement} Skill card element
 */
export function createSkillCard(skill, unlocked = false, active = false, onToggle = null) {
  const card = createElement('div', {
    class: `sc ${skill.category} ${skill.tier === 4 ? 'legend' : ''} ${active ? 'on' : ''} ${!unlocked ? 'locked' : ''}`,
  });

  // Dot indicator
  if (active) {
    card.appendChild(createElement('div', { class: 'sdot' }));
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

  // Meta (tier + position)
  const meta = createElement('div', { class: 'smeta' });
  meta.appendChild(createTierBadge(skill.tier));
  meta.appendChild(createPositionBadge(skill.position));
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
      textContent: `Requires: ${skill.prerequisites.join(', ')}`,
    }));
  }

  // Effects section
  if (skill.passive_effect) {
    const effSection = createElement('div', { class: 'eff-section' });
    effSection.appendChild(createElement('div', {
      class: 'sec-lbl',
      textContent: 'Effect',
    }));

    if (skill.passive_effect.description) {
      effSection.appendChild(createElement('div', {
        class: 'ad',
        textContent: skill.passive_effect.description,
      }));
    }

    if (skill.passive_effect.chi_cost) {
      effSection.appendChild(createElement('div', {
        class: 'atk-chips',
        children: [createElement('span', {
          class: 'achip ac-chi',
          textContent: `Chi: ${skill.passive_effect.chi_cost}`,
        })],
      }));
    }

    card.appendChild(effSection);
  }

  // Attacks section
  if (skill.attacks && skill.attacks.length > 0) {
    const atkSection = createElement('div', { class: 'atk-section' });
    atkSection.appendChild(createElement('div', {
      class: 'sec-lbl',
      textContent: 'Attacks',
    }));

    skill.attacks.forEach(attack => {
      atkSection.appendChild(createAttackRow(attack));

      if (attack.status && attack.status.length > 0) {
        atkSection.appendChild(createStatusBadges(attack.status));
      }
    });

    card.appendChild(atkSection);
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
