/**
 * D&D — Página de Importação (GM/Admin only).
 *
 * Permite carregar JSON para 4 domínios: spells, subclasses, magic
 * items, races. Mostra preview com erros de validação antes de
 * confirmar a substituição do pack atual.
 */

import { createElement, on } from '../../../utils/dom.js';
import { toast, confirmDialog } from '../../../utils/toast.js';
import {
  DOMAINS, DOMAIN_LABELS,
  validatePack, savePack, clearPack, loadPack, packStats,
} from '../dnd-import.js';

const SAMPLES = {
  spells: `[
  { "name": "Fireball", "level": 3, "school": "evocation", "classes": ["wizard","sorcerer"] },
  { "name": "Cure Wounds", "level": 1, "school": "evocation", "classes": ["cleric","druid","bard","paladin","ranger"] }
]`,
  subclasses: `[
  { "name": "School of Evocation", "class": "wizard", "features": ["Evocation Savant", "Sculpt Spells"] },
  { "name": "Champion", "class": "fighter", "features": ["Improved Critical"] }
]`,
  magic_items: `[
  { "name": "Bag of Holding", "rarity": "uncommon", "requires_attunement": false, "description": "Espaço extradimensional." },
  { "name": "Vorpal Sword", "rarity": "legendary", "requires_attunement": true }
]`,
  races: `[
  { "name": "Dragonborn", "speed": 30, "ability_bonuses": { "STR": 2, "CHA": 1 } },
  { "name": "Tiefling",   "speed": 30, "ability_bonuses": { "INT": 1, "CHA": 2 } }
]`,
};

export function renderImportPage(ctx) {
  if (!ctx.isGm) {
    return emptyState('Apenas GM/Admin podem importar conteúdo.');
  }

  const wrap = createElement('div');

  // Intro
  const intro = createElement('div', { class: 'dnd-section' });
  intro.appendChild(createElement('h3', { textContent: 'Importação de Packs SRD' }));
  intro.appendChild(createElement('p', {
    style: 'font-size:12px;color:var(--text2,#aaa);margin:0',
    textContent: 'Carrega JSON em qualquer dos 4 domínios. Os ficheiros importados ficam disponíveis para os jogadores escolherem nas suas fichas (subclasses, raças, magias) e na loja (itens mágicos).',
  }));
  wrap.appendChild(intro);

  // Domain tabs
  const tabs = createElement('div', {
    class: 'dnd-nav',
    style: 'margin-bottom:0',
  });
  const panels = {};
  let activeDomain = DOMAINS[0];

  DOMAINS.forEach((d) => {
    const stats = packStats(d);
    const btn = createElement('button', {
      class: 'dnd-nav-btn',
      textContent: `${DOMAIN_LABELS[d]} (${stats.count})`,
    });
    if (d === activeDomain) btn.classList.add('on');
    on(btn, 'click', () => {
      activeDomain = d;
      Object.keys(panels).forEach((k) => panels[k].style.display = k === d ? '' : 'none');
      tabs.querySelectorAll('.dnd-nav-btn').forEach((el) => el.classList.remove('on'));
      btn.classList.add('on');
    });
    tabs.appendChild(btn);
  });
  wrap.appendChild(tabs);

  // Panel per domain
  DOMAINS.forEach((d) => {
    const panel = renderDomainPanel(d);
    panel.style.display = d === activeDomain ? '' : 'none';
    panels[d] = panel;
    wrap.appendChild(panel);
  });

  return wrap;
}

