/**
 * Canvas-based skill tree view.
 *
 * Mirrors the layout/visuals from `docs/skill-trees/*.html` using the
 * `branch`, `tier`, `position.column` data we carry per skill. Renders
 * branch background bands, dependency edges (solid = same branch, dashed
 * = cross-branch) and reacts to hover / clicks. Clicking always calls
 * `onNodeClick(skill)` — the parent decides what to do (typically opens
 * a `SkillPanel`). Locking is enforced visually but never via swallowed
 * clicks, so the user can always read a node's details.
 */

import { createElement } from '../utils/dom.js';

const NW = 92, NH = 38;
const HGAP = 22, VGAP = 110;
const MT = 56, ML = 60;
const LEX = 80;
const BGAP = 60;
const CW = NW + HGAP;

const TIER_LABELS = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Lendário'];

const BRANCH_COLORS = {
  sp: { fill: '#1e1a40', stroke: '#7F77DD', text: '#EEEDFE', light: '#7F77DD', label: 'ESPIRITUALIDADE' },
  ag: { fill: '#0a2e20', stroke: '#1D9E75', text: '#E1F5EE', light: '#1D9E75', label: 'AGILIDADE' },
  cb: { fill: '#3a2006', stroke: '#D88840', text: '#FAEEDA', light: '#D88840', label: 'COMBATE PARTILHADO (N1–N2)' },
  pr: { fill: '#3a1606', stroke: '#E8844A', text: '#FAECE7', light: '#E8844A', label: '◀ PRECISO (N3+)' },
  br: { fill: '#2e0804', stroke: '#C03020', text: '#FCEBEB', light: '#C03020', label: 'BRUTO (N3+) ▶' },
  gold: { fill: '#2e1c02', stroke: '#BA7517', text: '#FAEEDA', light: '#EF9F27' },
};

function branchColor(skill) {
  if (!skill) return BRANCH_COLORS.cb;
  if (skill.tier >= 5 || skill.is_legendary) return BRANCH_COLORS.gold;
  return BRANCH_COLORS[skill.branch] || BRANCH_COLORS.cb;
}

function tierY(tier) {
  const tIdx = Math.max(0, Math.min(4, tier - 1));
  return tIdx <= 3
    ? MT + tIdx * (NH + VGAP) + NH / 2
    : MT + 3 * (NH + VGAP) + NH / 2 + LEX;
}

function branchX(branch, column) {
  const offsets = {
    sp: ML,
    ag: ML + 3 * CW + BGAP,
    cb: ML + 6 * CW + 2 * BGAP,
    pr: ML + 6 * CW + 2 * BGAP,
    br: ML + 6 * CW + 2 * BGAP + 3 * CW + 16,
  };
  return (offsets[branch] || ML) + column * CW + NW / 2;
}

function laidOutSkills(skills) {
  return skills.map((s) => ({
    ...s,
    _x: branchX(s.branch, s.position?.column || 0),
    _y: tierY(s.tier) + (s.position?.y_offset || 0),
  }));
}

function canvasSize(positioned) {
  let maxX = 0, maxY = 0;
  positioned.forEach((n) => {
    maxX = Math.max(maxX, n._x + NW);
    maxY = Math.max(maxY, n._y + NH);
  });
  return { width: maxX + 40, height: maxY + 60 };
}

function tierBandY0(t, h) {
  if (t === 0) return 0;
  return tierY(t + 1) - NH / 2 - VGAP / 2;
}
function tierBandY1(t, h) {
  if (t === 4) return h;
  return tierY(t + 2) - NH / 2 - VGAP / 2;
}

