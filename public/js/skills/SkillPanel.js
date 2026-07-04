/**
 * SkillPanel — slide-in side panel for a single skill node.
 *
 * Mirrors the behaviour of `docs/skill-trees/*.html`:
 *   • Tier label, name, damage summary, description
 *   • Attribute requirement pills (X/Y ✓/✗) coloured per attribute
 *   • Mastery breakdown (M0..M3) with the current level highlighted +
 *     usage counter and next-threshold reminder
 *   • Action buttons:
 *       – Desbloquear  (disabled when not unlockable)
 *       – ⚡ Usar       (active skills only — increments usage counter)
 *       – ⭐ Subir Maestria (when next mastery threshold is reached)
 *   • Status pill (ok / warning / error) explaining why a skill is locked.
 */

import { createElement } from '../utils/dom.js';
import { MASTERY_THRESHOLDS } from '../utils/constants.js';

const ATTR_COLORS = {
  FOR: '#E8844A', AGI: '#1D9E75', PER: '#7F77DD',
  ESP: '#AFA9EC', CHI: '#EF9F27', RES: '#C03020',
};

const BRANCH_ACCENT = {
  sp: '#7F77DD',
  ag: '#1D9E75',
  cb: '#D88840',
  pr: '#E8844A',
  br: '#C03020',
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/**
 * Compute everything the panel needs to render and decide what actions
 * are available for a given skill.
 */
export function describeSkillState({ skill, character, allSkills }) {
  const charData = character.getData();
  const charSkills = charData.habilidades || {};
  const attrs = charData.atributos || {};
  const state = charSkills[skill.id] || {};
  const active = !!state.active;
  const uses = Number(charData.skill_uses?.[skill.id]) || 0;
  const masteryLevel = typeof character.getMasteryLevel === 'function'
    ? character.getMasteryLevel(skill.id)
    : 0;

  const attrReqs = skill.attribute_requirements || {};
  const attrMissing = Object.entries(attrReqs)
    .filter(([k, v]) => (attrs[k] || 0) < v)
    .map(([k, v]) => ({ attr: k, have: attrs[k] || 0, need: v }));

  const prereqIds = Array.isArray(skill.prerequisites) ? skill.prerequisites : [];
  const prereqMissing = prereqIds
    .filter((id) => !charSkills[id]?.active)
    .map((id) => {
      const found = (allSkills || []).find((s) => s.id === id);
      return found ? found.name : id;
    });

  // Combat path conflict (pr vs br at tier 3+).
  const charPath = charData.combat_path || null;
  let pathConflict = null;
  if (skill.tier >= 3 && (skill.branch === 'pr' || skill.branch === 'br')) {
    const required = skill.branch === 'pr' ? 'precise' : 'brute';
    if (charPath && charPath !== required) {
      pathConflict = `Já escolheste o caminho ${charPath === 'precise' ? 'Preciso' : 'Bruto'}.`;
    }
  }

  const unlockable = !active
    && attrMissing.length === 0
    && prereqMissing.length === 0
    && !pathConflict;

  // Chi accounting. `enoughChi` is informational only — useSkill still
  // applies the cost (clamping at 0) but the UI surfaces it so the
  // player can decide whether to wait, restore, or push through.
  const chiCost = Number(skill.chi_cost) || 0;
  const chiRestore = Number(skill.chi_restore) || 0;
  const maxCP = Number(charData.stats_derived?.maxCP) || 0;
  const currentCp = Number.isFinite(charData.cp_current) ? charData.cp_current : maxCP;
  const enoughChi = currentCp >= chiCost;

  return {
    active,
    unlockable,
    uses,
    masteryLevel,
    attrReqs,
    attrMissing,
    prereqMissing,
    pathConflict,
    chiCost,
    chiRestore,
    currentCp,
    maxCP,
    enoughChi,
  };
}

export function createSkillPanel({ host, character, getAllSkills, callbacks = {} }) {
  const root = createElement('aside', { class: 'skill-panel' });
  // ARIA polish
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-hidden', 'true');
  host.appendChild(root);

  let currentSkillId = null;
  let unsubscribe = null;

  function close() {
    currentSkillId = null;
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '';
    if (typeof callbacks.onClose === 'function') callbacks.onClose();
  }

  function renderMasteryRows(skill, info) {
    const levels = Array.isArray(skill.mastery_levels) ? skill.mastery_levels : null;
    if (!levels) {
      return `<div class="sp-empty">Sem sistema de maestria</div>`;
    }
    if (!info.active) {
      return `<div class="sp-empty">Desbloqueia para ver maestria</div>`;
    }
    const rows = levels.map((label, i) => {
      const reached = i <= info.masteryLevel;
      const current = i === info.masteryLevel;
      const threshold = i === 0 ? 'Base' : `${MASTERY_THRESHOLDS[i]} usos`;
      return `
        <div class="sp-mrow">
          <div class="sp-mdot ${current ? 'cur' : reached ? 'on' : ''}"></div>
          <div class="sp-mlabel ${reached ? 'on' : ''}">${escapeHtml(label)}</div>
          <div class="sp-mth">${escapeHtml(threshold)}</div>
        </div>`;
    }).join('');
    const nextLevel = Math.min(info.masteryLevel + 1, 3);
    const next = info.masteryLevel < 3
      ? `<div class="sp-meta">Usos: ${info.uses} · próx. M${nextLevel}: ${MASTERY_THRESHOLDS[nextLevel]}</div>`
      : `<div class="sp-meta">★ Maestria máxima M3</div>`;
    return rows + next;
  }

  function renderAttrPills(skill, info) {
    const entries = Object.entries(info.attrReqs);
    if (entries.length === 0) return '';
    const attrs = (character.getData().atributos || {});
    const pills = entries.map(([k, v]) => {
      const have = attrs[k] || 0;
      const ok = have >= v;
      const color = ATTR_COLORS[k] || '#9a9890';
      const bg = ok ? `${color}22` : '#1a1a22';
      const bd = ok ? color : '#3a3a48';
      const fg = ok ? color : '#5a5856';
      return `<span class="sp-pill" style="border-color:${bd};background:${bg};color:${fg}">
        ${k} ${have}/${v} ${ok ? '✓' : '✗'}
      </span>`;
    }).join('');
    return `
      <div class="sp-label">Atributos necessários</div>
      <div class="sp-pills">${pills}</div>`;
  }

  function renderActions(skill, info) {
    const buttons = [];
    if (!info.active) {
      buttons.push(`
        <button type="button" class="sp-btn sp-unlock" data-action="unlock" ${info.unlockable ? '' : 'disabled'}>
          Desbloquear Habilidade
        </button>`);
    } else {
      // Use button: shows the chi cost + restore + uses so the player
      // sees the price BEFORE clicking. Insufficient chi greys out the
      // button (Character.useSkill clamps cp at 0, so we surface the
      // limit here instead of letting the player drain silently).
      const costParts = [];
      if (info.chiCost > 0) costParts.push(`−${info.chiCost} Chi`);
      if (info.chiRestore > 0) costParts.push(`+${info.chiRestore} Chi`);
      const cost = costParts.length ? ` — ${costParts.join(' / ')}` : '';
      const insufficient = info.chiCost > 0 && !info.enoughChi;
      buttons.push(`
        <button type="button" class="sp-btn sp-use${insufficient ? ' sp-use-disabled' : ''}" data-action="use"${insufficient ? ' disabled title="Chi insuficiente"' : ''}>
          ⚡ Usar${cost} (${info.uses} usos)
        </button>`);
      const next = Math.min(info.masteryLevel + 1, 3);
      if (info.masteryLevel < 3) {
        const ready = info.uses >= MASTERY_THRESHOLDS[next];
        buttons.push(`
          <button type="button" class="sp-btn sp-upgrade" data-action="upgrade" ${ready ? '' : 'disabled'}>
            ⭐ Subir para M${next} (${MASTERY_THRESHOLDS[next]} usos)
          </button>`);
      }
    }
    return `<div class="sp-actions">${buttons.join('')}</div>`;
  }

  function renderStatus(skill, info) {
    if (info.active) {
      // Insufficient chi gets its own dedicated banner — it's an actual
      // blocker for the Usar button, more important right now than the
      // mastery progress, so it shows on top with a chi-blue tint.
      if (info.chiCost > 0 && !info.enoughChi) {
        const chiBanner = `<div class="sp-status sp-status-chi">⚠ Chi insuficiente (${info.currentCp}/${info.chiCost})</div>`;
        if (info.masteryLevel >= 3) return chiBanner;
        const next = Math.min(info.masteryLevel + 1, 3);
        const remaining = MASTERY_THRESHOLDS[next] - info.uses;
        const masteryBanner = remaining <= 0
          ? `<div class="sp-status ok">Pronto para subir maestria!</div>`
          : `<div class="sp-status warn">Faltam ${remaining} usos para M${next}</div>`;
        return `${chiBanner}${masteryBanner}`;
      }
      if (info.masteryLevel >= 3) {
        return `<div class="sp-status ok">★ Maestria máxima atingida!</div>`;
      }
      const next = Math.min(info.masteryLevel + 1, 3);
      const remaining = MASTERY_THRESHOLDS[next] - info.uses;
      if (remaining <= 0) {
        return `<div class="sp-status ok">Pronto para subir maestria!</div>`;
      }
      return `<div class="sp-status warn">Faltam ${remaining} usos para M${next}</div>`;
    }
    const reasons = [];
    if (info.prereqMissing.length) {
      reasons.push(`Pré-requisitos em falta: ${info.prereqMissing.join(', ')}`);
    }
    if (info.pathConflict) reasons.push(info.pathConflict);
    info.attrMissing.forEach((m) => {
      reasons.push(`${m.attr}: tens ${m.have}, precisas ${m.need}`);
    });
    if (reasons.length === 0) {
      return `<div class="sp-status ok">✓ Pronto para desbloquear</div>`;
    }
    return `<div class="sp-status warn">${reasons.map(escapeHtml).join('<br>')}</div>`;
  }

  function render() {
    if (!currentSkillId) return;
    const allSkills = getAllSkills();
    const skill = allSkills.find((s) => s.id === currentSkillId);
    if (!skill) { close(); return; }

    const info = describeSkillState({ skill, character, allSkills });
    const accent = BRANCH_ACCENT[skill.branch] || '#D88840';
    root.style.setProperty('--sp-accent', accent);

    const prereqText = skill.requirements_text && skill.requirements_text !== '—'
      ? `<div class="sp-prereq">Pré-req: ${escapeHtml(skill.requirements_text)}</div>`
      : '';

    const dmg = skill.damage_summary
      ? `<div class="sp-dmg">${escapeHtml(skill.damage_summary)}</div>` : '';

    root.innerHTML = `
      <header class="sp-head">
        <div class="sp-tier">${escapeHtml(skill.tier_label || `Tier ${skill.tier ?? '?'}`)}</div>
        <button type="button" class="sp-close" aria-label="Fechar" data-action="close">✕</button>
      </header>
      <div class="sp-body">
        <h3 class="sp-name">${escapeHtml(skill.name || '')}</h3>
        ${dmg}
        <p class="sp-desc">${escapeHtml(skill.description || '')}</p>
        ${prereqText}
        ${renderAttrPills(skill, info)}
        <hr class="sp-sep">
        <div class="sp-label">Sistema de Maestria</div>
        <div class="sp-mastery">${renderMasteryRows(skill, info)}</div>
        ${renderActions(skill, info)}
        ${renderStatus(skill, info)}
      </div>
    `;

    root.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'close') return close();
        if (btn.hasAttribute('disabled')) return;
        if (action === 'unlock') callbacks.onUnlock?.(skill);
        else if (action === 'use') callbacks.onUse?.(skill);
        else if (action === 'upgrade') callbacks.onUpgrade?.(skill);
      });
    });
  }

  function open(skillId) {
    currentSkillId = skillId;
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    render();
  }

  // Re-render when character data changes (skill unlock, use, attr edit…)
  if (typeof character.subscribe === 'function') {
    unsubscribe = character.subscribe(() => { if (currentSkillId) render(); });
  }

  function destroy() {
    if (typeof unsubscribe === 'function') unsubscribe();
    root.remove();
  }

  return {
    open,
    close,
    refresh: () => { if (currentSkillId) render(); },
    isOpenFor: (id) => currentSkillId === id,
    getCurrentId: () => currentSkillId,
    destroy,
  };
}
