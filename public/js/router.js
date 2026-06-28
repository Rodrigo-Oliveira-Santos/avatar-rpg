/**
 * Tiny hash router for the multi-game platform.
 *
 * URL shape: `#/<game>[/<page>[/<param>...]]`
 *
 * Usage:
 *   import { router } from './router.js';
 *   router.register('avatar', avatarModule);
 *   router.register('dnd',    dndModule);
 *   router.register('minecraft', mcModule);
 *   router.start();
 *
 * Each module must expose `{ mount(route), unmount() }` where `route` is
 * `{ game, page, params }`. Modules are mounted lazily and unmounted before
 * switching to another game so they can release listeners/DOM.
 */

const DEFAULT_GAME = 'landing';

function parseHash(hash) {
  const cleaned = (hash || '').replace(/^#\/?/, '').trim();
  if (!cleaned) return { game: DEFAULT_GAME, page: null, params: [] };
  const [game, page, ...params] = cleaned.split('/');
  return { game, page: page || null, params };
}

export class Router {
  constructor() {
    this.modules = new Map();
    this.current = null; // { game, module }
    this._onHashChange = this._onHashChange.bind(this);
  }

  register(game, module) {
    if (typeof module?.mount !== 'function') {
      throw new Error(`Router: module for "${game}" must expose mount()`);
    }
    this.modules.set(game, module);
  }

  start() {
    window.addEventListener('hashchange', this._onHashChange);
    this._onHashChange();
  }

  stop() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  navigate(game, page = null, ...params) {
    const tail = [page, ...params].filter(Boolean).join('/');
    window.location.hash = `#/${game}${tail ? `/${tail}` : ''}`;
  }

  _onHashChange() {
    const route = parseHash(window.location.hash);
    const module = this.modules.get(route.game) || this.modules.get(DEFAULT_GAME);

    if (this.current && this.current.module !== module) {
      try {
        this.current.module.unmount?.();
      } catch (err) {
        console.warn('[router] unmount failed', err);
      }
    }

    if (!module) {
      console.warn(`[router] no module registered for "${route.game}"`);
      return;
    }

    this.current = { game: route.game, module };
    try {
      module.mount(route);
    } catch (err) {
      console.error('[router] mount failed', err);
    }
  }
}

export const router = new Router();
