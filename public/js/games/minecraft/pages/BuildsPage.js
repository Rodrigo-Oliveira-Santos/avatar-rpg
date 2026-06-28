/**
 * Minecraft Builds gallery — placeholder.
 */

import { createElement } from '../../../utils/dom.js';

export function renderBuildsPage() {
  const wrap = createElement('section', { class: 'page-placeholder' });
  wrap.appendChild(createElement('h2', { textContent: 'Minecraft — Galeria de Builds' }));
  wrap.appendChild(createElement('p', {
    textContent: 'Página em desenvolvimento. Aqui aparecerá a galeria de builds com thumbnail + link para download (Google Drive).',
  }));
  return wrap;
}
