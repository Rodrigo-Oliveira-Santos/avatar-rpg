/**
 * D&D — Página de Trade.
 *
 * Mostra trades pendentes (recebidos + enviados), histórico recente, e
 * um formulário para criar nova proposta.
 *
 * UI deliberadamente minimal — D&D não tem o sistema de notificações do
 * Avatar, portanto cada utilizador vê os trades quando entra nesta tab.
 */

import { createElement, on } from '../../../utils/dom.js';
import { toast, confirmDialog } from '../../../utils/toast.js';
import {
  listTrades, listIncomingPending, listOutgoingPending,
  createTrade, acceptTrade, rejectTrade, cancelTrade,
} from '../dnd-trade.js';
import { listAll as listAllChars } from '../../../api/dnd-characters.js';

export async function renderTradePage(char, ctx) {
  const me = ctx.currentUser?.username;
  const wrap = createElement('div');

  // Header + new trade button
  const head = createElement('div', { class: 'dnd-section' });
  head.appendChild(createElement('h3', { textContent: 'Trade entre Jogadores' }));
  head.appendChild(createElement('p', {
    style: 'font-size:11px;color:var(--text2,#aaa);margin:0 0 8px',
    textContent: 'Propõe trocas a outros jogadores. Aceitar transfere itens/ouro automaticamente entre as duas fichas.',
  }));
  const newBtn = createElement('button', { class: 'dnd-btn primary', textContent: '+ Nova Proposta' });
  on(newBtn, 'click', async () => {
    const players = await listAllChars();
    const formEl = await openTradeForm(me, char, players, () => ctx.requestRender?.());
    wrap.appendChild(formEl);
    formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  head.appendChild(newBtn);
  wrap.appendChild(head);

  // Incoming pending
  const inc = listIncomingPending(me);
  const incSec = createElement('div', { class: 'dnd-section' });
  incSec.appendChild(createElement('h3', { textContent: `Recebidos (${inc.length})` }));
  if (!inc.length) {
    incSec.appendChild(emptyHint('Sem propostas pendentes.'));
  } else {
    inc.forEach((t) => incSec.appendChild(renderTradeCard(t, me, ctx)));
  }
  wrap.appendChild(incSec);

  // Outgoing pending
  const out = listOutgoingPending(me);
  const outSec = createElement('div', { class: 'dnd-section' });
  outSec.appendChild(createElement('h3', { textContent: `Enviados (${out.length})` }));
  if (!out.length) {
    outSec.appendChild(emptyHint('Sem propostas enviadas em aberto.'));
  } else {
    out.forEach((t) => outSec.appendChild(renderTradeCard(t, me, ctx)));
  }
  wrap.appendChild(outSec);

  // History (concluded)
  const history = listTrades({ user: me }).filter((t) => t.status !== 'pending').slice(0, 10);
  const histSec = createElement('div', { class: 'dnd-section' });
  histSec.appendChild(createElement('h3', { textContent: 'Histórico recente' }));
  if (!history.length) {
    histSec.appendChild(emptyHint('Sem trades concluídos.'));
  } else {
    history.forEach((t) => histSec.appendChild(renderTradeCard(t, me, ctx, /* readonly */ true)));
  }
  wrap.appendChild(histSec);

  return wrap;
}

function emptyHint(text) {
  return createElement('div', {
    style: 'font-size:11px;color:var(--text3,#777);padding:4px',
    textContent: text,
  });
}

function renderTradeCard(trade, me, ctx, readonly = false) {
  const isIncoming = trade.to_user === me;
  const card = createElement('div', {
    style: 'background:rgba(255,255,255,0.02);border:1px solid var(--border,#333);border-radius:4px;padding:8px;margin-bottom:6px',
  });

  const head = createElement('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px' });
  head.appendChild(createElement('div', {
    style: 'font-size:12px;font-weight:700;color:var(--text,#eee)',
    textContent: isIncoming ? `De ${trade.from_user}` : `Para ${trade.to_user}`,
  }));
  head.appendChild(createElement('span', {
    style: `font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:2px 8px;border-radius:3px;${statusStyle(trade.status)}`,
    textContent: STATUS_LABEL[trade.status] || trade.status,
  }));
  card.appendChild(head);

  const cols = createElement('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;color:var(--text,#eee)' });
  cols.appendChild(sideBox(isIncoming ? 'Recebes' : 'Ofereces', trade.give));
  cols.appendChild(sideBox(isIncoming ? 'Dás' : 'Recebes', trade.want));
  card.appendChild(cols);

  if (!readonly && trade.status === 'pending') {
    const actions = createElement('div', { style: 'display:flex;gap:4px;margin-top:8px;justify-content:flex-end' });
    if (isIncoming) {
      const acc = createElement('button', { class: 'dnd-btn primary', textContent: '✓ Aceitar' });
      on(acc, 'click', async () => {
        const ok = await confirmDialog('Aceitar este trade?');
        if (!ok) return;
        try {
          await acceptTrade(trade.id, me);
          toast('Trade aceite e aplicado.', 'success');
          ctx.requestRender?.();
        } catch (err) {
          toast(err?.message || 'Falha ao aceitar', 'error');
        }
      });
      const rej = createElement('button', { class: 'dnd-btn danger', textContent: '✕ Rejeitar' });
      on(rej, 'click', () => {
        try {
          rejectTrade(trade.id, me);
          toast('Trade rejeitado.', 'info');
          ctx.requestRender?.();
        } catch (err) {
          toast(err?.message || 'Falha', 'error');
        }
      });
      actions.appendChild(acc);
      actions.appendChild(rej);
    } else {
      const cancel = createElement('button', { class: 'dnd-btn danger', textContent: 'Cancelar' });
      on(cancel, 'click', () => {
        try {
          cancelTrade(trade.id, me);
          toast('Trade cancelado.', 'info');
          ctx.requestRender?.();
        } catch (err) {
          toast(err?.message || 'Falha', 'error');
        }
      });
      actions.appendChild(cancel);
    }
    card.appendChild(actions);
  }

  return card;
}

