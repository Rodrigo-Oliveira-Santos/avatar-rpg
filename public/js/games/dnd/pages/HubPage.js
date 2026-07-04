/**
 * D&D — Hub (lista de jogadores) e Painel de GM (atribuir XP / Ouro).
 */

import { createElement, on } from '../../../utils/dom.js';
import { listAll } from '../../../api/dnd-characters.js';
import { isPlayerRole } from '../../../hub/data.js';
import { toast } from '../../../utils/toast.js';
import { CLASSES } from '../data/srd.js';
import { classesSummary, totalLevel } from '../dnd-character.js';

export async function renderHubPage(char, ctx) {
  const wrap = createElement('div');

  // Cabeçalho com utilizador atual
  const head = createElement('div', { class: 'dnd-section' });
  head.appendChild(createElement('h3', { textContent: 'Jogadores' }));
  head.appendChild(createElement('p', {
    style: 'font-size:11px;color:var(--text2,#aaa);margin:0',
    textContent: ctx.isGm
      ? 'Como GM podes ver todas as fichas e atribuir XP/Ouro abaixo.'
      : 'Vista de todos os jogadores que têm uma ficha D&D 5e.',
  }));
  wrap.appendChild(head);

  const all = await listAll();
  const me = ctx.currentUser?.username;
  // GMs e admins não jogam — não devem aparecer no Hub nem nos
  // controlos de XP/Ouro. Usar o registry partilhado para distinguir.
  const filtered = all
    .filter((p) => {
      // Preferir owner_role quando vem do Supabase (mais fresh);
      // caso contrário cair na helper que consulta o registry local.
      const role = p?.owner_role;
      if (role === 'gm' || role === 'admin') return false;
      return isPlayerRole(p?.owner_username);
    })
    .sort((a, b) => (b.level || 0) - (a.level || 0));

  if (!filtered.length) {
    wrap.appendChild(emptyState('Ainda não há fichas D&D guardadas.'));
    return wrap;
  }

  // Grid de jogadores
  const sec = createElement('div', { class: 'dnd-section' });
  sec.appendChild(createElement('h3', { textContent: 'Lista' }));
  const grid = createElement('div', { class: 'dnd-hub-grid' });
  filtered.forEach((p) => grid.appendChild(playerCard(p, me)));
  sec.appendChild(grid);
  wrap.appendChild(sec);

  // GM panel
  if (ctx.isGm) {
    wrap.appendChild(renderGmPanel(filtered, ctx));
  }

  return wrap;
}

function playerCard(p, me) {
  const card = createElement('div', { class: 'dnd-hub-card' });
  const isMe = p.owner_username === me;
  const name = createElement('div', {
    class: 'name',
    textContent: `${p?.identity?.name || p.name || p.owner_username || '—'}${isMe ? ' (tu)' : ''}`,
  });
  card.appendChild(name);

  // Resumo de classes (suporta multiclass)
  const summary = classesSummary(p)
    || CLASSES.find((c) => c.id === p?.identity?.class)?.label
    || CLASSES.find((c) => c.id === p?.class)?.label
    || '—';
  const level = totalLevel(p);
  card.appendChild(createElement('div', {
    class: 'meta',
    textContent: `Nv ${level} · ${summary}`,
  }));
  card.appendChild(createElement('div', {
    class: 'meta',
    textContent: `XP ${p.xp || 0}${p.gold != null ? ` · Ouro ${p.gold}` : ''}`,
  }));
  card.appendChild(createElement('div', {
    class: 'meta',
    textContent: `Utilizador: ${p.owner_username || '—'}`,
  }));
  return card;
}

