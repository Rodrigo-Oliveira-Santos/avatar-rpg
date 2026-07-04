import { toast, confirmDialog } from '../utils/toast.js';

const CHARACTER_KEY_PREFIX = 'avatar_rpg_character_';

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const readCharacter = (username) => {
  try {
    return JSON.parse(localStorage.getItem(`${CHARACTER_KEY_PREFIX}${username}`) || 'null');
  } catch {
    return null;
  }
};

const collapseInventory = (items = []) => {
  const grouped = new Map();

  items.forEach((item) => {
    const key = normalizeName(item?.name);
    if (!key) return;

    const quantity = Number.parseInt(item?.quantity, 10) || 0;
    if (quantity <= 0) return;

    if (grouped.has(key)) {
      grouped.get(key).quantity += quantity;
      return;
    }

    grouped.set(key, {
      ...item,
      quantity
    });
  });

  return Array.from(grouped.values());
};

const createSelectionList = (items = [], inputName) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'trade-selection-list';

  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'trade-empty-state';
    empty.textContent = 'Sem itens disponíveis.';
    wrapper.append(empty);
    return wrapper;
  }

  items.forEach((item) => {
    const row = document.createElement('label');
    row.className = 'trade-item-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = inputName;
    checkbox.value = item.name;
    checkbox.dataset.quantity = String(item.quantity || 0);

    const info = document.createElement('div');
    info.className = 'trade-item-info';

    const title = document.createElement('span');
    title.className = 'trade-item-name';
    title.textContent = item.name;

    const meta = document.createElement('span');
    meta.className = 'trade-item-meta';
    meta.textContent = `${item.type || 'Item'} · ${item.rarity || 'Comum'} · x${item.quantity || 0}`;

    info.append(title, meta);

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '1';
    qtyInput.max = String(item.quantity || 1);
    qtyInput.value = '1';
    qtyInput.disabled = true;
    qtyInput.className = 'trade-quantity-input';

    checkbox.addEventListener('change', () => {
      qtyInput.disabled = !checkbox.checked;
      if (!checkbox.checked) {
        qtyInput.value = '1';
      }
    });

    row.append(checkbox, info, qtyInput);
    wrapper.append(row);
  });

  return wrapper;
};

const collectItems = (container) => {
  return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
    .map((checkbox) => {
      const quantityInput = checkbox.parentElement?.querySelector('.trade-quantity-input');
      const max = Number.parseInt(checkbox.dataset.quantity, 10) || 1;
      const quantity = Math.min(max, Math.max(1, Number.parseInt(quantityInput?.value, 10) || 1));
      return {
        name: checkbox.value,
        quantity
      };
    });
};

const renderTradeSide = (title, tradeSide = {}, emptyText) => {
  const section = document.createElement('section');
  section.className = 'trade-summary-column';

  const heading = document.createElement('h4');
  heading.textContent = title;

  const list = document.createElement('ul');
  list.className = 'trade-summary-list';

  const items = Array.isArray(tradeSide.items) ? tradeSide.items : [];
  if (items.length === 0 && !(tradeSide.gold > 0)) {
    const empty = document.createElement('li');
    empty.className = 'trade-empty-state';
    empty.textContent = emptyText;
    list.append(empty);
  } else {
    items.forEach((item) => {
      const entry = document.createElement('li');
      entry.textContent = `${item.name} x${item.quantity}`;
      list.append(entry);
    });

    if (tradeSide.gold > 0) {
      const gold = document.createElement('li');
      gold.className = 'trade-gold-line';
      gold.textContent = `${tradeSide.gold} ouro`;
      list.append(gold);
    }
  }

  section.append(heading, list);
  return section;
};

export class TradeModal {
  constructor(tradeManager, currentUsername) {
    this.tradeManager = tradeManager;
    this.currentUsername = currentUsername;
    this.overlay = null;
    this.handleEscape = this.handleEscape.bind(this);
  }

