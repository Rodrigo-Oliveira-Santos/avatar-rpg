/**
 * Cooldown engine — placeholder scaffolding.
 *
 * The skill-tree HTMLs (and the JSON they extract into) do NOT yet
 * carry per-skill cooldown information — no `cooldown`, `cd`, `recarga`
 * etc. fields. So `getCooldownState` currently always returns null:
 * no skill is ever flagged as on-cooldown.
 *
 * The SkillUseGrid + SkillPanel UIs already wire a `getCooldown`
 * callback that, when it returns a non-null `{ remaining_vezes, reason }`
 * record, disables the Usar button + paints the card with the orange
 * cooldown state. When the skill data starts shipping cooldown
 * descriptors, just teach this module how to read them — every
 * consumer is already prepared to display the result.
 *
 * The anchor data we DO have today (recorded by
 * `Character.recordSkillUse` into `data.skill_last_used[id]`) is:
 *   { encounter_id, encounter_status, round, turn_index, at }
 * — i.e. when the skill was last cast within an encounter. That's
 * everything a future cooldown rule needs to compute "how many vezes
 * have elapsed since the last cast".
 */

/**
 * Resolve the cooldown state for a single skill on a given character.
 *
 * @param {object} skill        — Skill definition. May expose a future
 *   `cooldown_vezes: N` field; when absent the function short-circuits
 *   to null.
 * @param {object} character    — Character instance / serialised data.
 * @param {object} [context]    — Optional `{ encounter }` snapshot
 *   (current round + turn_index) so the rule can compute "elapsed".
 * @returns {{ remaining_vezes: number, reason: string }|null}
 */
export function getCooldownState(skill /*, character, context */) {
  if (!skill || typeof skill !== 'object') return null;
  // Today: no skill ships cooldown_vezes — always available.
  const cd = Number(skill.cooldown_vezes);
  if (!Number.isFinite(cd) || cd <= 0) return null;
  // The rule below is a placeholder for when cooldown data lands.
  // It intentionally relies only on the skill_last_used anchor that
  // Character.recordSkillUse already writes, so wiring it up is a
  // single-file change once the skill JSON ships `cooldown_vezes`.
  return null;
}

/**
 * Build a `(skill) => state` callback bound to a character + the live
 * encounter snapshot. Pass it as `getCooldown` to SkillUseGrid.
 */
export function makeCooldownChecker(character) {
  return (skill) => getCooldownState(skill, character, {
    encounter: typeof window !== 'undefined' ? window.__ACTIVE_ENCOUNTER__ || null : null,
  });
}
