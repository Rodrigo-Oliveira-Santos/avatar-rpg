/**
 * D&D Characters page — placeholder.
 */

import { createElement } from '../../../utils/dom.js';

export function renderCharactersPage() {
  const wrap = createElement('section', { class: 'page-placeholder' });
  wrap.appendChild(createElement('h2', { textContent: 'D&D 5e — Personagens' }));
  wrap.appendChild(createElement('p', {
    textContent: 'Página em desenvolvimento. Aqui aparecerá a lista das tuas fichas D&D 5e.',
  }));
  return wrap;
}