  /**
   * Load a character snapshot from any source. Supabase first (when
   * enabled), localStorage second. Returns `null` only when nothing is
   * available — proposing a trade does NOT require the target's full
   * sheet to be locally cached anymore.
   */
  async _loadCharacterAnyway(username) {
    try {
      const { isSupabaseEnabled } = await import('../api/config.js');
      if (isSupabaseEnabled()) {
        const { loadCharacter } = await import('../api/supabase-characters.js');
        const remote = await loadCharacter(username);
        if (remote) return remote;
      }
    } catch (err) {
      console.warn('[TradeModal] Supabase load failed', err);
    }
    return readCharacter(username);
  }

  async showCreate(targetUsername) {
    if (!this.currentUsername) {
      toast('Sem sessão ativa.', 'error');
      return;
    }
    if (normalizeName(this.currentUsername) === normalizeName(targetUsername)) {
      toast('Não podes propor uma troca a ti próprio.', 'warning');
      return;
    }

    const [ownCharacter, targetCharacter] = await Promise.all([
      this._loadCharacterAnyway(this.currentUsername),
      this._loadCharacterAnyway(targetUsername),
    ]);

    if (!ownCharacter) {
      toast('A tua ficha não foi encontrada — entra primeiro como esse jogador.', 'error');
      return;
    }

    this.close();

    const ownItems = collapseInventory(Array.isArray(ownCharacter.inventario) ? ownCharacter.inventario : []);
    // Target inventory is best-effort: if we don't have it (e.g. Supabase
    // off and target never logged in here) we render an empty list with
    // a free-text field, so the proposer can still send gold / unspecified.
    const targetItems = collapseInventory(
      Array.isArray(targetCharacter?.inventario) ? targetCharacter.inventario : []
    );

    const content = document.createElement('div');
    content.className = 'trade-modal';

    const header = document.createElement('div');
    header.className = 'trade-modal-header';

    const title = document.createElement('h3');
    title.textContent = `Propor Troca com ${targetUsername}`;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'trade-modal-close';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => this.close());

    header.append(title, closeButton);

    const body = document.createElement('div');
    body.className = 'trade-modal-body';

    const offerColumn = document.createElement('section');
    offerColumn.className = 'trade-column';
    const offerTitle = document.createElement('h4');
    offerTitle.textContent = 'Eu ofereço';
    const offerGoldLabel = document.createElement('label');
    offerGoldLabel.className = 'trade-field';
    offerGoldLabel.innerHTML = `<span>Ouro</span><input class="trade-gold-input" type="number" min="0" step="1" value="0">`;
    const offerItems = createSelectionList(ownItems, 'offer-items');
    offerColumn.append(offerTitle, offerGoldLabel, offerItems);

    const requestColumn = document.createElement('section');
    requestColumn.className = 'trade-column';
    const requestTitle = document.createElement('h4');
    requestTitle.textContent = 'Eu peço';
    const requestGoldLabel = document.createElement('label');
    requestGoldLabel.className = 'trade-field';
    requestGoldLabel.innerHTML = `<span>Ouro</span><input class="trade-gold-input" type="number" min="0" step="1" value="0">`;
    const requestItems = createSelectionList(targetItems, 'request-items');
    requestColumn.append(requestTitle, requestGoldLabel, requestItems);

    body.append(offerColumn, requestColumn);

    const footer = document.createElement('div');
    footer.className = 'trade-modal-footer';

    const submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.className = 'btn btn-primary';
    submitButton.textContent = 'Propor Troca';
    submitButton.addEventListener('click', async () => {
      try {
        await this.tradeManager.createTrade(
          this.currentUsername,
          targetUsername,
          {
            items: collectItems(offerItems),
            gold: offerGoldLabel.querySelector('input')?.value || 0
          },
          {
            items: collectItems(requestItems),
            gold: requestGoldLabel.querySelector('input')?.value || 0
          }
        );

        toast('Proposta de troca enviada.', 'success');
        this.close();
      } catch (error) {
        toast(error.message || 'Não foi possível criar a troca.', 'error');
      }
    });

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.textContent = 'Fechar';
    cancelButton.addEventListener('click', () => this.close());

    footer.append(cancelButton, submitButton);
    content.append(header, body, footer);

