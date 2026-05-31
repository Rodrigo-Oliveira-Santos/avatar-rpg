/**
 * Custom Toast & Modal System
 * Replaces native alert/confirm/prompt with styled components
 */

let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message - Message text
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} duration - Auto-dismiss in ms (default 3000)
 */
export function toast(message, type = 'info', duration = 3000) {
  const container = getToastContainer();

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  container.appendChild(el);

  // Trigger animation
  requestAnimationFrame(() => el.classList.add('show'));

  // Auto-dismiss
  setTimeout(() => {
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/**
 * Show a confirm dialog
 * @param {string} message - Confirm message
 * @param {object} options - { confirmText, cancelText }
 * @returns {Promise<boolean>}
 */
export function confirmDialog(message, options = {}) {
  const { confirmText = 'Confirmar', cancelText = 'Cancelar' } = options;

  return new Promise(resolve => {
    const overlay = createOverlay();

    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-msg">${escapeHtml(message)}</div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel">${escapeHtml(cancelText)}</button>
          <button class="modal-btn modal-btn-confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const confirmBtn = overlay.querySelector('.modal-btn-confirm');
    const cancelBtn = overlay.querySelector('.modal-btn-cancel');

    const close = (result) => {
      overlay.classList.add('modal-closing');
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };

    confirmBtn.addEventListener('click', () => close(true));
    cancelBtn.addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-open'));
    confirmBtn.focus();
  });
}

/**
 * Show a prompt dialog
 * @param {string} message - Prompt message
 * @param {object} options - { placeholder, defaultValue, confirmText, cancelText }
 * @returns {Promise<string|null>}
 */
export function promptDialog(message, options = {}) {
  const {
    placeholder = '',
    defaultValue = '',
    confirmText = 'OK',
    cancelText = 'Cancelar',
  } = options;

  return new Promise(resolve => {
    const overlay = createOverlay();

    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-msg">${escapeHtml(message)}</div>
        <input type="text" class="modal-input" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(defaultValue)}">
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel">${escapeHtml(cancelText)}</button>
          <button class="modal-btn modal-btn-confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const input = overlay.querySelector('.modal-input');
    const confirmBtn = overlay.querySelector('.modal-btn-confirm');
    const cancelBtn = overlay.querySelector('.modal-btn-cancel');

    const close = (result) => {
      overlay.classList.add('modal-closing');
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };

    confirmBtn.addEventListener('click', () => close(input.value));
    cancelBtn.addEventListener('click', () => close(null));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') close(input.value);
      if (e.key === 'Escape') close(null);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-open'));
    input.focus();
    input.select();
  });
}

// --- Helpers ---

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  return overlay;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
