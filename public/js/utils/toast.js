/**
 * Custom Toast & Modal System
 * Replaces native alert/confirm/prompt with styled components
 */

let toastContainer = null;
let clearAllBtn = null;

function refreshClearAllButton() {
  if (!toastContainer) return;
  const toastCount = toastContainer.querySelectorAll('.toast').length;
  if (toastCount >= 2 && !clearAllBtn) {
    clearAllBtn = document.createElement('button');
    clearAllBtn.type = 'button';
    clearAllBtn.className = 'toast-clear-all';
    clearAllBtn.textContent = 'Limpar tudo';
    clearAllBtn.addEventListener('click', () => {
      toastContainer.querySelectorAll('.toast').forEach((el) => dismissToast(el));
    });
    toastContainer.insertBefore(clearAllBtn, toastContainer.firstChild);
  } else if (toastCount < 2 && clearAllBtn) {
    clearAllBtn.remove();
    clearAllBtn = null;
  }
}

function dismissToast(el) {
  if (!el || el.dataset.dismissed === '1') return;
  el.dataset.dismissed = '1';
  el.classList.remove('show');
  el.classList.add('hide');
  setTimeout(() => {
    el.remove();
    refreshClearAllButton();
  }, 300);
}

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
 * @param {number} duration - Auto-dismiss in ms (default 3000). Pass 0 to keep it sticky.
 */
export function toast(message, type = 'info', duration = 3000) {
  const container = getToastContainer();

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Fechar">×</button>
  `;

  el.querySelector('.toast-close').addEventListener('click', () => dismissToast(el));

  container.appendChild(el);
  refreshClearAllButton();

  // Trigger animation
  requestAnimationFrame(() => el.classList.add('show'));

  // Auto-dismiss (skip when duration <= 0 for sticky toasts)
  if (duration > 0) {
    setTimeout(() => dismissToast(el), duration);
  }
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
    requestAnimationFrame(() => { overlay.classList.remove('modal-closing'); overlay.classList.add('modal-open'); });
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
    requestAnimationFrame(() => { overlay.classList.remove('modal-closing'); overlay.classList.add('modal-open'); });
    input.focus();
    input.select();
  });
}

// --- Helpers ---

function createOverlay() {
  const overlay = document.createElement('div');
  // Start in `modal-closing` so opacity is 0; toast.js dialogs flip to
  // `modal-open` on requestAnimationFrame to fade-in. Ad-hoc modals that
  // bypass this helper (e.g. StatusEffectManager) just use the bare
  // `.modal-overlay` class and appear immediately.
  overlay.className = 'modal-overlay modal-closing';
  return overlay;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
