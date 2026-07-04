/**
 * Dice Rolling System
 *
 * Two layers:
 *   1. Pure functions — `rollDie`, `rollDice`, `rollExpression` — for any
 *      code that needs a number with no UI involvement.
 *   2. `promptRoll(...)` — the user-facing dialog. Per house rules, every
 *      roll in the system defaults to **manual input** (the player rolls
 *      physical dice and types the result); inside the dialog there is a
 *      one-prompt toggle to flip to auto-roll. This preference does NOT
 *      persist across calls.
 *
 * Supported expression grammar for `rollExpression`/`promptRoll`:
 *   <expr>   := <term> ( ('+' | '-') <term> )*
 *   <term>   := <dice> | <number>
 *   <dice>   := <count> 'd' <sides>      (count optional, defaults 1)
 *   examples: "d20", "1d20+5", "2d6-1", "1d4+1d6+2", "-1d4" (heals)
 */

import { createElement, on } from '../utils/dom.js';

const TERM_RE = /^(-?)(\d*)d(\d+)$/i;

// ── Low-level helpers (back-compatible exports) ─────────────

export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(count, sides) {
  const rolls = [];
  for (let i = 0; i < count; i++) rolls.push(rollDie(sides));
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) };
}

export function rollNotation(notation) {
  const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) throw new Error(`Invalid dice notation: ${notation}`);
  const [, countStr, sidesStr, modStr] = match;
  const count = parseInt(countStr, 10);
  const sides = parseInt(sidesStr, 10);
  const modifier = modStr ? parseInt(modStr, 10) : 0;
  const { rolls, total } = rollDice(count, sides);
  return { rolls, modifier, total: total + modifier };
}

export function rollAdvantage(sides = 20) { return Math.max(rollDie(sides), rollDie(sides)); }
export function rollDisadvantage(sides = 20) { return Math.min(rollDie(sides), rollDie(sides)); }

// ── Expression parser & evaluator ───────────────────────────

/**
 * Parse a dice expression into normalised terms.
 * @returns {Array<{ kind: 'dice'|'flat', sign: 1|-1, count?: number, sides?: number, value?: number }>}
 */
export function parseExpression(expression) {
  if (typeof expression !== 'string' || !expression.trim()) return [];
  const cleaned = expression.replace(/\s+/g, '');
  const tokens = cleaned.match(/[+-]?[^+-]+/g) || [];
  return tokens.map((token) => {
    const sign = token.startsWith('-') ? -1 : 1;
    const body = token.replace(/^[+-]/, '');
    const diceMatch = body.match(TERM_RE);
    if (diceMatch) {
      const count = Math.max(1, Number.parseInt(diceMatch[2] || '1', 10));
      const sides = Math.max(1, Number.parseInt(diceMatch[3], 10));
      return { kind: 'dice', sign, count, sides };
    }
    const flat = Number.parseInt(body, 10);
    if (Number.isFinite(flat)) return { kind: 'flat', sign, value: flat };
    return null;
  }).filter(Boolean);
}

/**
 * Evaluate a dice expression. Each `dXX` term is rolled `count` times and
 * summed. Returns the total + a per-term breakdown for display.
 */
export function rollExpression(expression) {
  const terms = parseExpression(expression);
  if (terms.length === 0) return { total: 0, breakdown: [] };
  let total = 0;
  const breakdown = [];
  terms.forEach((term) => {
    if (term.kind === 'flat') {
      const value = term.sign * term.value;
      total += value;
      breakdown.push({ kind: 'flat', text: `${term.sign < 0 ? '-' : '+'}${term.value}`, value });
    } else {
      const rolls = [];
      let sum = 0;
      for (let i = 0; i < term.count; i++) {
        const r = rollDie(term.sides);
        rolls.push(r);
        sum += r;
      }
      const signed = term.sign * sum;
      total += signed;
      breakdown.push({
        kind: 'dice',
        text: `${term.sign < 0 ? '-' : ''}${term.count}d${term.sides} → ${rolls.join('+')} = ${sum}`,
        rolls,
        sum,
        value: signed,
      });
    }
  });
  return { total, breakdown };
}