function sideBox(label, payload) {
  const box = createElement('div', {
    style: 'background:var(--bg,#0d0d0d);padding:6px;border-radius:4px',
  });
  box.appendChild(createElement('div', {
    style: 'font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:var(--text2,#aaa);margin-bottom:4px',
    textContent: label,
  }));
  if (payload.gold) {
    box.appendChild(createElement('div', { textContent: `💰 ${payload.gold} PO` }));
  }
  if (payload.items?.length) {
    payload.items.forEach((it) => {
      box.appendChild(createElement('div', { textContent: `• ${it.name} ×${it.qty}` }));
    });
  }
  if (!payload.gold && !payload.items?.length) {
    box.appendChild(createElement('div', {
      style: 'color:var(--text3,#777);font-style:italic',
      textContent: '(nada)',
    }));
  }
  return box;
}

const STATUS_LABEL = {
  pending:   'pendente',
  accepted:  'aceite',
  rejected:  'rejeitado',
  cancelled: 'cancelado',
};

function statusStyle(status) {
  switch (status) {
    case 'accepted':  return 'background:#16a34a;color:#fff';
    case 'rejected':  return 'background:#dc2626;color:#fff';
    case 'cancelled': return 'background:#525252;color:#fff';
    default:          return 'background:#eab308;color:#000';
  }
}

// ─── Trade form ────────────────────────────────────────────────────

