/**
 * JSON Schema Validators
 */

import { ATTRIBUTES, TIERS, CATEGORIES, STATUS_EFFECTS } from './constants.js';

/**
 * Validate skill schema
 * @param {object} skill - Skill object to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validateSkillSchema(skill) {
  const errors = [];

  // Required fields
  if (!skill.element) errors.push('Missing required field: element');
  if (!skill.category) errors.push('Missing required field: category');
  if (!skill.tier) errors.push('Missing required field: tier');
  if (!skill.name) errors.push('Missing required field: name');
  if (!skill.description) errors.push('Missing required field: description');

  // Validate element
  const validElements = ['fire', 'water', 'earth', 'air', 'none'];
  if (skill.element && !validElements.includes(skill.element)) {
    errors.push(`Invalid element: ${skill.element}. Must be one of: ${validElements.join(', ')}`);
  }

  // Validate category
  const validCategories = Object.keys(CATEGORIES);
  if (skill.category && !validCategories.includes(skill.category)) {
    errors.push(`Invalid category: ${skill.category}. Must be one of: ${validCategories.join(', ')}`);
  }

  // Validate tier
  const validTiers = Object.keys(TIERS).map(Number);
  if (skill.tier && !validTiers.includes(skill.tier)) {
    errors.push(`Invalid tier: ${skill.tier}. Must be one of: ${validTiers.join(', ')}`);
  }

  // Validate requirements
  if (skill.requirements) {
    const validAttrs = Object.keys(ATTRIBUTES);
    Object.keys(skill.requirements).forEach(attr => {
      if (!validAttrs.includes(attr)) {
        errors.push(`Invalid attribute in requirements: ${attr}`);
      }
      if (typeof skill.requirements[attr] !== 'number') {
        errors.push(`Requirement for ${attr} must be a number`);
      }
    });
  }

  // Validate attacks array
  if (skill.attacks && Array.isArray(skill.attacks)) {
    skill.attacks.forEach((atk, idx) => {
      if (!atk.name) errors.push(`Attack [${idx}] missing name`);
      if (!atk.damage && !atk.status) errors.push(`Attack [${idx}] must have damage or status`);
      if (atk.chi_cost !== undefined && typeof atk.chi_cost !== 'number') {
        errors.push(`Attack [${idx}] chi_cost must be a number`);
      }
    });
  }

  // Validate passive effect
  if (skill.passive_effect) {
    const validTypes = ['buff', 'debuff', 'restore', 'heal', 'move', 'utility'];
    if (!validTypes.includes(skill.passive_effect.type)) {
      errors.push(`Invalid passive_effect type: ${skill.passive_effect.type}`);
    }
  }

  // Validate status effects in attacks
  const validStatus = Object.keys(STATUS_EFFECTS);
  if (skill.attacks) {
    skill.attacks.forEach((atk, idx) => {
      if (atk.status && Array.isArray(atk.status)) {
        atk.status.forEach(status => {
          if (!validStatus.includes(status)) {
            errors.push(`Invalid status in attack [${idx}]: ${status}`);
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate character sheet schema
 * @param {object} character - Character object to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validateCharacterSchema(character) {
  const errors = [];

  if (!character.identidade) {
    errors.push('Missing required field: identidade');
    return { valid: false, errors };
  }

  const { identidade } = character.identidade;

  if (!identidade.nome) errors.push('Missing character name');
  if (!identidade.elemento) errors.push('Missing character element');

  if (identidade.nivel !== undefined) {
    if (typeof identidade.nivel !== 'number' || identidade.nivel < 1 || identidade.nivel > 40) {
      errors.push('Level must be between 1 and 40');
    }
  }

  if (identidade.atributos) {
    const validAttrs = Object.keys(ATTRIBUTES);
    Object.keys(identidade.atributos).forEach(attr => {
      if (!validAttrs.includes(attr)) {
        errors.push(`Invalid attribute: ${attr}`);
      }
      if (typeof identidade.atributos[attr] !== 'number') {
        errors.push(`Attribute ${attr} must be a number`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