    this.open(content);
  }

  showPending(trade) {
    if (!trade) {
      toast('Troca inválida.', 'error');
      return;
    }

    this.close();

    // The trade row coming from Supabase uses `from_username` /
    // `to_username` + flat `offer_items|gold` / `request_items|gold`.
    // Map to the legacy shape this modal renders.
    const fromName = trade.from_username || trade.from;
    const toName   = trade.to_username   || trade.to;
    const offer    = trade.offer    || { items: trade.offer_items   || [], gold: trade.offer_gold   || 0 };
    const request  = trade.request  || { items: trade.request_items || [], gold: trade.request_gold || 0 };

    const isTarget = normalizeName(toName) === normalizeName(this.currentUsername);
    const counterpart = isTarget ? fromName : toName;

    const content = document.createElement('div');
    content.className = 'trade-modal';

    const header = document.createElement('div');
    header.className = 'trade-modal-header';

    const title = document.createElement('h3');
    title.textContent = 'Proposta de Troca';

    const subtitle = document.createElement('p');
    subtitle.className = 'trade-modal-subtitle';
    subtitle.textContent = `de ${fromName} para ${toName}`;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'trade-modal-close';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => this.close());

    const titleWrap = document.createElement('div');
    titleWrap.append(title, subtitle);

    header.append(titleWrap, closeButton);

    const info = document.createElement('p');
    info.className = 'trade-banner';
    info.textContent = isTarget
      ? `${counterpart} quer trocar contigo.`
      : `Estás à espera da resposta de ${counterpart}.`;

    const body = document.createElement('div');
    body.className = 'trade-modal-body';
    body.append(
      renderTradeSide(`${fromName} oferece`, offer, 'Nada oferecido.'),
      renderTradeSide(`${fromName} pede`, request, 'Nada pedido.')
    );

    const footer = document.createElement('div');
    footer.className = 'trade-modal-footer';

    const closeAction = document.createElement('button');
    closeAction.type = 'button';
    closeAction.className = 'btn btn-secondary';
    closeAction.textContent = 'Fechar';
    closeAction.addEventListener('click', () => this.close());
    footer.append(closeAction);

    if (isTarget) {
      const rejectButton = document.createElement('button');
      rejectButton.type = 'button';
      rejectButton.className = 'btn btn-secondary';
      rejectButton.textContent = 'Recusar';
      rejectButton.addEventListener('click', async () => {
        const confirmed = await confirmDialog('Tens a certeza que queres recusar esta proposta?', {
          confirmText: 'Recusar'
        });

        if (!confirmed) return;

        try {
          await this.tradeManager.rejectTrade(trade.id, this.currentUsername);
          toast('Proposta recusada.', 'success');
          this.close();
        } catch (error) {
          toast(error.message || 'Não foi possível recusar a troca.', 'error');
        }
      });

      const acceptButton = document.createElement('button');
      acceptButton.type = 'button';
      acceptButton.className = 'btn btn-primary';
      acceptButton.textContent = 'Aceitar';
      acceptButton.addEventListener('click', async () => {
        const confirmed = await confirmDialog('Confirmas esta troca? Os inventários serão atualizados imediatamente.', {
          confirmText: 'Aceitar'
        });

        if (!confirmed) return;

        try {
          await this.tradeManager.acceptTrade(trade.id, this.currentUsername);
          toast('Troca concluída com sucesso.', 'success');
          this.close();
        } catch (error) {
          toast(error.message || 'Não foi possível concluir a troca.', 'error');
        }
      });

      footer.append(rejectButton, acceptButton);
    } else {
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'btn btn-secondary';
      cancelButton.textContent = 'Cancelar';
      cancelButton.addEventListener('click', async () => {
        const confirmed = await confirmDialog('Tens a certeza que queres cancelar esta proposta?', {
          confirmText: 'Cancelar'
        });

        if (!confirmed) return;

        try {
          await this.tradeManager.cancelTrade(trade.id, this.currentUsername);
          toast('Proposta cancelada.', 'success');
          this.close();
        } catch (error) {
          toast(error.message || 'Não foi possível cancelar a troca.', 'error');
        }
      });

      footer.append(cancelButton);
    }

    content.append(header, info, body, footer);
    this.open(content);
  }

  open(content) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'trade-modal-overlay';
    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.close();
      }
    });

    this.overlay.append(content);
    document.body.append(this.overlay);
    document.addEventListener('keydown', this.handleEscape);
  }

  handleEscape(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    document.removeEventListener('keydown', this.handleEscape);
  }
}