function drawBackground(ctx, w, h) {
  ctx.fillStyle = '#0d0d0f';
  ctx.fillRect(0, 0, w, h);

  // Alternating tier bands + labels
  for (let t = 0; t < 5; t++) {
    const y0 = tierBandY0(t, h);
    const y1 = tierBandY1(t, h);
    ctx.fillStyle = t % 2 === 0 ? '#0d0d0f' : '#111118';
    ctx.fillRect(0, y0, w, y1 - y0);
    ctx.fillStyle = t === 4 ? '#BA7517' : '#2a2a38';
    ctx.font = '700 9px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(TIER_LABELS[t].toUpperCase(), 8, (y0 + y1) / 2 + 4);
    if (t < 4) {
      ctx.strokeStyle = '#181820';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(60, y1); ctx.lineTo(w - 10, y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Branch background bands (translucent column groups)
  const splitY = tierY(3) - NH / 2 - VGAP / 2; // pr/br only from tier 3+
  const BANDS = [
    { b: 'sp', x: branchX('sp', 0) - NW / 2 - 8, w: 3 * CW + 8, y0: 0, y1: h },
    { b: 'ag', x: branchX('ag', 0) - NW / 2 - 8, w: 3 * CW + 8, y0: 0, y1: h },
    { b: 'cb', x: branchX('cb', 0) - NW / 2 - 8, w: 6 * CW + 8, y0: 0, y1: splitY },
    { b: 'pr', x: branchX('pr', 0) - NW / 2 - 8, w: 3 * CW + 4, y0: splitY, y1: h },
    { b: 'br', x: branchX('br', 0) - NW / 2,     w: 3 * CW + 16, y0: splitY, y1: h },
  ];
  BANDS.forEach(({ b, x, w: bw, y0, y1 }) => {
    const c = BRANCH_COLORS[b];
    ctx.fillStyle = c.fill;
    ctx.globalAlpha = 0.07;
    ctx.fillRect(x, y0, bw, y1 - y0);
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y0, bw, y1 - y0);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = c.light;
    ctx.font = '700 10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.label, x + bw / 2, y0 + 14);
    ctx.globalAlpha = 1;
  });

  // Vertical separator between pr and br
  ctx.strokeStyle = '#3a1a08';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  const sep = branchX('br', 0) - NW / 2 - 6;
  ctx.beginPath();
  ctx.moveTo(sep, splitY); ctx.lineTo(sep, h - 10);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawEdge(ctx, a, b, opts) {
  if (!a || !b) return;
  const dash = a.branch !== b.branch;
  const c = branchColor(a);
  const ax = a._x, ay = a._y + NH / 2 + 2;
  const bx = b._x, by = b._y - NH / 2 - 2;
  const my = ay + (by - ay) * 0.5;
  ctx.save();
  ctx.strokeStyle = opts.hov ? c.light : c.stroke;
  ctx.lineWidth = opts.hov ? 2 : 1.3;
  ctx.globalAlpha = opts.hov ? 0.9 : opts.lit ? 0.65 : dash ? 0.22 : 0.4;
  if (dash) ctx.setLineDash([8, 6]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.lineTo(ax, my);
  ctx.lineTo(bx, my); ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawNode(ctx, node, state) {
  const c = branchColor(node);
  const x = node._x - NW / 2;
  const y = node._y - NH / 2;
  ctx.save();
  if (state.active) { ctx.shadowColor = c.light; ctx.shadowBlur = state.focus ? 20 : 8; }
  else if (state.focus && state.unlockable) { ctx.shadowColor = c.stroke; ctx.shadowBlur = 14; }
  roundRect(ctx, x, y, NW, NH, 5);

  if (state.active)          ctx.fillStyle = c.fill;
  else if (state.unlockable) ctx.fillStyle = c.fill + '99';
  else                       ctx.fillStyle = '#0d0d0f';
  ctx.fill();

  if (state.active) {
    ctx.strokeStyle = c.light; ctx.lineWidth = 2;
  } else if (state.focus && state.unlockable) {
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 2;
  } else if (state.unlockable) {
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.65;
  } else {
    ctx.strokeStyle = '#252530'; ctx.lineWidth = 1; ctx.globalAlpha = 0.35;
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Inner gold ring for legendary unlocked nodes
  if ((node.tier >= 5 || node.is_legendary) && state.active) {
    roundRect(ctx, x + 4, y + 4, NW - 8, NH - 8, 3);
    ctx.strokeStyle = '#EF9F27';
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Mastery dots
  if (state.active && Array.isArray(node.mastery_levels)) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(node._x + NW / 2 - 8 - i * 8, node._y + NH / 2 - 5, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i < state.masteryLevel ? '#EF9F27' : '#252530';
      ctx.fill();
    }
  }

  // Lock icon (centered)
  if (!state.active && !state.unlockable) {
    ctx.font = "10px 'Segoe UI'";
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#3a3a48';
    ctx.fillText('🔒', node._x, node._y + 4);
    ctx.globalAlpha = 1;
  }

  // Name (wrap on first space → two lines)
  const words = (node.name || '').split(/\s+/);
  ctx.fillStyle = (state.active || state.unlockable) ? c.text : '#2e2e3a';
  ctx.globalAlpha = (state.active || state.unlockable) ? 1 : 0.45;
  ctx.textAlign = 'center';
  ctx.font = "500 9px 'Segoe UI', system-ui, sans-serif";
  if (words.length <= 1) {
    ctx.fillText(words[0] || '', node._x, node._y + 3);
  } else {
    const mid = Math.ceil(words.length / 2);
    ctx.fillText(words.slice(0, mid).join(' '), node._x, node._y - 4);
    ctx.fillText(words.slice(mid).join(' '),    node._x, node._y + 7);
  }
  ctx.restore();
}

/**
 * Mount the canvas tree into `container`. Returns control handle.
 *
 * @param {object} opts
 * @param {HTMLElement} opts.container
 * @param {object[]} opts.skills
 * @param {object} opts.character
 * @param {(skill: object) => void} opts.onNodeClick
 * @param {(skill: object) => boolean} [opts.canUnlock]
 *   Optional predicate used for the visual `unlockable` state. If absent,
 *   falls back to a simple deps + attribute_requirements check.
 */
export function mountCanvasTree({ container, skills, character, onNodeClick, canUnlock }) {
  container.innerHTML = '';
  const positioned = laidOutSkills(skills);
  const { width, height } = canvasSize(positioned);

  const wrap = createElement('div', { class: 'skill-canvas-wrap' });
  const canvas = createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  wrap.appendChild(canvas);
  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const idIndex = new Map(positioned.map((s) => [s.id, s]));

  let hoverId = null;
  let selectedId = null;
  let rafPending = false;

  function defaultCanUnlock(skill) {
    const charData = character.getData();
    const charSkills = charData.habilidades || {};
    const attrs = charData.atributos || {};
    const depsOk = (skill.prerequisites || []).every((id) => !!charSkills[id]?.active);
    const attrOk = Object.entries(skill.attribute_requirements || {})
      .every(([k, v]) => (attrs[k] || 0) >= v);
    // Path conflict (tier 3+ pr/br)
    if (skill.tier >= 3 && (skill.branch === 'pr' || skill.branch === 'br')) {
      const required = skill.branch === 'pr' ? 'precise' : 'brute';
      const charPath = charData.combat_path;
      if (charPath && charPath !== required) return false;
    }
    return depsOk && attrOk;
  }
  const canUnlockFn = typeof canUnlock === 'function' ? canUnlock : defaultCanUnlock;

  function computeState(node) {
    const charSkills = character.getData().habilidades || {};
    const active = !!charSkills[node.id]?.active;
    const masteryLevel = typeof character.getMasteryLevel === 'function'
      ? character.getMasteryLevel(node.id) : 0;
    const focus = node.id === hoverId || node.id === selectedId;
    const unlockable = !active && canUnlockFn(node);
    return { active, unlockable, masteryLevel, focus };
  }

  function scheduleRedraw() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; redraw(); });
  }

  function redraw() {
    drawBackground(ctx, width, height);

    // Highlighted edges (connected to hover or selected)
    const focus = hoverId || selectedId;
    positioned.forEach((n) => {
      (n.prerequisites || []).forEach((depId) => {
        const a = idIndex.get(depId);
        if (!a) return;
        const charSkills = character.getData().habilidades || {};
        const lit = !!charSkills[a.id]?.active && !!charSkills[n.id]?.active;
        const hov = focus && (focus === a.id || focus === n.id);
        drawEdge(ctx, a, n, { hov, lit });
      });
    });

    positioned.forEach((n) => drawNode(ctx, n, computeState(n)));
  }

  function pickNodeAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) * (canvas.width / r.width);
    const y = (clientY - r.top)  * (canvas.height / r.height);
    return positioned.find((n) =>
      Math.abs(x - n._x) <= NW / 2 && Math.abs(y - n._y) <= NH / 2
    ) || null;
  }

  canvas.addEventListener('mousemove', (e) => {
    const hit = pickNodeAt(e.clientX, e.clientY);
    canvas.style.cursor = hit ? 'pointer' : 'default';
    const nextHover = hit?.id || null;
    if (nextHover !== hoverId) { hoverId = nextHover; scheduleRedraw(); }
  });

  canvas.addEventListener('mouseleave', () => {
    if (hoverId !== null) { hoverId = null; scheduleRedraw(); }
  });

  canvas.addEventListener('click', (e) => {
    const hit = pickNodeAt(e.clientX, e.clientY);
    if (!hit) return;
    selectedId = hit.id;
    scheduleRedraw();
    onNodeClick(hit);
  });

  const unsubscribe = typeof character.subscribe === 'function'
    ? character.subscribe(scheduleRedraw) : null;

  redraw();

  return {
    redraw: scheduleRedraw,
    setSelected(id) {
      if (selectedId === id) return;
      selectedId = id;
      scheduleRedraw();
    },
    getSelected() { return selectedId; },
    destroy() {
      if (typeof unsubscribe === 'function') unsubscribe();
      wrap.remove();
    },
  };
}
