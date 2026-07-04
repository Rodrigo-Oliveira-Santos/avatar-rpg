/**
 * Status Effects System
 */

import { STATUS_EFFECTS } from '../utils/constants.js';

/**
 * Get status effect info
 * @param {string} key - Status key (burn, freeze, etc.)
 * @returns {object} Status info
 */
export function getStatusEffect(key) {
  return STATUS_EFFECTS[key] || null;
}

/**
 * Create a status effect instance
 * @param {string} key - Status key
 * @param {number} duration - Duration in turns
 * @param {number} value - Optional value (e.g., shield amount)
 * @returns {object} Status instance
 */
export function createStatus(key, duration = 1, value = null) {
  const effect = getStatusEffect(key);
  if (!effect) {
    throw new Error(`Unknown status effect: ${key}`);
  }

  return {
    key,
    label: effect.label,
    desc: effect.desc,
    duration,
    maxDuration: duration,
    value,
  };
}

/**
 * Apply status to target
 * @param {array} targetStatuses - Target's status array
 * @param {string} key - Status key
 * @param {number} duration - Duration
 * @param {number} value - Optional value
 * @returns {boolean} Applied successfully
 */
export function applyStatus(targetStatuses, key, duration = 1, value = null) {
  const existing = targetStatuses.find(s => s.key === key);

  if (existing) {
    // Refresh duration
    existing.duration = Math.max(existing.duration, duration);
    if (value !== null) {
      existing.value = value;
    }
    return true;
  }

  // Check for counter statuses
  const counters = {
    burn: 'freeze',
    freeze: 'burn',
  };

  const counter = counters[key];
  if (counter) {
    const counterIdx = targetStatuses.findIndex(s => s.key === counter);
    if (counterIdx !== -1) {
      // Remove counter status instead
      targetStatuses.splice(counterIdx, 1);
      console.log(`[Status] ${key} removed ${counter}`);
      return true;
    }
  }

  targetStatuses.push(createStatus(key, duration, value));
  return true;
}

/**
 * Remove status from target
 * @param {array} targetStatuses - Target's status array
 * @param {string} key - Status key
 * @returns {boolean} Removed successfully
 */
export function removeStatus(targetStatuses, key) {
  const idx = targetStatuses.findIndex(s => s.key === key);
  if (idx !== -1) {
    targetStatuses.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Tick down status durations
 * @param {array} targetStatuses - Target's status array
 * @returns {array} Expired statuses
 */
export function tickStatuses(targetStatuses) {
  const expired = [];

  for (let i = targetStatuses.length - 1; i >= 0; i--) {
    const status = targetStatuses[i];
    status.duration--;

    if (status.duration <= 0) {
      expired.push(status);
      targetStatuses.splice(i, 1);
    }
  }

  return expired;
}

/**
 * Get all active status labels
 * @param {array} statuses - Status array
 * @returns {string[]} Labels
 */
export function getStatusLabels(statuses) {
  return statuses.map(s => s.label);
}
