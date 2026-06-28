/**
 * Skill data loader.
 *
 * Source of truth: `public/data/skills/{element}[-non_bender_path].json`,
 * extracted from `docs/*_skill_tree.html` by `scripts/extract-skill-trees.mjs`.
 *
 * Lookup order:
 *   1. Supabase API (when enabled)
 *   2. GM-imported overrides (localStorage, via import/storage.js)
 *   3. Canonical JSON files in /data/skills/
 *
 * Mock data has been removed — these JSON files are the source of truth.
 */

import { getSkills } from '../api/skills.js';
import { getImportedSkills } from '../import/storage.js';

const VALID_ELEMENTS = new Set(['fire', 'water', 'earth', 'air', 'none']);
const VALID_NON_BENDER_PATHS = new Set(['chiblocker', 'weapons']);

// In-memory cache so we only fetch each JSON file once per session.
const cache = new Map();

function cacheKey(element, nonBenderPath) {
  return nonBenderPath ? `${element}:${nonBenderPath}` : element;
}

function jsonPath(element, nonBenderPath) {
  return nonBenderPath
    ? `data/skills/${element}-${nonBenderPath}.json`
    : `data/skills/${element}.json`;
}

async function fetchCanonical(element, nonBenderPath) {
  const key = cacheKey(element, nonBenderPath);
  if (cache.has(key)) return cache.get(key);

  const url = jsonPath(element, nonBenderPath);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const skills = Array.isArray(data?.skills) ? data.skills : [];
    cache.set(key, skills);
    return skills;
  } catch (err) {
    console.warn(`[Skills] Canonical fetch failed (${url})`, err);
    return [];
  }
}

/**
 * Load skills for an element (optionally a non-bender path).
 *
 * @param {string} element - 'fire' | 'water' | 'earth' | 'air' | 'none'
 * @param {object} [options]
 * @param {'chiblocker'|'weapons'|null} [options.nonBenderPath] required when element='none'
 * @returns {Promise<{ skills: object[] }>}
 */
export async function loadSkills(element, options = {}) {
  if (!VALID_ELEMENTS.has(element)) {
    throw new Error(`Unknown element: ${element}`);
  }
  const nonBenderPath = options.nonBenderPath || null;
  if (nonBenderPath && !VALID_NON_BENDER_PATHS.has(nonBenderPath)) {
    throw new Error(`Unknown non_bender_path: ${nonBenderPath}`);
  }
  if (element === 'none' && !nonBenderPath) {
    // No path chosen yet → return empty so the UI can show the picker.
    return { skills: [] };
  }

  // 1) Supabase API
  try {
    const remote = await getSkills(element);
    if (Array.isArray(remote) && remote.length > 0) {
      const filtered = nonBenderPath
        ? remote.filter((s) => s.non_bender_path === nonBenderPath)
        : remote;
      if (filtered.length > 0) return { skills: filtered };
    }
  } catch (err) {
    console.warn(`[Skills] API unavailable for ${element}:`, err.message);
  }

  // 2) GM-imported localStorage overrides
  const imported = getImportedSkills(element);
  if (imported.length > 0) {
    const filtered = nonBenderPath
      ? imported.filter((s) => s.non_bender_path === nonBenderPath)
      : imported;
    if (filtered.length > 0) return { skills: filtered };
  }

  // 3) Canonical JSON (source of truth)
  const canonical = await fetchCanonical(element, nonBenderPath);
  return { skills: canonical };
}

/** Exposed for tests to wipe the in-memory cache between cases. */
export function _resetSkillCache() {
  cache.clear();
}
