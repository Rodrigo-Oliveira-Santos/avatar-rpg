/**
 * Auth Manager
 * Handles login overlay, session state, and auth UI
 */

import { on, $, $$ } from '../utils/dom.js';
import * as authAPI from '../api/auth.js';

/**
 * AuthManager Class
 */
export class AuthManager {
  /**
   * @param {object} options
   * @param {Function} options.onLoginSuccess - Called after successful login
   * @param {Function} options.onLogout - Called after logout
   */
  constructor({ onLoginSuccess, onLogout } = {}) {
    this.onLoginSuccess = onLoginSuccess;
    this.onLogout = onLogout;
    this.currentUser = null;
  }

  /**
   * Check if user has a valid session
   * @returns {Promise<object|null>} User data or null
   */
  async checkSession() {
    try {
      this.currentUser = await authAPI.getMe();
      return this.currentUser;
    } catch {
      this.currentUser = null;
      return null;
    }
  }

  /**
   * Show the login overlay and bind form events
   */
  showLogin() {
    const overlay = $('#login-overlay');
    if (!overlay) return;
    overlay.classList.add('on');

    const form = $('#login-form');
    if (form && !form._authBound) {
      form._authBound = true;
      on(form, 'submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }
  }

  /**
   * Hide the login overlay
   */
  hideLogin() {
    const overlay = $('#login-overlay');
    if (overlay) overlay.classList.remove('on');
  }

  /**
   * Handle login form submission
   */
  async handleLogin() {
    const usernameInput = $('#login-username');
    // BYPASS TEMPORÁRIO: passwordInput comentado (reverter: descomentar e restaurar validação abaixo)
    // const passwordInput = $('#login-password');
    const errorEl = $('#login-error');
    const btn = $('#login-btn');

    const username = usernameInput?.value?.trim();
    // BYPASS TEMPORÁRIO: password comentada
    // const password = passwordInput?.value;

    // BYPASS TEMPORÁRIO: validação original comentada (reverter: trocar por `if (!username || !password)`)
    if (!username) {
      if (errorEl) errorEl.textContent = 'Preencha o nome de utilizador.';
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }
    if (errorEl) errorEl.textContent = '';

    try {
      // BYPASS TEMPORÁRIO: login sem password (reverter: authAPI.login(username, password))
      const result = await authAPI.login(username);
      if (result.token) {
        localStorage.setItem('avatar_rpg_token', result.token);
      }

      this.currentUser = result.user || { username };
      this.hideLogin();
      this.onLoginSuccess?.(this.currentUser);
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message || 'Erro ao entrar. Tente novamente.';
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
    }
  }

  /**
   * Logout the current user
   */
  async logout() {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout errors
    }

    localStorage.removeItem('avatar_rpg_token');
    this.currentUser = null;
    this.onLogout?.();
    this.showLogin();
  }

  /**
   * Get the current user
   * @returns {object|null}
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Check if user has a specific role
   * @param {string} role - 'player', 'gm', or 'admin'
   * @returns {boolean}
   */
  hasRole(role) {
    if (!this.currentUser) return false;
    const hierarchy = { player: 0, gm: 1, admin: 2 };
    return (hierarchy[this.currentUser.role] || 0) >= (hierarchy[role] || 0);
  }
}
