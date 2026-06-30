/**
 * ShopManager — GM-only management UI for the item catalogue.
 *
 * Renders the full list of items (Supabase + imported + mock merged) with
 * inline editing of price / name / description / rarity / type and an
 * `in_shop` checkbox so the GM controls what the players see.
 *
 * Persistence:
 *   - Supabase-backed rows write via `api/items.updateItem`.
 *   - Items from mock/imported sources (no real id) are read-only here;
 *     a "Promover para a BD" button copies them into Supabase via
 *     `createItem`.
 *
 * NOTE: full "shop profiles" (named bundles the GM can toggle on/off in
 * one click) are a future iteration — for now we have direct per-item
 * `in_shop` toggling, which delivers the same outcome with less plumbing.
 */

import { createElement, on } from '../utils/dom.js';
import { toast, confirmDialog, promptDialog } from '../utils/toast.js';
import * as Items from '../api/items.js';
import * as Profiles from '../api/shopProfiles.js';
import { getShopItems, loadShopItemsFromSupabase } from './data.js';

const TYPES = ['weapon','armor','accessory','consumable','other'];
const RARITIES = ['common','rare','epic','legendary'];

export class ShopManager {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this.container = container;
    this.items = [];
    this._loading = false;
  }

  async render() {
    this.container.innerHTML = '';

    const head = createElement('div', { class: 'shop-manager-head' });
    head.appendChild(createElement('h3', { textContent: 'Gerir Loja' }));
    const headActions = createElement('div', { class: 'shop-manager-head-actions' });
    const addBtn = createElement('button', { type: 'button', class: 'btn btn-primary', textContent: '+ Novo Item' });
    on(addBtn, 'click', () => this._openCreateForm());
    headActions.appendChild(addBtn);
    head.appendChild(headActions);
    this.container.appendChild(head);

    // Profiles section — bundled item sets the GM can swap in one click.
    this.profilesHost = createElement('section', { class: 'shop-profiles-section' });
    this.container.appendChild(this.profilesHost);

    this.listHost = createElement('div', { class: 'shop-manager-list' });
    this.container.appendChild(this.listHost);

    await this.refresh();
  }

  async refresh() {
    this._loading = true;
    this.listHost.innerHTML = '<p class="hub-empty">A carregar itens…</p>';
    await loadShopItemsFromSupabase({ force: true });
    this.items = getShopItems('all', '');
    this.profiles = await Profiles.list();
    this._loading = false;
    this._renderProfiles();
    this._renderList();
  }

  _renderProfiles() {
    this.profilesHost.innerHTML = '';
    const head = createElement('div', { class: 'shop-profiles-head' });
    head.appendChild(createElement('h4', { textContent: 'Perfis de Loja' }));
    const newBtn = createElement('button', {
      type: 'button',
      class: 'btn',
      textContent: '💾 Guardar atual como perfil',
      title: 'Cria um perfil com todos os itens atualmente marcados como "Na loja".',
    });
    on(newBtn, 'click', () => this._snapshotProfile());
    head.appendChild(newBtn);
    this.profilesHost.appendChild(head);

    if (!this.profiles?.length) {
      this.profilesHost.appendChild(createElement('p', {
        class: 'hub-empty',
        textContent: 'Sem perfis. Marca alguns itens como "Na loja" e clica em 💾 para criar o primeiro.',
      }));
      return;
    }
    const list = createElement('ul', { class: 'shop-profiles-list' });
    this.profiles.forEach((p) => list.appendChild(this._renderProfileChip(p)));
    this.profilesHost.appendChild(list);
  }

  _renderProfileChip(profile) {
    const li = createElement('li', { class: 'shop-profile-chip' });
    li.appendChild(createElement('strong', { textContent: profile.name }));
    li.appendChild(createElement('span', { class: 'profile-count', textContent: `${profile.item_ids?.length || 0} itens` }));
    if (profile.description) li.title = profile.description;

    const applyBtn = createElement('button', { type: 'button', class: 'btn btn-primary', textContent: 'Aplicar' });
    on(applyBtn, 'click', () => this._applyProfile(profile));
    li.appendChild(applyBtn);

    const editBtn = createElement('button', { type: 'button', class: 'btn-icon', textContent: '✎', title: 'Renomear' });
    on(editBtn, 'click', () => this._renameProfile(profile));
    li.appendChild(editBtn);

    const delBtn = createElement('button', { type: 'button', class: 'btn-icon', textContent: '✕', title: 'Apagar perfil' });
    on(delBtn, 'click', () => this._deleteProfile(profile));
    li.appendChild(delBtn);
    return li;
  }

  async _snapshotProfile() {
    const name = await promptDialog('Nome do novo perfil', { defaultValue: 'Perfil ' + new Date().toLocaleDateString('pt-PT') });
    if (!name) return;
    const desc = await promptDialog('Descrição (opcional)', { defaultValue: '' });
    try {
      await Profiles.snapshotCurrent(name, desc || null);
      toast('Perfil guardado.', 'success');
      await this.refresh();
    } catch (err) { toast(`Falha: ${err.message}`, 'error'); }
  }

  async _applyProfile(profile) {
    const ok = await confirmDialog(`Aplicar "${profile.name}"? Vai substituir o que está atualmente na loja.`);
    if (!ok) return;
    try {
      await Profiles.apply(profile.id);
      toast(`Perfil "${profile.name}" aplicado.`, 'success');
      await this.refresh();
    } catch (err) { toast(`Falha: ${err.message}`, 'error'); }
  }

  async _renameProfile(profile) {
    const name = await promptDialog('Novo nome', { defaultValue: profile.name });
    if (!name || name === profile.name) return;
    try {
      await Profiles.update(profile.id, { name });
      toast('Perfil renomeado.', 'success');
      await this.refresh();
    } catch (err) { toast(`Falha: ${err.message}`, 'error'); }
  }

  async _deleteProfile(profile) {
    const ok = await confirmDialog(`Apagar perfil "${profile.name}"? Os itens não são afetados.`);
    if (!ok) return;
    try {
      await Profiles.remove(profile.id);
      toast('Perfil apagado.', 'success');
      await this.refresh();
    } catch (err) { toast(`Falha: ${err.message}`, 'error'); }
  }

  _renderList() {
    this.listHost.innerHTML = '';
    if (this.items.length === 0) {
      this.listHost.appendChild(createElement('p', { class: 'hub-empty', textContent: 'Sem itens.' }));
      return;
    }
    const table = createElement('table', { class: 'shop-manager-table' });
    const thead = createElement('thead');
    thead.innerHTML = `<tr>
      <th>Loja</th><th>Nome</th><th>Tipo</th><th>Raridade</th>
      <th>Preço</th><th class="col-desc">Descrição</th><th>Ações</th>
    </tr>`;
    table.appendChild(thead);

    const tbody = createElement('tbody');
    this.items.forEach((item) => tbody.appendChild(this._renderRow(item)));
    table.appendChild(tbody);

    this.listHost.appendChild(table);
  }

  _renderRow(item) {
    const isSupabaseRow = Boolean(item.id && !String(item.id).startsWith('item-'));
    const tr = createElement('tr', { class: isSupabaseRow ? 'db-row' : 'static-row' });

    // ✅ in_shop toggle
    const inShopCell = createElement('td');
    const inShopBox = createElement('input', { type: 'checkbox' });
    inShopBox.checked = Boolean(item.in_shop);
    inShopBox.disabled = !isSupabaseRow;
    on(inShopBox, 'change', () => this._update(item, { in_shop: inShopBox.checked }));
    inShopCell.appendChild(inShopBox);
    tr.appendChild(inShopCell);

    // Name
    tr.appendChild(this._cell(item.name, (v) => this._update(item, { name: v }), isSupabaseRow));

    // Type select
    tr.appendChild(this._selectCell(item.type, TYPES, (v) => this._update(item, { type: v }), isSupabaseRow));

    // Rarity select
    tr.appendChild(this._selectCell(item.rarity, RARITIES, (v) => this._update(item, { rarity: v }), isSupabaseRow));

    // Price
    tr.appendChild(this._cell(String(item.price ?? 0), (v) => this._update(item, { price: Number(v) }), isSupabaseRow, 'number'));

    // Description
    tr.appendChild(this._cell(item.description || '', (v) => this._update(item, { description: v }), isSupabaseRow));

    // Actions
    const actionsCell = createElement('td', { class: 'shop-manager-actions' });
    if (isSupabaseRow) {
      const del = createElement('button', { type: 'button', class: 'btn-icon', textContent: '✕', title: 'Apagar' });
      on(del, 'click', () => this._delete(item));
      actionsCell.appendChild(del);
    } else {
      const promote = createElement('button', {
        type: 'button',
        class: 'btn',
        textContent: 'Promover',
        title: 'Copiar para a base de dados (passa a ser editável)',
      });
      on(promote, 'click', () => this._promote(item));
      actionsCell.appendChild(promote);
    }
    tr.appendChild(actionsCell);
    return tr;
  }

  _cell(value, onCommit, editable = true, type = 'text') {
    const td = createElement('td');
    if (!editable) {
      td.textContent = value;
      td.classList.add('readonly');
      return td;
    }
    const input = createElement('input', { type, class: 'field-input', value });
    on(input, 'change', () => onCommit(input.value));
    td.appendChild(input);
    return td;
  }

  _selectCell(value, options, onCommit, editable = true) {
    const td = createElement('td');
    if (!editable) {
      td.textContent = value;
      td.classList.add('readonly');
      return td;
    }
    const select = createElement('select', { class: 'field-input' });
    options.forEach((opt) => {
      const o = createElement('option', { value: opt, textContent: opt });
      if (opt === value) o.selected = true;
      select.appendChild(o);
    });
    on(select, 'change', () => onCommit(select.value));
    td.appendChild(select);
    return td;
  }

  async _update(item, patch) {
    if (!item.id) return;
    try {
      await Items.updateItem(item.id, patch);
      toast('Item atualizado.', 'success');
      // Patch the local copy so we don't need a full refetch.
      Object.assign(item, patch);
    } catch (err) {
      toast(`Falha: ${err.message}`, 'error');
    }
  }

  async _delete(item) {
    const ok = await confirmDialog(`Apagar "${item.name}"? Os jogadores com este item no inventário perdem-no.`);
    if (!ok) return;
    try {
      await Items.deleteItem(item.id);
      toast('Item apagado.', 'success');
      await this.refresh();
    } catch (err) {
      toast(`Falha: ${err.message}`, 'error');
    }
  }

  async _promote(item) {
    try {
      await Items.createItem(item);
      toast(`"${item.name}" agora vive na BD.`, 'success');
      await this.refresh();
    } catch (err) {
      toast(`Falha: ${err.message}`, 'error');
    }
  }

  async _openCreateForm() {
    // Minimal create dialog: name + price + type + rarity + in_shop.
    const overlay = createElement('div', { class: 'modal-overlay' });
    const box = createElement('div', { class: 'modal-box' });
    box.appendChild(createElement('h2', { class: 'modal-title', textContent: 'Novo item' }));
    const form = createElement('form');
    on(form, 'submit', (e) => e.preventDefault());

    const fields = {
      name: this._field(form, 'Nome', 'text', ''),
      description: this._field(form, 'Descrição', 'text', ''),
      type: this._field(form, 'Tipo', 'select', 'other', TYPES),
      rarity: this._field(form, 'Raridade', 'select', 'common', RARITIES),
      price: this._field(form, 'Preço', 'number', 0),
    };

    const inShopRow = createElement('label', { class: 'form-inline' });
    const inShopBox = createElement('input', { type: 'checkbox' });
    inShopBox.checked = true;
    inShopRow.append(inShopBox, createElement('span', { textContent: 'Disponível na loja' }));
    form.appendChild(inShopRow);

    box.appendChild(form);
    const actions = createElement('div', { class: 'modal-actions' });
    const cancel = createElement('button', { type: 'button', class: 'modal-btn modal-btn-cancel', textContent: 'Cancelar' });
    const save = createElement('button', { type: 'button', class: 'modal-btn modal-btn-confirm', textContent: 'Criar' });
    actions.append(cancel, save);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    on(cancel, 'click', () => overlay.remove());
    on(overlay, 'click', (e) => { if (e.target === overlay) overlay.remove(); });

    on(save, 'click', async () => {
      const payload = {
        name: fields.name.value.trim(),
        description: fields.description.value.trim() || null,
        type: fields.type.value,
        rarity: fields.rarity.value,
        price: Number(fields.price.value) || 0,
        in_shop: inShopBox.checked,
      };
      if (!payload.name) {
        toast('Nome obrigatório.', 'warning');
        return;
      }
      try {
        await Items.createItem(payload);
        toast('Item criado.', 'success');
        overlay.remove();
        await this.refresh();
      } catch (err) {
        toast(`Falha: ${err.message}`, 'error');
      }
    });
  }

  _field(form, label, kind, defaultValue, options) {
    const row = createElement('div', { class: 'form-row' });
    row.appendChild(createElement('label', { class: 'form-label', textContent: label }));
    let input;
    if (kind === 'select') {
      input = createElement('select', { class: 'field-input' });
      (options || []).forEach((opt) => {
        const o = createElement('option', { value: opt, textContent: opt });
        if (opt === defaultValue) o.selected = true;
        input.appendChild(o);
      });
    } else {
      input = createElement('input', { type: kind, class: 'field-input', value: defaultValue });
    }
    row.appendChild(input);
    form.appendChild(row);
    return input;
  }
}
