/**
 * D&D — Magias: spell slots por nível + ataque/DC + lista de magias.
 */

import { createElement, on } from '../../../utils/dom.js';
import { ABILITIES, ABILITY_NAMES, CLASSES } from '../data/srd.js';
import { loadPack } from '../dnd-import.js';

export function renderSpellsPage(char, ctx) {
  const wrap = createElement('div');

  // ── Ability + DC + Atk ───────────────────────────────────
  const top = createElement('div', { class: 'dnd-section' });
  top.appendChild(createElement('h3', { textContent: 'Conjuração' }));
  const grid = createElement('div', { class: 'dnd-field-grid' });

  const abField = createElement('div', { class: 'dnd-field' });
  abField.appendChild(createElement('label', { textContent: 'Atributo de magia' }));
  const sel = createElement('select');
  [['', '— Nenhum —'], ...ABILITIES.map((a) => [a, `${ABILITY_NAMES[a]} (${a})`])].forEach(([v, lbl]) => {
    const o = createElement('option', { value: v, textContent: lbl });
    if (v === (char.spells.cast_ability || '')) o.selected = true;
    sel.appendChild(o);
  });
  on(sel, 'change', () => { char.spells.cast_ability = sel.value; ctx.requestRender?.(); });
  abField.appendChild(sel);
  grid.appendChild(abField);

  grid.appendChild(readonlyField('DC de Magia', char.spellDC() == null ? '—' : String(char.spellDC())));
  grid.appendChild(readonlyField('Ataque Mágico', char.spellAttack() == null ? '—' : formatMod(char.spellAttack())));
  top.appendChild(grid);
  wrap.appendChild(top);

  // ── Spell slots ──────────────────────────────────────────
  const slotsSec = createElement('div', { class: 'dnd-section' });
  slotsSec.appendChild(createElement('h3', { textContent: 'Espaços de Magia' }));
  const slotsGrid = createElement('div', { class: 'dnd-slots-grid' });
  for (let lvl = 1; lvl <= 9; lvl++) {
    const slot = char.spells.slots[lvl] || { max: 0, used: 0 };
    const card = createElement('div', { class: 'dnd-slot' });
    card.appendChild(createElement('div', { class: 'lvl', textContent: `Nv ${lvl}` }));
    card.appendChild(createElement('div', { class: 'counts', textContent: `${slot.max - slot.used}/${slot.max}` }));
    const controls = createElement('div', { class: 'controls' });
    const minus = createElement('button', { textContent: '−' });
    const plus = createElement('button', { textContent: '+' });
    on(minus, 'click', () => {
      slot.used = Math.max(0, slot.used - 1);
      char.spells.slots[lvl] = slot;
      ctx.requestRender?.();
    });
    on(plus, 'click', () => {
      slot.used = Math.min(slot.max, slot.used + 1);
      char.spells.slots[lvl] = slot;
      ctx.requestRender?.();
    });
    controls.appendChild(minus);
    controls.appendChild(plus);
    card.appendChild(controls);
    // setter de max
    const maxInput = createElement('input', {
      type: 'number', min: '0', max: '9', value: String(slot.max),
      style: 'margin-top:4px;width:40px;padding:2px;font-size:10px;text-align:center;background:var(--bg);border:1px solid var(--border);border-radius:3px;color:var(--text)',
    });
    on(maxInput, 'change', () => {
      const v = Math.max(0, Math.min(9, parseInt(maxInput.value, 10) || 0));
      slot.max = v; if (slot.used > v) slot.used = v;
      char.spells.slots[lvl] = slot;
      ctx.requestRender?.();
    });
    card.appendChild(maxInput);
    slotsGrid.appendChild(card);
  }
  slotsSec.appendChild(slotsGrid);
  wrap.appendChild(slotsSec);

  // ── Magias importadas (picker) ────────────────────────────
  const imported = loadPack('spells');
  if (imported.length) {
    const pickerSec = createElement('div', { class: 'dnd-section' });
    pickerSec.appendChild(createElement('h3', { textContent: `Catálogo Importado (${imported.length})` }));

    const pickerBar = createElement('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px' });
    const search = createElement('input', { type: 'text', placeholder: 'Procurar magia…' });
    search.style.cssText = 'flex:1;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:5px 8px;font-size:12px;color:var(--text)';
    const lvlSel = createElement('select');
    [['', 'Qualquer nível'], ...[0,1,2,3,4,5,6,7,8,9].map((l) => [String(l), l === 0 ? 'Cantrip' : `Nv ${l}`])]
      .forEach(([v, lbl]) => lvlSel.appendChild(createElement('option', { value: v, textContent: lbl })));
    lvlSel.style.cssText = 'background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:5px 8px;font-size:12px;color:var(--text)';
    const clsSel = createElement('select');
    clsSel.appendChild(createElement('option', { value: '', textContent: 'Qualquer classe' }));
    CLASSES.filter((c) => c.spell_ability).forEach((c) => clsSel.appendChild(createElement('option', { value: c.id, textContent: c.label })));
    clsSel.style.cssText = lvlSel.style.cssText;

    pickerBar.appendChild(search);
    pickerBar.appendChild(lvlSel);
    pickerBar.appendChild(clsSel);
    pickerSec.appendChild(pickerBar);

    const resultList = createElement('div', {
      style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px;max-height:240px;overflow-y:auto;padding:4px;border:1px solid var(--border);border-radius:4px',
    });
    pickerSec.appendChild(resultList);

    const renderResults = () => {
      resultList.innerHTML = '';
      const q = search.value.trim().toLowerCase();
      const lv = lvlSel.value;
      const cls = clsSel.value;
      const filtered = imported.filter((sp) => {
        if (q && !(sp.name || '').toLowerCase().includes(q)) return false;
        if (lv !== '' && Number(sp.level) !== Number(lv)) return false;
        if (cls && Array.isArray(sp.classes) && !sp.classes.includes(cls)) return false;
        return true;
      });
      filtered.slice(0, 200).forEach((sp) => {
        const card = createElement('div', {
          style: 'background:rgba(255,255,255,0.02);border:1px solid var(--border,#333);border-radius:4px;padding:4px 6px;display:flex;justify-content:space-between;align-items:center;gap:4px',
        });
        const info = createElement('div', { style: 'min-width:0' });
        info.appendChild(createElement('div', {
          textContent: sp.name,
          style: 'font-size:11px;font-weight:700;color:var(--text,#eee);white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
        }));
        info.appendChild(createElement('div', {
          textContent: `${sp.level === 0 ? 'Cantrip' : 'Nv ' + sp.level}${sp.school ? ' · ' + sp.school : ''}`,
          style: 'font-size:9px;color:var(--text2,#aaa);text-transform:capitalize',
        }));
        card.appendChild(info);

        const add = createElement('button', { class: 'dnd-btn', textContent: '+', style: 'padding:2px 6px;font-size:11px' });
        on(add, 'click', () => {
          const line = sp.level === 0 ? `${sp.name} (Cantrip)` : `${sp.name} (Nv ${sp.level})`;
          if (!char.spells.known.includes(line)) {
            char.spells.known.push(line);
            ctx.requestRender?.();
          }
        });
        card.appendChild(add);

        resultList.appendChild(card);
      });
      if (!filtered.length) {
        resultList.appendChild(createElement('div', {
          style: 'grid-column:1/-1;text-align:center;font-size:11px;color:var(--text3,#777);padding:12px',
          textContent: 'Sem resultados.',
        }));
      }
    };
    on(search, 'input', renderResults);
    on(lvlSel, 'change', renderResults);
    on(clsSel, 'change', renderResults);
    renderResults();
    wrap.appendChild(pickerSec);
  }

  // ── Magias conhecidas / preparadas (texto livre) ──────────
  const listSec = createElement('div', { class: 'dnd-section' });
  listSec.appendChild(createElement('h3', { textContent: 'Magias' }));
  const help = createElement('p', {
    style: 'font-size:11px;color:var(--text2,#aaa);margin:0 0 8px',
    textContent: 'Uma magia por linha. Usa "*" no início para marcar como preparada.',
  });
  listSec.appendChild(help);
  const ta = createElement('textarea', { rows: 12 });
  ta.style.width = '100%';
  ta.style.background = 'var(--bg, #0d0d0d)';
  ta.style.border = '1px solid var(--border, #333)';
  ta.style.borderRadius = '4px';
  ta.style.padding = '8px';
  ta.style.fontSize = '12px';
  ta.style.color = 'var(--text, #eee)';
  ta.style.fontFamily = 'inherit';
  ta.placeholder = '* Fireball (Nv 3)\n* Mage Hand (Cantrip)\nDetect Magic (Nv 1)\n...';
  // O modelo guarda known[] livre; reusamos como texto multilinha:
  const text = Array.isArray(char.spells.known) && char.spells.known.length
    ? char.spells.known.join('\n')
    : '';
  ta.value = text;
  on(ta, 'change', () => {
    const lines = ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
    char.spells.known = lines;
    char.spells.prepared = lines.filter((l) => l.startsWith('*')).map((l) => l.replace(/^\*\s*/, ''));
    ctx.touch?.();
  });
  listSec.appendChild(ta);
  wrap.appendChild(listSec);

  return wrap;
}

function readonlyField(label, value) {
  const wrap = createElement('div', { class: 'dnd-field' });
  wrap.appendChild(createElement('label', { textContent: label }));
  const v = createElement('div', {
    textContent: value,
    style: 'background:rgba(255,255,255,0.03);padding:5px 7px;font-size:13px;color:var(--dnd-accent);font-weight:700;border-radius:4px;text-align:center',
  });
  wrap.appendChild(v);
  return wrap;
}

function formatMod(n) {
  const v = Number(n) || 0;
  return v >= 0 ? `+${v}` : String(v);
}
