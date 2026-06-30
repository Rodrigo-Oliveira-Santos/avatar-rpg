/**
 * SkillUseGrid — reusable square-card grid for triggering "use skill".
 *
 * Renders one card per (active) skill: icon-like accent + name + chi
 * cost / restore chips + Usar button. Insufficient chi disables the
 * button and marks the card with a visual state so the player sees
 * at a glance which skills they can afford. (Cooldown state is also
 * supported — the consumer flags it via the `getCooldown` callback.)
 *
 * Used by:
 *   • Hub player view ("As minhas habilidades")
 *   • Character profile page ("Habilidades")
 *   • GM Control player card (compact mode)
 *
 * The consumer is responsible for wiring `onUse(skill)` to the actual
 * Character.useSkill / gm-characters round-trip — the grid is purely
 * presentational + state-aware.
 */

import { createElement, on } from '../utils/dom.js';

/**
 * Pretty-print a number-of-uses → "M0..M3" tier label.
 */
function masteryBadge(level) {
  return `M${Math.max(0, Math.min(3, Number(level) || 0))}`;
}

const BRANCH_ACCENT = {
  sp: '#7F77DD',
  ag: '#1D9E75',
  cb: '#D88840',
  pr: '#E8844A',
  br: '#C03020',
};

const BRANCH_ICON = {
  sp: '🌀',
  ag: '🏃',
  cb: '⚔️',
  pr: '🎯',
  br: '💢',
};

/**
 * Build a single skill card. Pure DOM — returns the root element so
 * the caller can decide where to mount it.
 *
 * @param {object} args
 * @param {object} args.skill            — Full skill definition (id, name, chi_cost, chi_restore, branch, description, …)
 * @param {object} args.state            — {
 *     uses, mastery, currentCp, maxCp,
 *     cooldown?: { remaining_vezes, reason },
 *     inactive?: boolean,
 *   }
 *   - `inactive: true` flags an unlocked-but-not-equipped skill. The
 *     card is dimmed, the Use button is disabled with a "Activa
 *     primeiro" hint and a small "inativa" badge replaces the chi
 *     banner. Used by the profile's "Todas as habilidades" section
 *     so the player sees skills they own without an extra trip to
 *     the skill tree.
 * @param {boolean} args.compact         — Compact mode (smaller font, no description preview).
 * @param {(skill) => void} args.onUse   — Click handler for the Usar button.
 */
export function createSkillUseCard({ skill, state, compact = false, onUse }) {
  const cost = Number(skill.chi_cost) || 0;
  const restore = Number(skill.chi_restore) || 0;
  const uses = Number(state?.uses) || 0;
  const mastery = Number(state?.mastery) || 0;
  const maxCp = Number(state?.maxCp) || 0;
  const currentCp = Number.isFinite(state?.currentCp) ? state.currentCp : maxCp;

  const insufficientChi = cost > 0 && currentCp < cost;
  const cooldown = state?.cooldown || null; // { remaining_vezes, reason } or null
  const inactive = !!state?.inactive;
  const disabled = inactive || insufficientChi || !!cooldown;

  const accent = BRANCH_ACCENT[skill.branch] || '#D88840';
  const icon = BRANCH_ICON[skill.branch] || '⚡';

  const card = createElement('article', {
    class: [
      'suc',
      compact && 'suc-compact',
      disabled && 'suc-disabled',
      inactive && 'suc-inactive',
      insufficientChi && !inactive && 'suc-no-chi',
      cooldown && !inactive && 'suc-cooldown',
    ].filter(Boolean).join(' '),
  });
  card.style.setProperty('--suc-accent', accent);

  // Tooltip: full description + reason for any disabled state. Lets
  // the player hover to learn why a card is greyed out without
  // expanding the card body.
  const tooltip = [];
  if (skill.description) tooltip.push(skill.description);
  if (cost > 0) tooltip.push(`Custo: ${cost} chi`);
  if (restore > 0) tooltip.push(`Restaura: ${restore} chi`);
  if (inactive) tooltip.push('ℹ Skill desbloqueada mas não ativa — activa-a na skill tree para a usar.');
  else if (insufficientChi) tooltip.push(`⚠ Chi insuficiente (${currentCp}/${cost})`);
  if (cooldown) tooltip.push(`⏱ Cooldown: ${cooldown.reason || `${cooldown.remaining_vezes} vez(es)`}`);
  card.title = tooltip.join('\n');

  const header = createElement('div', { class: 'suc-head' });
  header.appendChild(createElement('span', { class: 'suc-icon', textContent: icon }));
  const titleWrap = createElement('div', { class: 'suc-title-wrap' });
  titleWrap.appendChild(createElement('div', { class: 'suc-name', textContent: skill.name }));
  if (skill.tier_label) {
    titleWrap.appendChild(createElement('div', { class: 'suc-tier', textContent: skill.tier_label }));
  }
  header.appendChild(titleWrap);
  header.appendChild(createElement('span', { class: 'suc-mastery', textContent: masteryBadge(mastery) }));
  card.appendChild(header);

  if (!compact && skill.description) {
    card.appendChild(createElement('p', {
      class: 'suc-desc',
      textContent: skill.description,
    }));
  }

  const chips = createElement('div', { class: 'suc-chips' });
  if (cost > 0) {
    chips.appendChild(createElement('span', {
      class: `suc-chip suc-chip-cost${insufficientChi && !inactive ? ' insufficient' : ''}`,
      textContent: `Chi: ${cost}`,
    }));
  }
  if (restore > 0) {
    chips.appendChild(createElement('span', {
      class: 'suc-chip suc-chip-restore',
      textContent: `+${restore} Chi`,
    }));
  }
  if (uses > 0) {
    chips.appendChild(createElement('span', {
      class: 'suc-chip suc-chip-uses',
      textContent: `${uses} usos`,
    }));
  }
  if (inactive) {
    chips.appendChild(createElement('span', {
      class: 'suc-chip suc-chip-inactive',
      textContent: 'Inativa',
    }));
  }
  if (chips.childNodes.length > 0) card.appendChild(chips);

  // Inline status banner — only one shows at a time. Inactive takes
  // precedence (it's the structural state), then cooldown, then chi.
  if (inactive) {
    card.appendChild(createElement('div', {
      class: 'suc-state-banner',
      textContent: 'ℹ Activa esta skill na skill tree para a poderes usar.',
    }));
  } else if (cooldown) {
    card.appendChild(createElement('div', {
      class: 'suc-state-banner',
      textContent: `⏱ ${cooldown.reason || `Cooldown ${cooldown.remaining_vezes} vez(es)`}`,
    }));
  } else if (insufficientChi) {
    card.appendChild(createElement('div', {
      class: 'suc-state-banner',
      textContent: `⚠ Chi insuficiente (${currentCp}/${cost})`,
    }));
  }

  const btn = createElement('button', {
    type: 'button',
    class: 'suc-use-btn',
    textContent: inactive ? 'Inativa' : '⚡ Usar',
  });
  if (disabled) btn.disabled = true;
  on(btn, 'click', (event) => {
    event.stopPropagation();
    if (disabled) return;
    onUse?.(skill);
  });
  card.appendChild(btn);

  return card;
}