async function openTradeForm(me, myChar, players, onSubmitted) {
  const form = createElement('div', { class: 'dnd-section' });
  form.appendChild(createElement('h3', { textContent: 'Nova Proposta de Trade' }));

  // Target
  const targets = players
    .map((p) => p.owner_username)
    .filter((u) => u && u !== me);

  const targetField = createElement('div', { class: 'dnd-field' });
  targetField.appendChild(createElement('label', { textContent: 'Para' }));
  const targetSel = createElement('select');
  targetSel.appendChild(createElement('option', { value: '', textContent: '— Escolhe um jogador —' }));
  targets.forEach((u) => targetSel.appendChild(createElement('option', { value: u, textContent: u })));
  targetField.appendChild(targetSel);
  form.appendChild(targetField);

  // Two columns: give vs want
  const cols = createElement('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px' });
  const giveState = { items: [], gold: 0 };
  const wantState = { items: [], gold: 0 };
  cols.appendChild(buildSidePanel('Ofereces', giveState, myChar.inventory));
  cols.appendChild(buildSidePanel('Queres em troca', wantState, []));
  form.appendChild(cols);

  // Submit
  const actions = createElement('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:10px' });
  const cancelBtn = createElement('button', { class: 'dnd-btn', textContent: 'Descartar' });
  on(cancelBtn, 'click', () => { form.remove(); });
  const submit = createElement('button', { class: 'dnd-btn primary', textContent: 'Enviar Proposta' });
  on(submit, 'click', () => {
    const to_user = targetSel.value;
    if (!to_user) { toast('Escolhe um destinatário.', 'warning'); return; }
    try {
      createTrade({ from_user: me, to_user, give: giveState, want: wantState });
      toast('Proposta enviada.', 'success');
      form.remove();
      onSubmitted?.();
    } catch (err) {
      toast(err?.message || 'Falha', 'error');
    }
  });
  actions.appendChild(cancelBtn);
  actions.appendChild(submit);
  form.appendChild(actions);

  return form;
}

function buildSidePanel(label, state, suggestInventory) {
  const wrap = createElement('div', {
    style: 'background:rgba(255,255,255,0.02);padding:8px;border-radius:4px',
  });
  wrap.appendChild(createElement('div', {
    style: 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text2,#aaa);margin-bottom:6px',
    textContent: label,
  }));

  // Gold
  const goldField = createElement('div', { class: 'dnd-field' });
  goldField.appendChild(createElement('label', { textContent: 'Ouro (PO)' }));
  const goldInput = createElement('input', { type: 'number', min: '0', value: '0' });
  on(goldInput, 'change', () => { state.gold = parseInt(goldInput.value, 10) || 0; });
  goldField.appendChild(goldInput);
  wrap.appendChild(goldField);

  // Items list
  const itemsLabel = createElement('div', {
    style: 'font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:var(--text2,#aaa);margin-top:6px;margin-bottom:4px',
    textContent: 'Itens',
  });
  wrap.appendChild(itemsLabel);
  const list = createElement('div', { style: 'display:flex;flex-direction:column;gap:3px' });
  const renderItems = () => {
    list.innerHTML = '';
    state.items.forEach((it, idx) => {
      const row = createElement('div', {
        style: 'display:grid;grid-template-columns:1fr 60px 24px;gap:4px;align-items:center',
      });
      const name = createElement('input', { type: 'text', value: it.name, placeholder: 'Nome' });
      on(name, 'change', () => { state.items[idx].name = name.value; });
      const qty = createElement('input', { type: 'number', min: '1', value: String(it.qty || 1) });
      on(qty, 'change', () => { state.items[idx].qty = parseInt(qty.value, 10) || 1; });
      const del = createElement('button', { class: 'dnd-btn danger', textContent: '✕', style: 'padding:2px 4px;font-size:10px' });
      on(del, 'click', () => { state.items.splice(idx, 1); renderItems(); });
      row.appendChild(name);
      row.appendChild(qty);
      row.appendChild(del);
      list.appendChild(row);
    });
  };
  renderItems();
  wrap.appendChild(list);

  // Add item: text input or suggestion from inventory
  const addRow = createElement('div', { style: 'display:flex;gap:4px;margin-top:6px' });
  const addBtn = createElement('button', { class: 'dnd-btn', textContent: '+ Novo item' });
  on(addBtn, 'click', () => { state.items.push({ name: '', qty: 1 }); renderItems(); });
  addRow.appendChild(addBtn);

  if (suggestInventory?.length) {
    const fromInvSel = createElement('select');
    fromInvSel.appendChild(createElement('option', { value: '', textContent: '+ Do meu inventário' }));
    suggestInventory.forEach((it) => {
      if (it.name && it.qty) {
        fromInvSel.appendChild(createElement('option', {
          value: it.name,
          textContent: `${it.name} (×${it.qty})`,
        }));
      }
    });
    on(fromInvSel, 'change', () => {
      const v = fromInvSel.value;
      if (!v) return;
      state.items.push({ name: v, qty: 1 });
      fromInvSel.value = '';
      renderItems();
    });
    addRow.appendChild(fromInvSel);
  }
  wrap.appendChild(addRow);

  return wrap;
}
