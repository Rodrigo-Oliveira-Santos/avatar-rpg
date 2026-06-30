/**
 * TradeHistoryPanel — list of finalised trades involving the player.
 *
 * Renders on the player's own profile page. Shows accepted/rejected/
 * cancelled proposals plus GM-forced transfers (loot, rewards) so the
 * player can audit "where did this gold come from?".
 *
 * Subscribes to the trades realtime channel so the list refreshes
 * without a manual reload.
 */

import { createElement, on } from '../utils/dom.js';
import * as TradesApi from '../api/trades.js';

const norm = (s) => String(s || '').trim().toLowerCase();

function describeSide(side) {
  const items = (side?.items || []).map((i) => `${i.name} ×${i.quantity}`).join(', ');
  const parts = [];
  if (items) parts.push(items);
  if (side?.gold > 0) parts.push(`${side.gold} ouro`);
  return parts.join(' • ') || '—';
}

function statusBadge(status) {
  const labels = {
    accepted:  { text: 'Aceite',      cls: 'th-ok' },
    rejected:  { text: 'Recusada',    cls: 'th-warn' },
    cancelled: { text: 'Cancelada',   cls: 'th-muted' },
    forced:    { text: 'GM',          cls: 'th-gm' },
    pending:   { text: 'Pendente',    cls: 'th-pending' },
  };
  const info = labels[status] || { text: status, cls: 'th-muted' };
  return createElement('span', { class: `th-badge ${info.cls}`, textContent: info.text });
}

export class TradeHistoryPanel {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.host
   * @param {string} opts.username
   */
  constructor({ host, username }) {
    this.host = host;
    this.username = username;
    this._unsub = null;
    this._destroyed = false;
    this.root = createElement('section', { class: 'trade-history' });
    this.host.appendChild(this.root);
    this.refresh();
    TradesApi.subscribe(() => { if (!this._destroyed) this.refresh(); })
      .then((unsub) => {
        if (this._destroyed) { unsub?.(); return; }
        this._unsub = unsub;
      })
      .catch(() => {});
  }

  destroy() {
    this._destroyed = true;
    if (typeof this._unsub === 'function') this._unsub();
    this.root.remove();
  }

  async refresh() {
    const trades = await TradesApi.listForUser(this.username);
    this._render(trades);
  }

  _render(trades) {
    this.root.innerHTML = '';
    const title = createElement('h3', { class: 'notes-title', textContent: 'Histórico de Trocas' });
    this.root.appendChild(title);

    const finalised = trades.filter((t) => t.status !== 'pending');
    if (finalised.length === 0) {
      this.root.appendChild(createElement('p', {
        class: 'notes-empty',
        textContent: 'Ainda não tens trocas no histórico.',
      }));
      return;
    }

    const list = createElement('ul', { class: 'th-list' });
    finalised.slice(0, 25).forEach((trade) => list.appendChild(this._renderRow(trade)));
    this.root.appendChild(list);
  }

  _renderRow(trade) {
    const li = createElement('li', { class: 'th-row' });
    const isOutgoing = norm(trade.from_username) === norm(this.username);
    const counterpart = isOutgoing ? trade.to_username : trade.from_username;

    const head = createElement('div', { class: 'th-head' });
    const direction = createElement('span', {
      class: 'th-direction',
      textContent: isOutgoing ? `→ ${counterpart}` : `← ${counterpart}`,
    });
    head.appendChild(direction);
    head.appendChild(statusBadge(trade.status));
    head.appendChild(createElement('time', {
      class: 'th-when',
      textContent: new Date(trade.decided_at || trade.created_at).toLocaleString('pt-PT'),
      datetime: trade.decided_at || trade.created_at,
    }));
    li.appendChild(head);

    const offer   = { items: trade.offer_items   || [], gold: trade.offer_gold   || 0 };
    const request = { items: trade.request_items || [], gold: trade.request_gold || 0 };

    if (trade.status === 'forced') {
      // GM forced transfers only have the "offer" side populated.
      li.appendChild(createElement('p', {
        class: 'th-side',
        textContent: isOutgoing ? `Enviou: ${describeSide(offer)}` : `Recebeu: ${describeSide(offer)}`,
      }));
    } else {
      li.appendChild(createElement('p', { class: 'th-side', textContent: `Ofereceu: ${describeSide(offer)}` }));
      li.appendChild(createElement('p', { class: 'th-side', textContent: `Pediu: ${describeSide(request)}` }));
    }

    if (trade.note) {
      li.appendChild(createElement('p', { class: 'th-note', textContent: trade.note }));
    }
    return li;
  }
}