/**
 * Render a grid of skill cards. Returns the host element so callers
 * can mount it and re-render in place by calling `refresh()`.
 *
 * @param {object} args
 * @param {object[]} args.skills           — Skill definitions to show.
 * @param {object} args.character          — Character instance (subscribed for live updates).
 * @param {(skill) => void} args.onUse     — Click handler.
 * @param {boolean} [args.compact]         — Compact card style.
 * @param {(skill) => object|null} [args.getCooldown]
 *     — Optional callback returning a cooldown descriptor `{ remaining_vezes, reason }`
 *       per skill. Used to disable cards mid-cooldown.
 * @param {(skill) => boolean} [args.getInactive]
 *     — Optional callback returning true when the skill is unlocked
 *       but not currently active (equipped). Cards in this state get
 *       dimmed + "Activa primeiro" hint instead of the Usar button.
 * @param {string} [args.emptyMessage]     — Text when no skills.
 * @returns {{ root: HTMLElement, refresh: () => void, destroy: () => void }}
 */
export function mountSkillUseGrid({
  container,
  skills,
  character,
  onUse,
  compact = false,
  getCooldown = null,
  getInactive = null,
  emptyMessage = 'Sem habilidades activas — desbloqueia algumas na skill tree para as poderes usar aqui.',
}) {
  const root = createElement('div', { class: `suc-grid${compact ? ' suc-grid-compact' : ''}` });
  container.appendChild(root);

  function render() {
    root.innerHTML = '';
    if (!Array.isArray(skills) || skills.length === 0) {
      root.appendChild(createElement('p', { class: 'suc-empty', textContent: emptyMessage }));
      return;
    }
    const charData = character?.getData ? character.getData() : (character || {});
    const usesMap = charData.skill_uses || {};
    const maxCp = Number(charData.stats_derived?.maxCP) || 0;
    const currentCp = Number.isFinite(charData.cp_current) ? charData.cp_current : maxCp;

    skills.forEach((skill) => {
      const uses = Number(usesMap[skill.id]) || 0;
      const mastery = typeof character?.getMasteryLevel === 'function'
        ? character.getMasteryLevel(skill.id)
        : 0;
      const state = {
        uses,
        mastery,
        currentCp,
        maxCp,
        cooldown: getCooldown ? getCooldown(skill) : null,
        inactive: getInactive ? !!getInactive(skill) : false,
      };
      root.appendChild(createSkillUseCard({ skill, state, compact, onUse }));
    });
  }

  render();

  // Live updates: when the character's state changes (use, attribute
  // edit, level up, …) we re-render so the chi check and uses counter
  // reflect reality without a page reload.
  let unsubscribe = null;
  if (character && typeof character.subscribe === 'function') {
    unsubscribe = character.subscribe(render);
  }

  return {
    root,
    refresh: render,
    destroy() {
      if (typeof unsubscribe === 'function') unsubscribe();
      root.remove();
    },
  };
}
