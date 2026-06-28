/**
 * Path Picker — modal-style chooser for irreversible path decisions.
 *
 * Two flavours:
 *   - combat_path   (precise vs brute): triggered when the player tries
 *     to unlock a tier 3+ skill in either `pr` or `br` branch with no
 *     combat_path set.
 *   - non_bender_path (chiblocker vs weapons): shown when element='none'
 *     and the player has no non_bender_path yet. Mounted at the top of
 *     the skill tree before any cards/canvas are rendered.
 */

import { createElement, on } from '../utils/dom.js';
import { NON_BENDER_PATHS, SKILL_BRANCHES } from '../utils/constants.js';

const COMBAT_PATHS = {
  precise: {
    label: 'Combate Preciso',
    description: 'Foco em controle, dano cirúrgico e habilidades táticas. Desbloqueia o ramo Preciso (pr) a partir do tier 3.',
  },
  brute: {
    label: 'Combate Bruto',
    description: 'Foco em força bruta, área e devastação. Desbloqueia o ramo Bruto (br) a partir do tier 3.',
  },
};

function buildModal({ title, subtitle, options, onChoose, onCancel }) {
  const overlay = createElement('div', { class: 'path-picker-overlay' });

  const modal = createElement('div', { class: 'path-picker-modal' });

  modal.appendChild(createElement('h2', { class: 'path-picker-title', textContent: title }));
  if (subtitle) {
    modal.appendChild(createElement('p', { class: 'path-picker-subtitle', textContent: subtitle }));
  }

  const warn = createElement('p', {
    class: 'path-picker-warning',
    textContent: '⚠ Esta escolha é permanente e fecha o caminho oposto.',
  });
  modal.appendChild(warn);

  const grid = createElement('div', { class: 'path-picker-grid' });
  options.forEach((opt) => {
    const card = createElement('button', {
      type: 'button',
      class: 'path-picker-card',
    });
    card.appendChild(createElement('h3', { textContent: opt.label }));
    card.appendChild(createElement('p', { textContent: opt.description }));
    const cta = createElement('span', { class: 'path-picker-cta', textContent: 'Escolher' });
    card.appendChild(cta);
    on(card, 'click', () => {
      onChoose(opt.value);
      overlay.remove();
    });
    grid.appendChild(card);
  });
  modal.appendChild(grid);

  if (onCancel) {
    const cancel = createElement('button', {
      type: 'button',
      class: 'path-picker-cancel',
      textContent: 'Cancelar',
    });
    on(cancel, 'click', () => {
      onCancel();
      overlay.remove();
    });
    modal.appendChild(cancel);
  }

  overlay.appendChild(modal);
  return overlay;
}

/**
 * Show the combat-path picker (precise vs brute). Returns a Promise that
 * resolves with the chosen path or null if cancelled.
 *
 * @returns {Promise<'precise'|'brute'|null>}
 */
export function askCombatPath() {
  return new Promise((resolve) => {
    const overlay = buildModal({
      title: 'Escolhe o teu caminho de combate',
      subtitle: 'A partir do Tier 3 cada elemento divide-se em dois ramos exclusivos. Esta escolha é permanente.',
      options: [
        { value: 'precise', ...COMBAT_PATHS.precise },
        { value: 'brute',   ...COMBAT_PATHS.brute   },
      ],
      onChoose: resolve,
      onCancel: () => resolve(null),
    });
    document.body.appendChild(overlay);
  });
}

/**
 * Show the non-bender path picker. No cancel — Sem Dobra requires a
 * choice before any skills are shown.
 *
 * @returns {Promise<'chiblocker'|'weapons'>}
 */
export function askNonBenderPath() {
  return new Promise((resolve) => {
    const overlay = buildModal({
      title: 'Escolhe o teu caminho — Sem Dobra',
      subtitle: 'Personagens sem dobra seguem um de dois caminhos especializados. Esta escolha não pode ser revertida.',
      options: [
        { value: 'chiblocker', label: NON_BENDER_PATHS.chiblocker,
          description: 'Especialista em bloquear o chi de dobradores. Combate desarmado focado em interromper e neutralizar.' },
        { value: 'weapons', label: NON_BENDER_PATHS.weapons,
          description: 'Mestre de armas tradicionais. Combate à distância e corpo a corpo com lâminas, arcos e armas exóticas.' },
      ],
      onChoose: resolve,
      // No cancel: Sem Dobra requires this.
    });
    document.body.appendChild(overlay);
  });
}

export { COMBAT_PATHS };
