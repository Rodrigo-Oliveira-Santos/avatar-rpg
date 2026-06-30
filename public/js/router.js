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
 *
 * Importante: `unmount`/`mount` podem ser async. O router aguarda
 * sempre o `unmount` do módulo anterior antes de chamar `mount` do
 * novo, e serializa transições concorrentes (se o user clicar várias
 * vezes em rápida sucessão) através de uma promise interna. Isto
 * evita ter dois `.game-root.on` em simultâneo (bug "X aparece por
 * baixo da landing").
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
    this._transition = Promise.resolve();
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
    // Serializa: a próxima transição só corre depois de a anterior
    // terminar (mount/unmount podem ser async).
    this._transition = this._transition.then(() => this._switchTo(route));
  }

  async _switchTo(route) {
    const module = this.modules.get(route.game) || this.modules.get(DEFAULT_GAME);
    if (!module) {
      console.warn(`[router] no module registered for "${route.game}"`);
      return;
    }

    if (this.current && this.current.module !== module) {
      try {
        await this.current.module.unmount?.();
      } catch (err) {
        console.warn('[router] unmount failed', err);
      }
    }

    this.current = { game: route.game, module };
    try {
      await module.mount(route);
    } catch (err) {
      console.error('[router] mount failed', err);
    }
  }
}

export const router = new Router();
