/**
 * D&D — Página de ficha principal (atributos, identidade, combate).
 *
 * Renderiza o layout em 2 colunas:
 *   • Esquerda: nível, XP, ouro, 6 atributos com modificador, saves rápidos.
 *   • Direita: identidade, stats de combate, equipamento simples, notas.
 *
 * Comunica com o resto da app por callbacks (`onChange`, `onSave`, `onTab`).
 * Não fala diretamente com a API — quem o faz é o `DnDApp` (index.js).
 */

import { createElement, on } from '../../../utils/dom.js';
import {
  ABILITIES, ABILITY_NAMES,
  RACES, CLASSES, BACKGROUNDS, ALIGNMENTS,
} from '../data/srd.js';
import { loadPack } from '../dnd-import.js';

export function renderCharacterPage(char, ctx) {
  const root = createElement('div', { class: 'dnd-two-col' });

  root.appendChild(renderAside(char, ctx));
  root.appendChild(renderMain(char, ctx));

  return root;
}

function renderAside(char, ctx) {
  const aside = createElement('aside', { class: 'dnd-aside' });

  // Nível
  const lvlRow = createElement('div', { class: 'dnd-level-row' });
  lvlRow.appendChild(createElement('div', { class: 'lv-num', textContent: String(char.level) }));
  lvlRow.appendChild(createElement('div', { class: 'lv-lbl', textContent: 'Nível' }));
  aside.appendChild(lvlRow);

  // Prof bonus + Iniciativa + Passive perception
  aside.appendChild(pill('Prof. Bonus', `+${char.prof}`));
  aside.appendChild(pill('Iniciativa', formatMod(char.initiative)));
  aside.appendChild(pill('Perc. Passiva', String(char.passivePerception)));
  aside.appendChild(pill('Ouro', String(char.gold)));

  // XP
  const xpWrap = createElement('div', { class: 'dnd-xp-wrap' });
  const xpHd = createElement('div', { class: 'dnd-xp-hd' });
  const xpProg = char.xpProgress();
  xpHd.appendChild(createElement('span', { textContent: 'XP' }));
  xpHd.appendChild(createElement('span', {
    textContent: xpProg.next === xpProg.current ? `${xpProg.current} (max)` : `${xpProg.current} / ${xpProg.next}`,
  }));
  xpWrap.appendChild(xpHd);
  const xpBg = createElement('div', { class: 'dnd-xp-bg' });
  const xpFill = createElement('div', { class: 'dnd-xp-fill' });
  xpFill.style.width = `${xpProg.pct}%`;
  xpBg.appendChild(xpFill);
  xpWrap.appendChild(xpBg);
  if (ctx.canEditXp) {
    const btn = createElement('button', { class: 'dnd-btn primary', textContent: '+ XP', style: 'margin-top:4px;width:100%' });
    on(btn, 'click', () => ctx.onAddXp?.());
    xpWrap.appendChild(btn);
  } else {
    xpWrap.appendChild(createElement('div', {
      style: 'font-size:9px;color:var(--text3,#777);margin-top:4px;text-align:center',
      textContent: 'XP atribuído pelo GM',
    }));
  }
  aside.appendChild(xpWrap);

  // Atributos
  aside.appendChild(createElement('div', { class: 'panel-title', textContent: 'Atributos' }));
  ABILITIES.forEach((ab) => {
    const row = createElement('div', { class: 'dnd-ability' });
    row.appendChild(createElement('div', { class: 'dnd-ability-lbl', textContent: ab }));
    const input = createElement('input', {
      type: 'number', class: 'dnd-ability-score',
      min: '1', max: '30',
      value: String(char.abilities[ab] ?? 10),
    });
    on(input, 'change', () => {
      const v = Math.max(1, Math.min(30, parseInt(input.value, 10) || 10));
      char.abilities[ab] = v;
      input.value = String(v);
      ctx.requestRender?.();
    });
    row.appendChild(input);
    row.appendChild(createElement('div', {
      class: 'dnd-ability-mod',
      textContent: formatMod(char.mod(ab)),
      title: `${ABILITY_NAMES[ab]} modifier`,
    }));
    aside.appendChild(row);
  });

  return aside;
}