function renderGmPanel(players, ctx) {
  const sec = createElement('div', { class: 'dnd-section' });
  sec.appendChild(createElement('h3', { textContent: 'Painel GM — Atribuir Recompensas' }));

  const help = createElement('p', {
    style: 'font-size:11px;color:var(--text2,#aaa);margin:0 0 8px',
    textContent: 'XP e Ouro são aplicados imediatamente; os jogadores veem o efeito no próximo carregamento das suas fichas.',
  });
  sec.appendChild(help);

  // Per-player inputs
  players.forEach((p) => {
    if (!p.owner_username) return;
    const row = createElement('div', { class: 'dnd-gm-row' });
    row.appendChild(createElement('div', {
      class: 'name',
      textContent: `${p?.identity?.name || p.owner_username} (Nv ${totalLevel(p)})`,
    }));
    const xpInput = createElement('input', { type: 'number', placeholder: 'XP', style: inputStyle() });
    const goldInput = createElement('input', { type: 'number', placeholder: 'PO', style: inputStyle() });
    const btn = createElement('button', { class: 'dnd-btn primary', textContent: 'Aplicar' });
    on(btn, 'click', async () => {
      const xp = parseInt(xpInput.value, 10) || 0;
      const gold = parseInt(goldInput.value, 10) || 0;
      if (!xp && !gold) return;
      try {
        await ctx.grantReward?.(p.owner_username, { xp, gold });
        toast(`+${xp} XP · +${gold} PO → ${p.owner_username}`, 'success');
        flashRow(row);
        xpInput.value = ''; goldInput.value = '';
        ctx.requestRender?.();
      } catch (err) {
        toast(`Falha ao atribuir: ${err?.message || err}`, 'error');
      }
    });
    row.appendChild(xpInput);
    row.appendChild(goldInput);
    row.appendChild(btn);
    sec.appendChild(row);
  });

  // Bulk
  const bulkRow = createElement('div', { class: 'dnd-gm-row', style: 'border-top:1px solid var(--border);padding-top:8px;margin-top:8px' });
  bulkRow.appendChild(createElement('div', { class: 'name', textContent: 'TODOS (em bloco)' }));
  const bulkXp = createElement('input', { type: 'number', placeholder: 'XP', style: inputStyle() });
  const bulkGold = createElement('input', { type: 'number', placeholder: 'PO', style: inputStyle() });
  const bulkBtn = createElement('button', { class: 'dnd-btn primary', textContent: 'Aplicar a todos' });
  on(bulkBtn, 'click', async () => {
    const xp = parseInt(bulkXp.value, 10) || 0;
    const gold = parseInt(bulkGold.value, 10) || 0;
    if (!xp && !gold) return;
    let okCount = 0;
    const failed = [];
    bulkBtn.disabled = true; bulkBtn.textContent = 'A aplicar…';
    for (const p of players) {
      if (!p.owner_username) continue;
      try {
        await ctx.grantReward?.(p.owner_username, { xp, gold });
        okCount++;
      } catch (err) {
        failed.push(`${p.owner_username}: ${err?.message || err}`);
      }
    }
    bulkBtn.disabled = false; bulkBtn.textContent = 'Aplicar a todos';
    if (failed.length) {
      toast(`Aplicado a ${okCount}, falhou em ${failed.length}: ${failed[0]}`, 'warning');
    } else {
      toast(`✓ ${okCount} jogadores recompensados (+${xp} XP · +${gold} PO)`, 'success');
    }
    bulkXp.value = ''; bulkGold.value = '';
    ctx.requestRender?.();
  });
  bulkRow.appendChild(bulkXp);
  bulkRow.appendChild(bulkGold);
  bulkRow.appendChild(bulkBtn);
  sec.appendChild(bulkRow);

  return sec;
}

function flashRow(rowEl) {
  if (!rowEl) return;
  const original = rowEl.style.background;
  rowEl.style.transition = 'background 0.4s';
  rowEl.style.background = 'rgba(34,197,94,0.25)';
  setTimeout(() => { rowEl.style.background = original; }, 600);
}

function inputStyle() {
  return 'background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:4px 6px;font-size:11px;color:var(--text);width:100%';
}

function emptyState(text) {
  return createElement('div', {
    class: 'dnd-section',
    textContent: text,
    style: 'text-align:center;color:var(--text2,#aaa);font-size:12px',
  });
}
