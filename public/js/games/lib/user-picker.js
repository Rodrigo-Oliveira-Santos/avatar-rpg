/**
 * Modal para escolher um username de uma lista dada. Usado por painéis
 * admin (ex.: transferir builds no Minecraft).
 *
 * Devolve uma promise que resolve com o username escolhido ou `null`
 * se o utilizador cancelou.
 */

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

/**
 * @param {Object} opts
 * @param {string} opts.title — título do modal
 * @param {string} [opts.message] — descrição (opcional)
 * @param {Array<{username: string, label?: string, disabled?: boolean}>} opts.options
 * @param {string} [opts.confirmText='Confirmar']
 * @param {string} [opts.cancelText='Cancelar']
 * @returns {Promise<string|null>}
 */
export function pickUserDialog({
  title,
  message = '',
  options = [],
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const optsHtml = options.map((o) => `
      <option value="${escapeHtml(o.username)}"${o.disabled ? ' disabled' : ''}>
        ${escapeHtml(o.label || o.username)}
      </option>
    `).join('');

    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-msg"><strong>${escapeHtml(title)}</strong></div>
        ${message ? `<div class="modal-msg" style="margin-top:4px;color:var(--text2)">${escapeHtml(message)}</div>` : ''}
        <select class="modal-input pick-user-select">
          <option value="" disabled selected>— Escolhe um utilizador —</option>
          ${optsHtml}
        </select>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel">${escapeHtml(cancelText)}</button>
          <button class="modal-btn modal-btn-confirm" disabled>${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const select = overlay.querySelector('.pick-user-select');
    const confirmBtn = overlay.querySelector('.modal-btn-confirm');
    const cancelBtn = overlay.querySelector('.modal-btn-cancel');

    const close = (result) => {
      overlay.classList.add('modal-closing');
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };

    select.addEventListener('change', () => {
      confirmBtn.disabled = !select.value;
    });
    confirmBtn.addEventListener('click', () => close(select.value || null));
    cancelBtn.addEventListener('click', () => close(null));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });
    select.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close(null);
    });

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-open'));
    select.focus();
  });
}
