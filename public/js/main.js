/**
 * Avatar RPG — Main Entry Point
 * Bootstraps the application
 */

import { App } from './app.js';

/**
 * Initialize application when DOM is ready
 */
function init() {
  console.log('[Main] Starting Avatar RPG...');

  // Create global app instance
  window.app = new App();

  console.log('[Main] Avatar RPG initialized');
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
