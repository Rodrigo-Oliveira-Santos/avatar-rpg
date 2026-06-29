/**
 * D&D — Inventário simples (texto-grid) + ouro + features/traits.
 */

import { createElement, on } from '../../../utils/dom.js';
import { loadPack } from '../dnd-import.js';

export function renderInventoryPage(char, ctx) {
  const wrap = createElement('div');

  // ── Ouro ─────────────────────────────────────────────────
  const gold = createElement('div', { class: 'dnd-section' });
  gold.appendChild(createElement('h3', { textContent: 'Ouro' }));
  const goldRow = createElement('div', { class: 'dnd-hp-controls' });
  const goldVal = createElement('div', {
    textContent: `${char.gold} PO`,
    style: 'flex:1;font-size:18px;font-weight:700;color:gold;align-self:center;padding:0 8px',
  });
  goldRow.appendChild(goldVal);
  [-10, -1, +1, +10].forEach((d) => {
    if (!ctx.canEditGold && d > 0) return; // só o GM dá ouro
    const b = createElement('button', { class: 'dnd-btn', textContent: d > 0 ? `+${d}` : String(d) });
    on(b, 'click', () => { char.addGold(d); ctx.requestRender?.(); });
    goldRow.appendChild(b);
  });
  gold.appendChild(goldRow);
  if (!ctx.canEditGold) {
    gold.appendChild(createElement('div', {
      style: 'font-size:10px;color:var(--text3,#777);margin-top:6px',
      textContent: 'Ganhar ouro está restrito ao GM.',
    }));
  }
  wrap.appendChild(gold);

  // ── Inventário ───────────────────────────────────────────
  const inv = createElement('div', { class: 'dnd-section' });
  const head = createElement('h3', { textContent: 'Inventário' });
  inv.appendChild(head);

  const headerRow = createElement('div', {
    class: 'dnd-inv-row',
    style: 'background:transparent;font-size:9px;text-transform:uppercase;color:var(--text2,#aaa);letter-spacing:.05em',
  });
  ['Nome', 'Qtd', 'Peso', 'Notas', ''].forEach((l) => headerRow.appendChild(createElement('div', { textContent: l })));
  inv.appendChild(headerRow);

  const list = createElement('div', { class: 'dnd-inv-list' });

  const renderList = () => {
    list.innerHTML = '';
    char.inventory.forEach((it, idx) => {
      const row = createElement('div', { class: 'dnd-inv-row' });

      const name = createElement('input', { type: 'text', value: it.name || '' });
      on(name, 'change', () => { it.name = name.value; ctx.touch?.(); });
      row.appendChild(name);

      const qty = createElement('input', { type: 'number', value: String(it.qty ?? 1), min: '0' });
      on(qty, 'change', () => { it.qty = Math.max(0, parseInt(qty.value, 10) || 0); ctx.touch?.(); });
      row.appendChild(qty);

      const weight = createElement('input', { type: 'number', step: '0.1', value: String(it.weight ?? 0), min: '0' });
      on(weight, 'change', () => { it.weight = Math.max(0, parseFloat(weight.value) || 0); ctx.touch?.(); });
      row.appendChild(weight);

      const notes = createElement('input', { type: 'text', value: it.notes || '' });
      on(notes, 'change', () => { it.notes = notes.value; ctx.touch?.(); });
      row.appendChild(notes);

      const del = createElement('button', { class: 'dnd-btn danger', textContent: '✕' });
      on(del, 'click', () => { char.inventory.splice(idx, 1); ctx.requestRender?.(); });
      row.appendChild(del);

      list.appendChild(row);
    });
  };
  renderList();
  inv.appendChild(list);

  const addRow = createElement('div', { style: 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap' });
  const addBtn = createElement('button', {
    class: 'dnd-btn primary',
    textContent: '+ Adicionar item',
  });
  on(addBtn, 'click', () => {
    char.inventory.push({ name: '', qty: 1, weight: 0, notes: '' });
    ctx.requestRender?.();
  });
  addRow.appendChild(addBtn);

  // Sugestão de itens mágicos importados
  const magic = loadPack('magic_items');
  if (magic.length) {
    const magicSel = createElement('select');
    magicSel.appendChild(createElement('option', { value: '', textContent: `+ Item mágico (${magic.length} no catálogo)` }));
    magic.forEach((mi, i) => {
      const lbl = mi.rarity ? `${mi.name} [${mi.rarity}]` : mi.name;
      magicSel.appendChild(createElement('option', { value: String(i), textContent: lbl }));
    });
    magicSel.style.cssText = 'background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:6px 8px;font-size:12px;color:var(--text);font-family:inherit';
    on(magicSel, 'change', () => {
      const i = parseInt(magicSel.value, 10);
      if (!Number.isFinite(i)) return;
      const mi = magic[i];
      char.inventory.push({
        name: mi.name,
        qty: 1,
        weight: Number(mi.weight) || 0,
        notes: [mi.rarity, mi.requires_attunement ? 'requer attunement' : '', mi.description]
          .filter(Boolean).join(' — '),
      });
      magicSel.value = '';
      ctx.requestRender?.();
    });
    addRow.appendChild(magicSel);
  }
  inv.appendChild(addRow);

  // Peso total
  const total = char.inventory.reduce((sum, it) => sum + (Number(it.weight) || 0) * (Number(it.qty) || 0), 0);
  inv.appendChild(createElement('div', {
    style: 'margin-top:6px;font-size:11px;color:var(--text2,#aaa)',
    textContent: `Peso total transportado: ${total.toFixed(1)} lb`,
  }));
  wrap.appendChild(inv);

  // ── Features / Traits ────────────────────────────────────
  const feats = createElement('div', { class: 'dnd-section' });
  feats.appendChild(createElement('h3', { textContent: 'Features & Traits' }));
  const featsTa = createElement('textarea', { rows: 8 });
  featsTa.style.width = '100%';
  featsTa.style.background = 'var(--bg, #0d0d0d)';
  featsTa.style.border = '1px solid var(--border, #333)';
  featsTa.style.borderRadius = '4px';
  featsTa.style.padding = '8px';
  featsTa.style.fontSize = '12px';
  featsTa.style.color = 'var(--text, #eee)';
  featsTa.style.fontFamily = 'inherit';
  const featsText = Array.isArray(char.features) ? char.features.map((f) =>
    typeof f === 'string' ? f : `${f.name || ''}${f.description ? ': ' + f.description : ''}`).join('\n') : '';
  featsTa.value = featsText;
  featsTa.placeholder = 'Rage (Bárbaro 1): bónus de dano…\nDarkvision: 60 ft…';
  on(featsTa, 'change', () => {
    char.features = featsTa.value.split('\n').map((s) => s.trim()).filter(Boolean);
    ctx.touch?.();
  });
  feats.appendChild(featsTa);
  wrap.appendChild(feats);

  return wrap;
}
