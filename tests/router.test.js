/**
 * Router tests — verify the hash router dispatches to the right module
 * and properly unmounts the previous one when switching games.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Provide a minimal `window` so the router (browser-targeted) works in Node.
function setupBrowserEnv() {
  const listeners = {};
  globalThis.window = {
    location: { hash: '' },
    addEventListener: (evt, cb) => { (listeners[evt] ||= []).push(cb); },
    removeEventListener: (evt, cb) => {
      listeners[evt] = (listeners[evt] || []).filter((fn) => fn !== cb);
    },
    _fireHashChange() { (listeners.hashchange || []).forEach((fn) => fn()); },
  };
  return globalThis.window;
}

function mockModule() {
  return { mount: vi.fn(), unmount: vi.fn() };
}

beforeEach(() => {
  setupBrowserEnv();
  vi.resetModules();
});

describe('router', () => {
  it('mounts the default game when no hash is present', async () => {
    const { router } = await import('../public/js/router.js');
    const avatar = mockModule();
    router.register('avatar', avatar);
    router.start();
    expect(avatar.mount).toHaveBeenCalledTimes(1);
  });

  it('dispatches to the correct game from the hash', async () => {
    window.location.hash = '#/dnd';
    const { router } = await import('../public/js/router.js');
    const avatar = mockModule();
    const dnd = mockModule();
    router.register('avatar', avatar);
    router.register('dnd', dnd);
    router.start();
    expect(dnd.mount).toHaveBeenCalledTimes(1);
    expect(avatar.mount).not.toHaveBeenCalled();
  });

  it('unmounts the previous module when switching games', async () => {
    const { router } = await import('../public/js/router.js');
    const avatar = mockModule();
    const dnd = mockModule();
    router.register('avatar', avatar);
    router.register('dnd', dnd);

    window.location.hash = '#/avatar';
    router.start();
    expect(avatar.mount).toHaveBeenCalledTimes(1);

    window.location.hash = '#/dnd';
    window._fireHashChange();

    expect(avatar.unmount).toHaveBeenCalledTimes(1);
    expect(dnd.mount).toHaveBeenCalledTimes(1);
  });

  it('parses page and params from the hash', async () => {
    window.location.hash = '#/dnd/sheet/abc-123';
    const { router } = await import('../public/js/router.js');
    const dnd = mockModule();
    router.register('dnd', dnd);
    router.start();
    expect(dnd.mount).toHaveBeenCalledWith({ game: 'dnd', page: 'sheet', params: ['abc-123'] });
  });

  it('navigate() updates the hash', async () => {
    const { router } = await import('../public/js/router.js');
    router.navigate('minecraft', 'build', 'xyz');
    expect(window.location.hash).toBe('#/minecraft/build/xyz');
  });

  it('throws when registering a module without mount()', async () => {
    const { router } = await import('../public/js/router.js');
    expect(() => router.register('broken', {})).toThrow(/mount/);
  });
});
