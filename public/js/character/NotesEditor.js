/**
 * NotesEditor — small, self-contained widget for managing a list of
 * timestamped notes on a character. Used in two places:
 *   - Player's own character sheet → `player_notes` (own UI, AutoSave handles persistence)
 *   - GM dashboard for a specific player → `gm_notes` (saves via targeted column update)
 *
 * Each note shape: `{ id, text, created_at, updated_at? }`.
 *
 * The widget owns ONLY the DOM rendering and edit lifecycle. Persistence
 * is left to the caller via `onChange(notes)`, so the same component
 * works for both the player textarea (debounced character save) and the
 * GM tooling (targeted column write).
 */

import { createElement, on } from '../utils/dom.js';

function newId() {
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function ensureNotes(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((n) => (n && typeof n === 'object' ? {
      id: n.id || newId(),
      text: String(n.text || ''),
      created_at: n.created_at || new Date().toISOString(),
      updated_at: n.updated_at || null,
    } : null))
    .filter(Boolean);
}

export class NotesEditor {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.host
   * @param {string} opts.title         — e.g. "As tuas notas"
   * @param {string} opts.placeholder   — input placeholder
   * @param {Array}  opts.notes         — initial notes
   * @param {(notes:Array) => any} opts.onChange — fired after add/edit/delete
   * @param {string} [opts.emptyText]
   */
  constructor({ host, title, placeholder, notes, onChange, emptyText }) {
    this.host = host;
    this.title = title;
    this.placeholder = placeholder || 'Escreve uma nota e prime Enter…';
    this.emptyText = emptyText || 'Sem notas.';
    this.onChange = typeof onChange === 'function' ? onChange : () => {};
    this.notes = ensureNotes(notes);
    this._editingId = null;
    this._build();
  }

  setNotes(notes) {
    this.notes = ensureNotes(notes);
    this._editingId = null;
    this._renderList();
  }

  destroy() {
    this.root.remove();
  }

  // ── Internals ───────────────────────────────────────────

  _build() {
    this.root = createElement('section', { class: 'notes-editor' });
    if (this.title) this.root.appendChild(createElement('h3', { class: 'notes-title', textContent: this.title }));

    // New-note form
    const form = createElement('form', { class: 'notes-add-form' });
    const input = createElement('input', { type: 'text', class: 'field-input', placeholder: this.placeholder });
    const addBtn = createElement('button', { type: 'submit', class: 'btn', textContent: '+ Adicionar' });
    form.append(input, addBtn);
    this.root.appendChild(form);
    on(form, 'submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      this.notes = [
        { id: newId(), text, created_at: new Date().toISOString(), updated_at: null },
        ...this.notes,
      ];
      input.value = '';
      this._renderList();
      this.onChange(this.notes);
    });

    // List host
    this.listEl = createElement('ul', { class: 'notes-list' });
    this.root.appendChild(this.listEl);

    this.host.appendChild(this.root);
    this._renderList();
  }

  _renderList() {
    this.listEl.innerHTML = '';
    if (this.notes.length === 0) {
      this.listEl.appendChild(createElement('li', { class: 'notes-empty', textContent: this.emptyText }));
      return;
    }
    this.notes.forEach((note) => {
      const li = createElement('li', { class: 'notes-item' });
      if (this._editingId === note.id) {
        const textarea = createElement('textarea', { class: 'field-input notes-edit-area', rows: 2 });
        textarea.value = note.text;
        li.appendChild(textarea);
        const row = createElement('div', { class: 'notes-item-actions' });
        const save = createElement('button', { type: 'button', class: 'btn btn-primary', textContent: 'Guardar' });
        const cancel = createElement('button', { type: 'button', class: 'btn', textContent: 'Cancelar' });
        row.append(save, cancel);
        li.appendChild(row);
        on(save, 'click', () => {
          const text = textarea.value.trim();
          if (!text) return;
          note.text = text;
          note.updated_at = new Date().toISOString();
          this._editingId = null;
          this._renderList();
          this.onChange(this.notes);
        });
        on(cancel, 'click', () => { this._editingId = null; this._renderList(); });
      } else {
        li.appendChild(createElement('div', { class: 'notes-text', textContent: note.text }));
        const meta = createElement('div', { class: 'notes-meta' });
        meta.appendChild(createElement('time', {
          textContent: formatDate(note.updated_at || note.created_at),
          datetime: note.updated_at || note.created_at,
        }));
        const editBtn = createElement('button', { type: 'button', class: 'btn-icon', textContent: '✎', title: 'Editar' });
        const delBtn  = createElement('button', { type: 'button', class: 'btn-icon', textContent: '✕', title: 'Apagar' });
        meta.append(editBtn, delBtn);
        li.appendChild(meta);
        on(editBtn, 'click', () => { this._editingId = note.id; this._renderList(); });
        on(delBtn, 'click', () => {
          this.notes = this.notes.filter((n) => n.id !== note.id);
          this._renderList();
          this.onChange(this.notes);
        });
      }
      this.listEl.appendChild(li);
    });
  }
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return iso; }
}