function renderMain(char, ctx) {
  const main = createElement('section');

  // ── Identidade ────────────────────────────────────────
  const idSec = createElement('div', { class: 'dnd-section' });
  idSec.appendChild(createElement('h3', { textContent: 'Identidade' }));
  const grid = createElement('div', { class: 'dnd-field-grid' });
  // Raças = SRD built-in + packs importados
  const importedRaces = loadPack('races').map((r) => r.name).filter(Boolean);
  const allRaces = ['', ...new Set([...RACES, ...importedRaces])];
  grid.appendChild(textField('Nome', char.identity.name, (v) => { char.identity.name = v; ctx.touch?.(); }));
  grid.appendChild(selectField('Raça', char.identity.race, allRaces, (v) => { char.identity.race = v; ctx.touch?.(); }));
  grid.appendChild(selectField('Background', char.identity.background, ['', ...BACKGROUNDS], (v) => { char.identity.background = v; ctx.touch?.(); }));
  grid.appendChild(selectField('Alinhamento', char.identity.alignment, ['', ...ALIGNMENTS], (v) => { char.identity.alignment = v; ctx.touch?.(); }));
  grid.appendChild(textField('Idade', char.identity.age, (v) => { char.identity.age = v; ctx.touch?.(); }));
  grid.appendChild(textField('Género', char.identity.gender, (v) => { char.identity.gender = v; ctx.touch?.(); }));
  idSec.appendChild(grid);
  main.appendChild(idSec);

  // ── Classes (multiclass) ──────────────────────────────────
  const classSec = createElement('div', { class: 'dnd-section' });
  classSec.appendChild(createElement('h3', {
    textContent: `Classes (Nível total ${char.level})`,
  }));
  classSec.appendChild(createElement('p', {
    style: 'font-size:11px;color:var(--text2,#aaa);margin:0 0 8px',
    textContent: 'Adiciona múltiplas classes para multiclass. O nível total é a soma; o prof bonus calcula a partir desse total.',
  }));

  const classList = createElement('div', { class: 'dnd-row-list', style: 'grid-template-columns:1fr' });
  if (!char.classes.length) {
    classList.appendChild(createElement('div', {
      style: 'font-size:11px;color:var(--text3,#777);padding:4px',
      textContent: 'Sem classes — adiciona a primeira abaixo.',
    }));
  }
  char.classes.forEach((entry, idx) => {
    const row = createElement('div', {
      class: 'dnd-row-item',
      style: 'grid-template-columns:1.2fr 1fr 60px 30px',
    });
    // Class select
    const clsSel = createElement('select');
    clsSel.appendChild(createElement('option', { value: '', textContent: '— Classe —' }));
    CLASSES.forEach((c) => {
      const o = createElement('option', { value: c.id, textContent: c.label });
      if (c.id === entry.class) o.selected = true;
      clsSel.appendChild(o);
    });
    on(clsSel, 'change', () => {
      const cl = CLASSES.find((c) => c.id === clsSel.value);
      char.updateClassAt(idx, { class: clsSel.value });
      if (cl?.spell_ability && !char.spells.cast_ability) char.spells.cast_ability = cl.spell_ability;
      ctx.requestRender?.();
    });
    row.appendChild(clsSel);

    // Subclass — usa text input, mas se houver pack importado, mostra datalist
    const importedSubs = loadPack('subclasses').filter((s) => !entry.class || s.class === entry.class);
    const listId = `dnd-subs-${idx}`;
    const sub = createElement('input', {
      type: 'text', value: entry.subclass || '', placeholder: 'Subclasse (opcional)',
    });
    if (importedSubs.length) {
      sub.setAttribute('list', listId);
      const dl = createElement('datalist', { id: listId });
      importedSubs.forEach((s) => dl.appendChild(createElement('option', { value: s.name })));
      row.appendChild(dl);
    }
    on(sub, 'change', () => { char.updateClassAt(idx, { subclass: sub.value }); ctx.requestRender?.(); });
    row.appendChild(sub);

    // Level
    const lvl = createElement('input', { type: 'number', min: '1', max: '20', value: String(entry.level || 1), style: 'text-align:center' });
    on(lvl, 'change', () => {
      const v = parseInt(lvl.value, 10);
      char.updateClassAt(idx, { level: Number.isFinite(v) ? v : 1 });
      ctx.requestRender?.();
    });
    row.appendChild(lvl);

    // Remove
    const del = createElement('button', { class: 'dnd-btn danger', textContent: '✕', style: 'padding:2px 6px' });
    on(del, 'click', () => { char.removeClassAt(idx); ctx.requestRender?.(); });
    row.appendChild(del);

    classList.appendChild(row);
  });
  classSec.appendChild(classList);

  const addCls = createElement('button', {
    class: 'dnd-btn primary',
    textContent: '+ Adicionar classe',
    style: 'margin-top:8px',
  });
  on(addCls, 'click', () => {
    char.addClass('', 1, '');
    ctx.requestRender?.();
  });
  classSec.appendChild(addCls);
  main.appendChild(classSec);

  // ── Combate ────────────────────────────────────────────
  const combatSec = createElement('div', { class: 'dnd-section' });
  combatSec.appendChild(createElement('h3', { textContent: 'Stats de Combate' }));
  const cgrid = createElement('div', { class: 'dnd-combat-grid' });
  cgrid.appendChild(combatCard('HP', `${char.combat.hp_current}`, `/ ${char.combat.hp_max}`));
  cgrid.appendChild(combatCard('CA', String(char.combat.ac), 'Classe de Armadura'));
  cgrid.appendChild(combatCard('Velocidade', String(char.combat.speed), 'pés'));
  cgrid.appendChild(combatCard('Iniciativa', formatMod(char.initiative), 'DEX mod'));
  const hd = char.combat.hit_dice_total - char.combat.hit_dice_used;
  cgrid.appendChild(combatCard('Hit Dice', `${hd}/${char.combat.hit_dice_total}`,
    `d${(CLASSES.find((c) => c.id === char.identity.class)?.hit_die) || '?'}`));
  cgrid.appendChild(combatCard('Temp HP', String(char.combat.hp_temp || 0), ''));
  combatSec.appendChild(cgrid);

  // Editores numéricos para max/AC/speed
  const editGrid = createElement('div', { class: 'dnd-field-grid', style: 'margin-top:8px' });
  editGrid.appendChild(numField('HP Máx', char.combat.hp_max, (v) => { char.combat.hp_max = v; ctx.requestRender?.(); }));
  editGrid.appendChild(numField('HP Atual', char.combat.hp_current, (v) => { char.setHp(v); ctx.requestRender?.(); }));
  editGrid.appendChild(numField('HP Temp', char.combat.hp_temp, (v) => { char.combat.hp_temp = Math.max(0, v); ctx.touch?.(); }));
  editGrid.appendChild(numField('CA', char.combat.ac, (v) => { char.combat.ac = v; ctx.touch?.(); }));
  editGrid.appendChild(numField('Velocidade', char.combat.speed, (v) => { char.combat.speed = v; ctx.touch?.(); }));
  editGrid.appendChild(numField('Hit Dice total', char.combat.hit_dice_total, (v) => { char.combat.hit_dice_total = Math.max(0, v); ctx.touch?.(); }));
  editGrid.appendChild(numField('Hit Dice usados', char.combat.hit_dice_used, (v) => { char.combat.hit_dice_used = Math.max(0, v); ctx.touch?.(); }));
  combatSec.appendChild(editGrid);

  // HP quick controls
  const hpCtrls = createElement('div', { class: 'dnd-hp-controls' });
  [-5, -1, +1, +5].forEach((d) => {
    const b = createElement('button', { class: 'dnd-btn', textContent: d > 0 ? `+${d}` : String(d) });
    on(b, 'click', () => { char.addHp(d); ctx.requestRender?.(); });
    hpCtrls.appendChild(b);
  });
  const maxBtn = createElement('button', { class: 'dnd-btn primary', textContent: 'MAX' });
  on(maxBtn, 'click', () => { char.hpToMax(); ctx.requestRender?.(); });
  hpCtrls.appendChild(maxBtn);
  combatSec.appendChild(hpCtrls);
  main.appendChild(combatSec);

  // ── Saves rápidos (sumário) ────────────────────────────
  const savesSec = createElement('div', { class: 'dnd-section' });
  savesSec.appendChild(createElement('h3', { textContent: 'Resistências (Saves)' }));
  const sgrid = createElement('div', { class: 'dnd-row-list' });
  ABILITIES.forEach((ab) => {
    const row = createElement('div', { class: 'dnd-row-item' });
    const cb = createElement('input', { type: 'checkbox' });
    cb.checked = !!char.saves[ab];
    on(cb, 'change', () => { char.saves[ab] = cb.checked; ctx.requestRender?.(); });
    row.appendChild(cb);
    const stack = createElement('div', { class: 'label-stack' });
    stack.appendChild(createElement('span', { textContent: ABILITY_NAMES[ab] }));
    stack.appendChild(createElement('span', { class: 'ab', textContent: ab }));
    row.appendChild(stack);
    row.appendChild(createElement('span', { class: 'bonus', textContent: formatMod(char.saveBonus(ab)) }));
    sgrid.appendChild(row);
  });
  savesSec.appendChild(sgrid);
  main.appendChild(savesSec);

  // ── Notas ──────────────────────────────────────────────
  const notesSec = createElement('div', { class: 'dnd-section' });
  notesSec.appendChild(createElement('h3', { textContent: 'Notas / História' }));
  const ta = createElement('textarea', { rows: 6 });
  ta.value = char.notes || '';
  ta.style.width = '100%';
  ta.style.background = 'var(--bg, #0d0d0d)';
  ta.style.border = '1px solid var(--border, #333)';
  ta.style.borderRadius = '4px';
  ta.style.padding = '8px';
  ta.style.fontSize = '12px';
  ta.style.color = 'var(--text, #eee)';
  ta.style.fontFamily = 'inherit';
  on(ta, 'change', () => { char.notes = ta.value; ctx.touch?.(); });
  notesSec.appendChild(ta);
  main.appendChild(notesSec);

  return main;
}

