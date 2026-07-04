/**
 * MonstersPage — GM-only catalogue for NPC creatures.
 *
 * Sections:
 *   1. Header with "+ Novo Monstro" button.
 *   2. Two columns: currently `in_play` monsters on the left, library on
 *      the right. Each card shows quick stats, in_play toggle, edit and
 *      delete actions.
 *   3. Form modal (`#monster-form-overlay`) shared between create/edit.
 *
 * Persistence goes through `api/monsters` which already abstracts the
 * Supabase ↔ localStorage choice, so this view stays display-only.
 */

import { createElement, on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import * as Monsters from '../api/monsters.js';
import * as Items from '../api/items.js';
import { log } from '../admin/LogService.js';

export const MONSTERS_UPDATED_EVENT = 'monsters:updated';

const EMPTY_DRAFT = {
  name: '',
  level: 1,
  hp_max: 10,
  hp_current: 10,
  cp_max: null,
  cp_current: null,
  defense: 10,
  dodge: 10,
  attr_for: 8, attr_agi: 8, attr_chi: 8, attr_per: 8, attr_res: 8, attr_esp: 8,
  attacks: [],
  loot_table: [],
  notes: '',
  in_play: false,
};

function emitUpdate() {
  window.dispatchEvent(new CustomEvent(MONSTERS_UPDATED_EVENT));
}

export class MonstersPage {
  constructor(container, authManager) {
    this.container = container;
    this.authManager = authManager;
    this.monsters = [];
    this.itemsCatalog = [];
    this.formOverlay = null;
    this._loading = false;
    this._unsubRealtime = null;
    this._destroyed = false;
    this.render();
    this.refresh();
    Monsters.subscribe(() => { if (!this._destroyed) this.refresh(); })
      .then((unsub) => {
        if (this._destroyed) { unsub?.(); return; }
        this._unsubRealtime = unsub;
      })
      .catch(() => {});
  }

  // ── Lifecycle ──────────────────────────────────────────────

  async refresh() {
    if (!this.authManager?.hasRole?.('gm')) {
      this.container.innerHTML = '<p class="hub-empty">Apenas GM/Admin podem aceder.</p>';
      return;
    }
    this._loading = true;
    this._renderList();
    try {
      const [monsters, items] = await Promise.all([
        Monsters.list(),
        Items.listAll().catch(() => []),
      ]);
      this.monsters = monsters;
      this.itemsCatalog = items;
    } catch (err) {
      toast('Falha ao carregar monstros.', 'error');
      console.warn('[MonstersPage.refresh]', err);
    }
    this._loading = false;
    this._renderList();
  }

  destroy() {
    this._destroyed = true;
    this._closeForm();
    if (typeof this._unsubRealtime === 'function') this._unsubRealtime();
  }

  // ── Rendering ──────────────────────────────────────────────

  render() {
    this.container.innerHTML = '';

    const header = createElement('div', { class: 'monsters-header' });
    header.appendChild(createElement('h2', { textContent: 'Catálogo de Monstros' }));
    const btnRow = createElement('div', { class: 'monsters-header-actions' });
    const addBtn = createElement('button', {
      type: 'button',
      class: 'btn btn-primary',
      textContent: '+ Novo Monstro',
    });
    on(addBtn, 'click', () => this._openForm(null));
    btnRow.appendChild(addBtn);
    header.appendChild(btnRow);
    this.container.appendChild(header);

    const layout = createElement('div', { class: 'monsters-layout' });
    this._stagedHost = createElement('section', { class: 'monsters-column' });
    this._stagedHost.appendChild(createElement('h3', { textContent: 'Selecionados p/ batalha' }));
    layout.appendChild(this._stagedHost);

    this._libraryHost = createElement('section', { class: 'monsters-column' });
    this._libraryHost.appendChild(createElement('h3', { textContent: 'Biblioteca' }));
    layout.appendChild(this._libraryHost);

    this._cemeteryHost = createElement('section', { class: 'monsters-column' });
    this._cemeteryHost.appendChild(createElement('h3', { textContent: '⚰ Cemitério' }));
    layout.appendChild(this._cemeteryHost);

    this.container.appendChild(layout);
  }

  _renderList() {
    [this._stagedHost, this._libraryHost, this._cemeteryHost].forEach((host) => {
      if (!host) return;
      // Keep the title (first child), clear the rest.
      Array.from(host.children).slice(1).forEach((c) => c.remove());
    });

    if (this._loading) {
      this._libraryHost.appendChild(createElement('p', { class: 'hub-empty', textContent: 'A carregar…' }));
      return;
    }

    if (!this.monsters.length) {
      this._libraryHost.appendChild(createElement('p', {
        class: 'hub-empty',
        textContent: 'Sem monstros no catálogo. Clica em "+ Novo Monstro" para criar.',
      }));
      return;
    }

    const staged    = this.monsters.filter((m) => m.is_staged && !m.is_dead);
    const library   = this.monsters.filter((m) => !m.is_staged && !m.is_dead);
    const cemetery  = this.monsters.filter((m) => m.is_dead);

    if (staged.length === 0) {
      this._stagedHost.appendChild(createElement('p', {
        class: 'hub-empty', textContent: 'Nenhum monstro selecionado para a próxima batalha.',
      }));
    }
    staged.forEach((m) => this._stagedHost.appendChild(this._renderCard(m)));
    library.forEach((m) => this._libraryHost.appendChild(this._renderCard(m)));

    if (this._cemeteryHost) {
      if (cemetery.length === 0) {
        this._cemeteryHost.appendChild(createElement('p', {
          class: 'hub-empty', textContent: 'Cemitério vazio.',
        }));
      }
      cemetery.forEach((m) => this._cemeteryHost.appendChild(this._renderCard(m)));
    }
  }

  _renderCard(monster) {
    const card = createElement('article', { class: `monster-card ${monster.is_staged ? 'in-play' : ''}${monster.is_dead ? ' dead' : ''}` });

    const head = createElement('header', { class: 'monster-card-head' });
    head.appendChild(createElement('h4', { textContent: monster.name }));
    head.appendChild(createElement('span', { class: 'monster-level', textContent: `Nv. ${monster.level}` }));
    card.appendChild(head);

    const hpRow = createElement('div', { class: 'monster-hp' });
    hpRow.appendChild(createElement('span', {
      class: 'monster-hp-text',
      textContent: `${monster.hp_current}/${monster.hp_max} HP`,
    }));
    const hpBar = createElement('div', { class: 'monster-hp-bar' });
    const hpFill = createElement('div', { class: 'monster-hp-fill' });
    const pct = monster.hp_max > 0 ? (monster.hp_current / monster.hp_max) * 100 : 0;
    hpFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    if (pct <= 25) hpFill.style.background = 'linear-gradient(90deg, #a01010, #c02020)';
    else if (pct <= 50) hpFill.style.background = 'linear-gradient(90deg, #c07010, #e09020)';
    hpBar.appendChild(hpFill);
    hpRow.appendChild(hpBar);
    card.appendChild(hpRow);

    // Chi pool (optional). Shown only when the GM defined one — keeps
    // legacy monsters visually unchanged.
    if (Number.isFinite(monster.cp_max) && monster.cp_max > 0) {
      const cpCur = Number.isFinite(monster.cp_current) ? monster.cp_current : monster.cp_max;
      const cpRow = createElement('div', { class: 'monster-hp monster-cp' });
      cpRow.appendChild(createElement('span', {
        class: 'monster-hp-text',
        textContent: `${cpCur}/${monster.cp_max} Chi`,
      }));
      const cpBar = createElement('div', { class: 'monster-hp-bar' });
      const cpFill = createElement('div', { class: 'monster-hp-fill' });
      const cpPct = (cpCur / monster.cp_max) * 100;
      cpFill.style.width = `${Math.max(0, Math.min(100, cpPct))}%`;
      cpFill.style.background = 'linear-gradient(90deg, #2a5fb0, #4f8cff)';
      cpBar.appendChild(cpFill);
      cpRow.appendChild(cpBar);
      card.appendChild(cpRow);
    }

    const stats = createElement('div', { class: 'monster-stats' });
    [
      ['DEF', monster.defense], ['ESQ', monster.dodge],
      ['FOR', monster.attr_for], ['AGI', monster.attr_agi], ['CHI', monster.attr_chi],
      ['PER', monster.attr_per], ['RES', monster.attr_res], ['ESP', monster.attr_esp],
    ].forEach(([label, value]) => {
      const cell = createElement('div', { class: 'monster-stat' });
      cell.appendChild(createElement('span', { class: 'monster-stat-lbl', textContent: label }));
      cell.appendChild(createElement('span', { class: 'monster-stat-val', textContent: String(value) }));
      stats.appendChild(cell);
    });
    card.appendChild(stats);

    if (Array.isArray(monster.attacks) && monster.attacks.length) {
      const list = createElement('ul', { class: 'monster-attacks' });
      monster.attacks.forEach((atk) => {
        const li = createElement('li');
        li.appendChild(createElement('strong', { textContent: atk.name || 'Ataque' }));
        if (atk.damage) li.append(` — ${atk.damage}`);
        if (atk.range) li.append(` (${atk.range})`);
        if (atk.effect) li.append(` · ${atk.effect}`);
        list.appendChild(li);
      });
      card.appendChild(list);
    }

    if (monster.notes) {
      card.appendChild(createElement('p', { class: 'monster-notes', textContent: monster.notes }));
    }

    const actions = createElement('div', { class: 'monster-actions' });
    if (monster.is_dead) {
      // Cemetery card: restore or delete permanently.
      const restoreBtn = createElement('button', { type: 'button', class: 'btn btn-green', textContent: '↺ Reviver' });
      on(restoreBtn, 'click', () => this._setDead(monster, false));
      actions.appendChild(restoreBtn);
    } else {
      const stagedBtn = createElement('button', {
        type: 'button',
        textContent: monster.is_staged ? '✓ Selecionado' : 'Selecionar p/ batalha',
        class: monster.is_staged ? 'btn btn-green' : 'btn',
      });
      on(stagedBtn, 'click', () => this._toggleStaged(monster));
      actions.appendChild(stagedBtn);

      const editBtn = createElement('button', { type: 'button', class: 'btn', textContent: 'Editar' });
      on(editBtn, 'click', () => this._openForm(monster));
      actions.appendChild(editBtn);

      const cemeteryBtn = createElement('button', {
        type: 'button',
        class: 'btn',
        textContent: '⚰ Cemitério',
        title: 'Marcar como morto (mantém o registo)',
      });
      on(cemeteryBtn, 'click', () => this._setDead(monster, true));
      actions.appendChild(cemeteryBtn);
    }

    const deleteBtn = createElement('button', {
      type: 'button',
      class: 'btn btn-danger',
      textContent: '✕',
      title: 'Apagar permanentemente',
    });
    on(deleteBtn, 'click', () => this._deleteMonster(monster));
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    return card;
  }

  // ── Actions ────────────────────────────────────────────────

  async _toggleStaged(monster) {
    try {
      await Monsters.setStaged(monster.id, !monster.is_staged);
      toast(`${monster.name} ${monster.is_staged ? 'removido da' : 'selecionado para a'} próxima batalha.`, 'success');
      log({ type: 'gm', message: `Monster ${monster.name} is_staged=${!monster.is_staged}` });
      await this.refresh();
      emitUpdate();
    } catch (err) {
      toast('Falha ao atualizar.', 'error');
    }
  }

  async _setDead(monster, dead) {
    try {
      await Monsters.setDead(monster.id, dead);
      toast(`${monster.name} ${dead ? 'foi para o cemitério' : 'foi revivido'}.`, dead ? 'warning' : 'success');
      log({ type: 'gm', message: `Monster ${monster.name} is_dead=${dead}` });
      await this.refresh();
      emitUpdate();
    } catch (err) {
      toast('Falha ao atualizar estado.', 'error');
    }
  }

  async _deleteMonster(monster) {
    const ok = await confirmDialog(`Apagar permanentemente "${monster.name}"? Esta ação é irreversível.`);
    if (!ok) return;
    try {
      await Monsters.remove(monster.id);
      toast(`${monster.name} apagado.`, 'success');
      log({ type: 'gm', message: `Monster ${monster.name} deleted` });
      await this.refresh();
      emitUpdate();
    } catch (err) {
      toast('Falha ao apagar.', 'error');
    }
  }

  // ── Form (create / edit) ───────────────────────────────────

  _openForm(monster) {
    this._closeForm();
    const isEdit = Boolean(monster?.id);
    const draft = monster
      ? { ...EMPTY_DRAFT, ...monster, attacks: [...(monster.attacks || [])], loot_table: [...(monster.loot_table || [])] }
      : { ...EMPTY_DRAFT };

    const overlay = createElement('div', { class: 'modal-overlay monster-form-overlay' });
    const modal = createElement('div', { class: 'modal-box monster-form-box' });

    modal.appendChild(createElement('h2', { class: 'modal-title', textContent: isEdit ? 'Editar monstro' : 'Novo monstro' }));

    const form = createElement('form', { class: 'monster-form' });
    on(form, 'submit', (e) => e.preventDefault());

    // ── Basics ──
    form.appendChild(this._fieldRow('Nome', this._text(draft, 'name')));
    form.appendChild(this._gridRow([
      ['Nível', this._number(draft, 'level', 1, 99)],
      ['HP máx', this._number(draft, 'hp_max', 1, 100000)],
      ['HP atual', this._number(draft, 'hp_current', 0, 100000)],
      ['Defesa', this._number(draft, 'defense', 0, 999)],
      ['Esquiva', this._number(draft, 'dodge', 0, 999)],
    ]));

    // Chi pool is optional — leave blank for monsters that don't use chi.
    // The every-2-rounds regen only fires for monsters with `cp_max` set.
    form.appendChild(this._gridRow([
      ['Chi máx (opcional)', this._numberNullable(draft, 'cp_max', 0, 100000, 'em branco = não usa chi')],
      ['Chi atual',          this._numberNullable(draft, 'cp_current', 0, 100000, 'em branco = cheio')],
    ]));

    // ── Attributes ──
    form.appendChild(createElement('h3', { class: 'form-section-title', textContent: 'Atributos' }));
    form.appendChild(this._gridRow([
      ['FOR', this._number(draft, 'attr_for', 0, 99)],
      ['AGI', this._number(draft, 'attr_agi', 0, 99)],
      ['CHI', this._number(draft, 'attr_chi', 0, 99)],
      ['PER', this._number(draft, 'attr_per', 0, 99)],
      ['RES', this._number(draft, 'attr_res', 0, 99)],
      ['ESP', this._number(draft, 'attr_esp', 0, 99)],
    ]));

    // ── Attacks ──
    form.appendChild(createElement('h3', { class: 'form-section-title', textContent: 'Ataques' }));
    const attacksHost = createElement('div', { class: 'monster-form-list' });
    const renderAttacks = () => {
      attacksHost.innerHTML = '';
      draft.attacks.forEach((atk, idx) => {
        const row = createElement('div', { class: 'monster-form-list-row' });
        row.appendChild(this._inlineText(atk, 'name', 'Nome'));
        row.appendChild(this._inlineText(atk, 'damage', 'Dano (ex: 1d8+2)'));
        row.appendChild(this._inlineText(atk, 'range', 'Alcance'));
        row.appendChild(this._inlineText(atk, 'effect', 'Efeito (texto)'));
        const remove = createElement('button', { type: 'button', class: 'btn btn-icon', textContent: '✕' });
        on(remove, 'click', () => { draft.attacks.splice(idx, 1); renderAttacks(); });
        row.appendChild(remove);
        attacksHost.appendChild(row);
      });
    };
    const addAttackBtn = createElement('button', { type: 'button', class: 'btn', textContent: '+ ataque' });
    on(addAttackBtn, 'click', () => { draft.attacks.push({ name: '', damage: '', range: '', effect: '' }); renderAttacks(); });
    form.appendChild(attacksHost);
    form.appendChild(addAttackBtn);
    renderAttacks();

    // ── Loot ──
    form.appendChild(createElement('h3', { class: 'form-section-title', textContent: 'Loot' }));
    const lootHost = createElement('div', { class: 'monster-form-list' });
    const renderLoot = () => {
      lootHost.innerHTML = '';
      draft.loot_table.forEach((entry, idx) => {
        const row = createElement('div', { class: 'monster-form-list-row' });

        const kindSelect = createElement('select', { class: 'field-input' });
        ['item', 'custom'].forEach((k) => {
          const o = createElement('option', { value: k, textContent: k === 'item' ? 'Do catálogo' : 'Personalizado' });
          if (entry.kind === k) o.selected = true;
          kindSelect.appendChild(o);
        });
        on(kindSelect, 'change', () => { entry.kind = kindSelect.value; renderLoot(); });
        row.appendChild(kindSelect);

        if (entry.kind === 'item') {
          const itemSelect = createElement('select', { class: 'field-input' });
          itemSelect.appendChild(createElement('option', { value: '', textContent: '— escolhe item —' }));
          this.itemsCatalog.forEach((it) => {
            const o = createElement('option', { value: it.id, textContent: `${it.name} (${it.rarity})` });
            if (entry.item_id === it.id) o.selected = true;
            itemSelect.appendChild(o);
          });
          on(itemSelect, 'change', () => { entry.item_id = itemSelect.value; });
          row.appendChild(itemSelect);
        } else {
          row.appendChild(this._inlineText(entry, 'name', 'Nome do drop'));
        }

        row.appendChild(this._inlineNumber(entry, 'quantity', 'Qtd', 1, 9999));
        row.appendChild(this._inlineNumber(entry, 'drop_rate', 'Chance 0–1', 0, 1, 0.05));

        const remove = createElement('button', { type: 'button', class: 'btn btn-icon', textContent: '✕' });
        on(remove, 'click', () => { draft.loot_table.splice(idx, 1); renderLoot(); });
        row.appendChild(remove);

        lootHost.appendChild(row);
      });
    };
    const addLootBtn = createElement('button', { type: 'button', class: 'btn', textContent: '+ drop' });
    on(addLootBtn, 'click', () => { draft.loot_table.push({ kind: 'item', item_id: '', quantity: 1, drop_rate: 1 }); renderLoot(); });
    form.appendChild(lootHost);
    form.appendChild(addLootBtn);
    renderLoot();

    // ── Notes ──
    form.appendChild(createElement('h3', { class: 'form-section-title', textContent: 'Notas' }));
    const notesArea = createElement('textarea', {
      class: 'field-input',
      rows: 3,
      placeholder: 'Tácticas, fraquezas, contexto…',
    });
    notesArea.value = draft.notes || '';
    on(notesArea, 'input', () => { draft.notes = notesArea.value; });
    form.appendChild(notesArea);

    modal.appendChild(form);

    const actions = createElement('div', { class: 'modal-actions' });
    const cancel = createElement('button', { type: 'button', class: 'modal-btn modal-btn-cancel', textContent: 'Cancelar' });
    on(cancel, 'click', () => this._closeForm());
    const save = createElement('button', { type: 'button', class: 'modal-btn modal-btn-confirm', textContent: isEdit ? 'Guardar' : 'Criar' });
    on(save, 'click', () => this._submitForm(isEdit ? monster.id : null, draft));
    actions.append(cancel, save);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.formOverlay = overlay;

    on(overlay, 'click', (e) => { if (e.target === overlay) this._closeForm(); });
  }

  _closeForm() {
    if (this.formOverlay) {
      this.formOverlay.remove();
      this.formOverlay = null;
    }
  }

  async _submitForm(id, draft) {
    if (!draft.name || !draft.name.trim()) {
      toast('Nome obrigatório.', 'warning');
      return;
    }
    if (draft.hp_current > draft.hp_max) draft.hp_current = draft.hp_max;
    // Clamp chi when both are present; allow either to be null (opt-out).
    if (Number.isFinite(draft.cp_max) && Number.isFinite(draft.cp_current)
        && draft.cp_current > draft.cp_max) {
      draft.cp_current = draft.cp_max;
    }
    if (Number.isFinite(draft.cp_max) && draft.cp_current === undefined) {
      draft.cp_current = draft.cp_max;
    }
    try {
      if (id) {
        await Monsters.update(id, draft);
        toast(`${draft.name} atualizado.`, 'success');
      } else {
        await Monsters.create(draft);
        toast(`${draft.name} criado.`, 'success');
      }
      this._closeForm();
      await this.refresh();
      emitUpdate();
    } catch (err) {
      toast('Falha ao gravar monstro.', 'error');
      console.warn('[MonstersPage._submitForm]', err);
    }
  }

  // ── Form helpers ──────────────────────────────────────────

  _fieldRow(label, input) {
    const row = createElement('div', { class: 'form-row' });
    row.appendChild(createElement('label', { class: 'form-label', textContent: label }));
    row.appendChild(input);
    return row;
  }

  _gridRow(pairs) {
    const wrap = createElement('div', { class: 'form-grid' });
    pairs.forEach(([label, input]) => {
      const cell = createElement('div', { class: 'form-grid-cell' });
      cell.appendChild(createElement('label', { class: 'form-label', textContent: label }));
      cell.appendChild(input);
      wrap.appendChild(cell);
    });
    return wrap;
  }

  _text(draft, key) {
    const input = createElement('input', { type: 'text', class: 'field-input', value: draft[key] ?? '' });
    on(input, 'input', () => { draft[key] = input.value; });
    return input;
  }

  _number(draft, key, min, max) {
    const input = createElement('input', {
      type: 'number', class: 'field-input', min, max, value: draft[key] ?? 0,
    });
    on(input, 'input', () => {
      const n = Number(input.value);
      draft[key] = Number.isFinite(n) ? n : 0;
    });
    return input;
  }

  /**
   * Same as `_number` but treats an empty input as `null` (opt-out).
   * Used by optional fields like the monster chi pool (`cp_max`,
   * `cp_current`) — when null, the regen + UI just skip the monster.
   */
  _numberNullable(draft, key, min, max, placeholder = '') {
    const initial = draft[key];
    const input = createElement('input', {
      type: 'number',
      class: 'field-input',
      min,
      max,
      placeholder,
      value: (initial === null || initial === undefined) ? '' : String(initial),
    });
    on(input, 'input', () => {
      const raw = input.value.trim();
      if (raw === '') {
        draft[key] = null;
        return;
      }
      const n = Number(raw);
      draft[key] = Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
    });
    return input;
  }

  _inlineText(target, key, placeholder) {
    const input = createElement('input', {
      type: 'text', class: 'field-input', placeholder, value: target[key] ?? '',
    });
    on(input, 'input', () => { target[key] = input.value; });
    return input;
  }

  _inlineNumber(target, key, placeholder, min, max, step = 1) {
    const input = createElement('input', {
      type: 'number', class: 'field-input', placeholder, min, max, step, value: target[key] ?? 0,
    });
    on(input, 'input', () => {
      const n = Number(input.value);
      target[key] = Number.isFinite(n) ? n : 0;
    });
    return input;
  }
}
