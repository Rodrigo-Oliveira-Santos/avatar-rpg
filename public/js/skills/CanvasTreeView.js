/**
 * Canvas-based skill tree view.
 *
 * Replicates the layout from `docs/*_skill_tree.html` using the
 * `branch`, `tier`, `position.column` data we already carry per skill.
 * Renders nodes coloured by branch + tier, dependency lines (solid =
 * same branch, dashed = cross-branch) and reacts to clicks by calling
 * the SkillTree's toggleSkill flow (which handles requirements + path
 * picking).
 */

import { createElement } from '../utils/dom.js';

const NW = 92, NH = 38;          // node size
const HGAP = 22, VGAP = 110;     // gaps between columns / tiers
const MT = 56, ML = 60;          // top + left margin
const LEX = 80;                  // extra gap before the Legendary tier (T5)
const BGAP = 60;                 // gap between branch groups
const CW = NW + HGAP;

const TIER_LABELS = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Lendário'];

const BRANCH_COLORS = {
  sp: { fill: '#1e1a40', stroke: '#7F77DD', text: '#EEEDFE', light: '#7F77DD', label: 'ESPIRITUALIDADE' },
  ag: { fill: '#0a2e20', stroke: '#1D9E75', text: '#E1F5EE', light: '#1D9E75', label: 'AGILIDADE' },
  cb: { fill: '#3a2006', stroke: '#D88840', text: '#FAEEDA', light: '#D88840', label: 'COMBATE PARTILHADO' },
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
  // tiers 1..4 stack normally; tier 5 (legendary) gets extra padding.
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

function drawBackground(ctx, w, h) {
  ctx.fillStyle = '#0d0d0f';
  ctx.fillRect(0, 0, w, h);
  // Tier bands
  for (let t = 0; t < 5; t++) {
    const y0 = t === 0 ? 0 : tierY(t) - NH / 2 - VGAP / 2;
    const y1 = t === 4 ? h : tierY(t + 1) - NH / 2 - VGAP / 2;
    ctx.fillStyle = t % 2 === 0 ? '#0d0d0f' : '#111118';
    ctx.fillRect(0, y0, w, y1 - y0);
    ctx.fillStyle = t === 4 ? '#BA7517' : '#2a2a38';
    ctx.font = '700 9px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(TIER_LABELS[t].toUpperCase(), 8, (y0 + y1) / 2 + 4);
  }
}

function drawEdge(ctx, a, b) {
  if (!a || !b) return;
  const colors = branchColor(a);
  const dash = a.branch !== b.branch;
  const ax = a._x;
  const ay = a._y + NH / 2 + 2;
  const bx = b._x;
  const by = b._y - NH / 2 - 2;
  const my = ay + (by - ay) * 0.5;
  ctx.save();
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 1.3;
  ctx.globalAlpha = dash ? 0.25 : 0.42;
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
  if (state.active) {
    ctx.shadowColor = c.light;
    ctx.shadowBlur = 12;
  }
  roundRect(ctx, x, y, NW, NH, 5);

  // Fill
  if (state.active)          ctx.fillStyle = c.fill;
  else if (state.unlockable) ctx.fillStyle = c.fill + '99';
  else                       ctx.fillStyle = '#0d0d0f';
  ctx.fill();

  // Border
  if (state.active) {
    ctx.strokeStyle = c.light; ctx.lineWidth = 2;
  } else if (state.unlockable) {
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
  } else {
    ctx.strokeStyle = '#252530'; ctx.lineWidth = 1; ctx.globalAlpha = 0.35;
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Mastery dots (3 dots — lit per mastery level)
  if (state.active && Array.isArray(node.mastery_levels)) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(node._x + NW / 2 - 8 - i * 8, node._y + NH / 2 - 5, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i < state.masteryLevel ? '#EF9F27' : '#252530';
      ctx.fill();
    }
  }

  // Lock icon
  if (!state.active && !state.unlockable) {
    ctx.font = "10px 'Segoe UI'";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3a3a48';
    ctx.globalAlpha = 0.3;
    ctx.fillText('🔒', node._x, node._y + 4);
    ctx.globalAlpha = 1;
  }

  // Name (wrap on space)
  const text = (node.name || '').split(/\s+/);
  ctx.fillStyle = state.unlockable || state.active ? c.text : '#2e2e3a';
  ctx.globalAlpha = (state.active || state.unlockable) ? 1 : 0.45;
  ctx.textAlign = 'center';
  ctx.font = "500 9px 'Segoe UI', system-ui, sans-serif";
  if (text.length <= 1) {
    ctx.fillText(text[0] || '', node._x, node._y + 3);
  } else {
    const mid = Math.ceil(text.length / 2);
    ctx.fillText(text.slice(0, mid).join(' '), node._x, node._y - 4);
    ctx.fillText(text.slice(mid).join(' '),  node._x, node._y + 7);
  }
  ctx.restore();
}

/**
 * Mount the canvas tree into `container`. Returns a `destroy()` function.
 */
export function mountCanvasTree({ container, skills, character, onNodeClick }) {
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

  function computeState(node) {
    const charSkills = character.getData().habilidades || {};
    const active = !!charSkills[node.id]?.active;
    const depsMet = (node.prerequisites || []).every((id) => !!charSkills[id]?.active);
    const masteryLevel = typeof character.getMasteryLevel === 'function'
      ? character.getMasteryLevel(node.id)
      : 0;
    // Attribute requirements (simple check)
    const attrs = character.getData().atributos || {};
    const attrOk = Object.entries(node.attribute_requirements || {})
      .every(([k, v]) => (attrs[k] || 0) >= v);
    return { active, unlockable: depsMet && attrOk, masteryLevel };
  }

  function redraw() {
    drawBackground(ctx, width, height);
    // Edges first
    positioned.forEach((n) => {
      (n.prerequisites || []).forEach((depId) => {
        const a = idIndex.get(depId);
        if (a) drawEdge(ctx, a, n);
      });
    });
    // Nodes
    positioned.forEach((n) => drawNode(ctx, n, computeState(n)));
  }

  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top)  * (canvas.height / rect.height);
    const hit = positioned.find((n) =>
      Math.abs(x - n._x) <= NW / 2 && Math.abs(y - n._y) <= NH / 2
    );
    if (hit) onNodeClick(hit);
  });

  const unsubscribe = character.subscribe ? character.subscribe(redraw) : null;
  redraw();

  return {
    destroy() {
      if (typeof unsubscribe === 'function') unsubscribe();
      wrap.remove();
    },
    redraw,
  };
}
