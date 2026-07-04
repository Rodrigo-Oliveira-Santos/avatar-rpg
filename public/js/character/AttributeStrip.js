/**
 * AttributeStrip — slim read-only band showing the 6 character attributes.
 *
 * Designed for the skill-tree pages: gives the player a constant view of
 * their attributes (so they can reason about node requirements) without
 * giving them another set of +/- buttons. Mounted once at app start; the
 * body class `on-skill-page` controls visibility.
 */

import { createElement } from '../utils/dom.js';
import { ATTRIBUTES } from '../utils/constants.js';

const ATTR_COLORS = {
  FOR: '#E8844A',
  AGI: '#1D9E75',
  CHI: '#EF9F27',
  PER: '#7F77DD',
  RES: '#C03020',
  ESP: '#AFA9EC',
};

export function mountAttributeStrip({ host, character }) {
  const root = createElement('div', { class: 'attr-strip', id: 'skill-attr-strip' });
  host.appendChild(root);

  const cells = {};
  Object.keys(ATTRIBUTES).forEach((key) => {
    const cell = createElement('div', { class: 'attr-strip-cell' });
    cell.style.setProperty('--c', ATTR_COLORS[key] || '#9a9890');
    const label = createElement('span', {
      class: 'attr-strip-label',
      textContent: key,
    });
    const value = createElement('span', {
      class: 'attr-strip-value',
      textContent: '—',
    });
    cell.append(label, value);
    cells[key] = value;
    root.appendChild(cell);
  });

  function render() {
    const attrs = character.getData?.()?.atributos || {};
    Object.keys(cells).forEach((key) => {
      cells[key].textContent = String(attrs[key] ?? 0);
    });
  }

  const unsubscribe = typeof character.subscribe === 'function'
    ? character.subscribe(render) : null;

  render();

  return {
    refresh: render,
    destroy() {
      if (typeof unsubscribe === 'function') unsubscribe();
      root.remove();
    },
  };
}