// ─── Helpers ────────────────────────────────────────────────────

function formatMod(n) {
  const v = Number(n) || 0;
  return v >= 0 ? `+${v}` : String(v);
}

function pill(label, value) {
  const el = createElement('div', { class: 'dnd-pill' });
  el.appendChild(createElement('span', { textContent: label }));
  el.appendChild(createElement('span', { class: 'v', textContent: value }));
  return el;
}

function textField(label, value, onChange) {
  const wrap = createElement('div', { class: 'dnd-field' });
  wrap.appendChild(createElement('label', { textContent: label }));
  const input = createElement('input', { type: 'text', value: value || '' });
  on(input, 'change', () => onChange(input.value));
  wrap.appendChild(input);
  return wrap;
}

function numField(label, value, onChange) {
  const wrap = createElement('div', { class: 'dnd-field' });
  wrap.appendChild(createElement('label', { textContent: label }));
  const input = createElement('input', { type: 'number', value: String(value ?? 0) });
  on(input, 'change', () => {
    const v = parseInt(input.value, 10);
    onChange(Number.isFinite(v) ? v : 0);
  });
  wrap.appendChild(input);
  return wrap;
}

function selectField(label, value, options, onChange) {
  const wrap = createElement('div', { class: 'dnd-field' });
  wrap.appendChild(createElement('label', { textContent: label }));
  const sel = createElement('select');
  options.forEach((opt) => {
    const [v, lbl] = Array.isArray(opt) ? opt : [opt, opt || '—'];
    const o = createElement('option', { value: v, textContent: lbl });
    if (v === value) o.selected = true;
    sel.appendChild(o);
  });
  on(sel, 'change', () => onChange(sel.value));
  wrap.appendChild(sel);
  return wrap;
}

function combatCard(label, val, max) {
  const card = createElement('div', { class: 'dnd-combat-card' });
  card.appendChild(createElement('div', { class: 'lbl', textContent: label }));
  card.appendChild(createElement('div', { class: 'val', textContent: val }));
  card.appendChild(createElement('div', { class: 'max', textContent: max }));
  return card;
}