// ── RollDialog ──────────────────────────────────────────────

/**
 * Prompt the user for a roll result. Default mode is **manual** — the user
 * types in what they rolled physically. The "🎲 Rodar" button flips to
 * auto-roll mode for that single prompt (preference not persisted).
 *
 * @param {object} opts
 * @param {string} opts.title       — short heading (e.g. "Iniciativa — Aang")
 * @param {string} opts.expression  — dice expression suggestion (e.g. "1d20+5")
 * @param {string} [opts.helper]    — extra explanation shown under the title
 * @returns {Promise<{ total: number, mode: 'manual'|'auto', breakdown?: array }|null>}
 *   resolves with the entered/auto-rolled value, or null if cancelled.
 */
export function promptRoll({ title, expression, helper }) {
  return new Promise((resolve) => {
    const overlay = createElement('div', { class: 'modal-overlay roll-dialog-overlay' });
    const box = createElement('div', { class: 'modal-box roll-dialog-box' });

    box.appendChild(createElement('h2', { class: 'modal-title', textContent: title || 'Lançar dados' }));
    box.appendChild(createElement('p', {
      class: 'roll-expression',
      textContent: `Expressão: ${expression || '—'}`,
    }));
    if (helper) box.appendChild(createElement('p', { class: 'modal-helper', textContent: helper }));

    // Mode toggle. Manual is the default; the user can flip per-prompt.
    const modeRow = createElement('div', { class: 'roll-mode-row' });
    const manualBtn = createElement('button', { type: 'button', class: 'roll-mode-btn on', textContent: '⌨ Manual' });
    const autoBtn   = createElement('button', { type: 'button', class: 'roll-mode-btn', textContent: '🎲 Rodar' });
    modeRow.append(manualBtn, autoBtn);
    box.appendChild(modeRow);

    const inputWrap = createElement('div', { class: 'roll-input-wrap' });
    const input = createElement('input', {
      type: 'number',
      class: 'field-input',
      placeholder: 'Resultado',
      autocomplete: 'off',
    });
    inputWrap.appendChild(input);
    box.appendChild(inputWrap);

    const breakdownEl = createElement('div', { class: 'roll-breakdown', hidden: true });
    box.appendChild(breakdownEl);

    const actions = createElement('div', { class: 'modal-actions' });
    const cancel = createElement('button', { type: 'button', class: 'modal-btn modal-btn-cancel', textContent: 'Cancelar' });
    const confirm = createElement('button', { type: 'button', class: 'modal-btn modal-btn-confirm', textContent: 'Confirmar' });
    actions.append(cancel, confirm);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    let mode = 'manual';
    let lastAutoBreakdown = null;

    function close(value) {
      overlay.remove();
      resolve(value);
    }

    on(cancel, 'click', () => close(null));
    on(overlay, 'click', (e) => { if (e.target === overlay) close(null); });

    on(manualBtn, 'click', () => {
      mode = 'manual';
      manualBtn.classList.add('on'); autoBtn.classList.remove('on');
      breakdownEl.hidden = true;
      input.focus();
    });

    on(autoBtn, 'click', () => {
      mode = 'auto';
      autoBtn.classList.add('on'); manualBtn.classList.remove('on');
      // Roll and pre-fill the input — user still sees / can override.
      const res = rollExpression(expression || '');
      lastAutoBreakdown = res.breakdown;
      input.value = String(res.total);
      breakdownEl.hidden = false;
      breakdownEl.innerHTML = '';
      res.breakdown.forEach((b) => {
        breakdownEl.appendChild(createElement('div', { class: `roll-term ${b.kind}`, textContent: b.text }));
      });
      breakdownEl.appendChild(createElement('div', { class: 'roll-total', textContent: `Total: ${res.total}` }));
    });

    on(confirm, 'click', () => {
      const num = Number(input.value);
      if (!Number.isFinite(num)) {
        input.focus();
        return;
      }
      close({ total: num, mode, breakdown: mode === 'auto' ? lastAutoBreakdown : null });
    });

    on(input, 'keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirm.click(); }
    });

    requestAnimationFrame(() => input.focus());
  });
}