function renderDomainPanel(domain) {
  const sec = createElement('div', { class: 'dnd-section' });

  const head = createElement('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px' });
  head.appendChild(createElement('h3', { textContent: DOMAIN_LABELS[domain], style: 'margin:0' }));
  const current = loadPack(domain);
  const meta = createElement('span', {
    style: 'font-size:11px;color:var(--text2,#aaa)',
    textContent: `${current.length} entrada(s) atualmente`,
  });
  head.appendChild(meta);
  sec.appendChild(head);

  const help = createElement('p', {
    style: 'font-size:11px;color:var(--text2,#aaa);margin:0 0 6px',
    textContent: 'Cola um JSON array. Exemplo do shape esperado:',
  });
  sec.appendChild(help);

  const sample = createElement('pre', {
    textContent: SAMPLES[domain],
    style: 'background:var(--bg,#0d0d0d);border:1px solid var(--border,#333);border-radius:4px;padding:8px;font-size:10px;color:var(--text2,#aaa);overflow:auto;max-height:120px;margin:0 0 8px;font-family:Menlo,Consolas,monospace',
  });
  sec.appendChild(sample);

  // Upload / paste area
  const ta = createElement('textarea', { rows: 8 });
  ta.style.width = '100%';
  ta.style.background = 'var(--bg, #0d0d0d)';
  ta.style.border = '1px solid var(--border, #333)';
  ta.style.borderRadius = '4px';
  ta.style.padding = '8px';
  ta.style.fontSize = '11px';
  ta.style.color = 'var(--text, #eee)';
  ta.style.fontFamily = 'Menlo,Consolas,monospace';
  ta.placeholder = 'Cola o JSON aqui ou usa o botão "Ficheiro" abaixo.';
  sec.appendChild(ta);

  const fileInput = createElement('input', { type: 'file', accept: '.json,application/json' });
  fileInput.style.display = 'none';
  sec.appendChild(fileInput);

  const actions = createElement('div', { style: 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap' });
  const fileBtn = createElement('button', { class: 'dnd-btn', textContent: '📂 Ficheiro JSON' });
  on(fileBtn, 'click', () => fileInput.click());
  on(fileInput, 'change', async () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    const text = await f.text();
    ta.value = text;
    runPreview();
  });

  const previewBtn = createElement('button', { class: 'dnd-btn', textContent: '👁 Validar' });
  on(previewBtn, 'click', runPreview);

  const applyBtn = createElement('button', { class: 'dnd-btn primary', textContent: '⤵ Substituir pack atual', disabled: true });
  on(applyBtn, 'click', async () => {
    const ok = await confirmDialog(`Substituir as ${current.length} entradas atuais de "${DOMAIN_LABELS[domain]}" pelo novo pack?`);
    if (!ok) return;
    try {
      const { entries } = validatePack(domain, ta.value);
      savePack(domain, entries);
      toast(`${entries.length} entradas importadas em ${DOMAIN_LABELS[domain]}`, 'success');
      meta.textContent = `${entries.length} entrada(s) atualmente`;
      applyBtn.disabled = true;
      preview.innerHTML = '';
      ta.value = '';
    } catch (err) {
      toast(err?.message || 'Falha ao guardar', 'error');
    }
  });

  const clearBtn = createElement('button', { class: 'dnd-btn danger', textContent: '🗑 Limpar pack atual' });
  on(clearBtn, 'click', async () => {
    const ok = await confirmDialog(`Apagar o pack "${DOMAIN_LABELS[domain]}" inteiro?`);
    if (!ok) return;
    clearPack(domain);
    meta.textContent = `0 entrada(s) atualmente`;
    toast('Pack limpo', 'info');
  });

  actions.appendChild(fileBtn);
  actions.appendChild(previewBtn);
  actions.appendChild(applyBtn);
  actions.appendChild(clearBtn);
  sec.appendChild(actions);

  // Preview area
  const preview = createElement('div', { style: 'margin-top:10px;font-size:11px' });
  sec.appendChild(preview);

  function runPreview() {
    preview.innerHTML = '';
    if (!ta.value.trim()) return;
    const result = validatePack(domain, ta.value);

    const summary = createElement('div', {
      style: `padding:6px 8px;border-radius:4px;margin-bottom:6px;${result.valid ? 'background:rgba(34,197,94,0.1);color:#22c55e' : 'background:rgba(220,38,38,0.1);color:#ef4444'}`,
      textContent: result.valid
        ? `✓ Válido — ${result.entries.length} entradas prontas a importar.`
        : `✕ Inválido — ${result.errors.length} entrada(s) com problemas.`,
    });
    preview.appendChild(summary);

    if (result.errors.length) {
      const errBox = createElement('div', {
        style: 'background:var(--bg,#0d0d0d);border:1px solid #5b1a1a;border-radius:4px;padding:8px;max-height:160px;overflow:auto',
      });
      result.errors.slice(0, 20).forEach(({ index, errors }) => {
        errBox.appendChild(createElement('div', {
          textContent: `[${index === -1 ? 'top-level' : `entrada ${index}`}] ${errors.join('; ')}`,
          style: 'color:#fca5a5;line-height:1.5',
        }));
      });
      if (result.errors.length > 20) {
        errBox.appendChild(createElement('div', {
          style: 'color:var(--text3,#777);margin-top:4px',
          textContent: `… +${result.errors.length - 20} mais.`,
        }));
      }
      preview.appendChild(errBox);
    } else if (result.entries.length) {
      const preview3 = result.entries.slice(0, 3).map((e) => JSON.stringify(e)).join('\n');
      const more = result.entries.length > 3 ? `\n… +${result.entries.length - 3} mais` : '';
      preview.appendChild(createElement('pre', {
        textContent: preview3 + more,
        style: 'background:var(--bg,#0d0d0d);border:1px solid var(--border,#333);border-radius:4px;padding:8px;font-size:10px;color:var(--text2,#aaa);max-height:160px;overflow:auto;font-family:Menlo,Consolas,monospace',
      }));
    }

    applyBtn.disabled = !result.valid || !result.entries.length;
  }

  return sec;
}

function emptyState(text) {
  return createElement('div', {
    class: 'dnd-section',
    textContent: text,
    style: 'text-align:center;color:var(--text2,#aaa);font-size:12px',
  });
}
