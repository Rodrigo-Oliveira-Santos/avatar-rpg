/**
 * D&D — Perícias (18 perícias com proficiência / expertise).
 */

import { createElement, on } from '../../../utils/dom.js';
import { SKILLS } from '../data/srd.js';

export function renderSkillsPage(char, ctx) {
  const sec = createElement('div', { class: 'dnd-section' });
  sec.appendChild(createElement('h3', { textContent: 'Perícias' }));

  const help = createElement('p', {
    style: 'font-size:11px;color:var(--text2,#aaa);margin:0 0 8px',
    textContent: 'Marca a caixa para proficiência. Para expertise (Ladino/Bardo), marca duas vezes — fica a verde.',
  });
  sec.appendChild(help);

  const list = createElement('div', { class: 'dnd-row-list' });

  SKILLS.forEach((sk) => {
    const entry = char.skills[sk.id] || { prof: false, expertise: false };
    const row = createElement('div', { class: 'dnd-row-item' });

    const cb = createElement('input', { type: 'checkbox' });
    cb.checked = !!entry.prof;
    on(cb, 'change', () => {
      entry.prof = cb.checked;
      if (!cb.checked) entry.expertise = false;
      char.skills[sk.id] = entry;
      ctx.requestRender?.();
    });
    row.appendChild(cb);

    const stack = createElement('div', { class: 'label-stack' });
    stack.appendChild(createElement('span', { textContent: sk.label }));
    const abEl = createElement('span', { class: 'ab', textContent: sk.ability });
    stack.appendChild(abEl);
    // double-click no nome → toggle expertise
    on(stack, 'dblclick', () => {
      if (!entry.prof) return; // expertise só com prof
      entry.expertise = !entry.expertise;
      char.skills[sk.id] = entry;
      ctx.requestRender?.();
    });
    stack.title = 'Duplo-clique no nome para alternar Expertise (×2)';
    if (entry.expertise) stack.style.color = '#22c55e';
    row.appendChild(stack);

    row.appendChild(createElement('span', {
      class: 'bonus',
      textContent: formatMod(char.skillBonus(sk.id)),
      style: entry.expertise ? 'color:#22c55e' : '',
    }));

    list.appendChild(row);
  });

  sec.appendChild(list);
  return sec;
}

function formatMod(n) {
  const v = Number(n) || 0;
  return v >= 0 ? `+${v}` : String(v);
}
