/**
 * Tests for the Minecraft user-lists API (playlists tipo YouTube).
 */

import { describe, it, expect, beforeEach } from 'vitest';

let lists;

beforeEach(async () => {
  global.localStorage = {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; },
  };
  localStorage.setItem('mc_user', JSON.stringify({ username: 'alice', role: 'player' }));
  lists = await import('../public/js/api/mc-lists.js');
});

describe('ensureDefaultList', () => {
  it('cria lista "Favoritos" no primeiro uso', () => {
    const l = lists.ensureDefaultList();
    expect(l.name).toBe('Favoritos');
    expect(lists.listLists()).toHaveLength(1);
  });

  it('é idempotente', () => {
    lists.ensureDefaultList();
    lists.ensureDefaultList();
    expect(lists.listLists()).toHaveLength(1);
  });
});

describe('createList / renameList / deleteList', () => {
  it('createList adiciona', () => {
    const a = lists.createList('Castles');
    const b = lists.createList('Redstone');
    expect(lists.listLists()).toHaveLength(2);
    expect(lists.listLists().map((l) => l.name)).toEqual(['Castles', 'Redstone']);
    expect(a.id).not.toBe(b.id);
  });

  it('renameList muda o nome', () => {
    const a = lists.createList('Castles');
    lists.renameList(a.id, 'Castelos');
    expect(lists.listLists()[0].name).toBe('Castelos');
  });

  it('deleteList remove', () => {
    const a = lists.createList('Castles');
    lists.deleteList(a.id);
    expect(lists.listLists()).toHaveLength(0);
  });
});

describe('addBuildToList / removeBuildFromList / isBookmarked', () => {
  it('add e remove funcionam', () => {
    const l = lists.createList('A');
    lists.addBuildToList(l.id, 'build-1');
    expect(lists.isBookmarked('build-1')).toBe(true);
    expect(lists.listsContainingBuild('build-1')).toEqual([l.id]);
    lists.removeBuildFromList(l.id, 'build-1');
    expect(lists.isBookmarked('build-1')).toBe(false);
  });

  it('não duplica IDs', () => {
    const l = lists.createList('A');
    lists.addBuildToList(l.id, 'build-1');
    lists.addBuildToList(l.id, 'build-1');
    expect(lists.listLists()[0].build_ids).toEqual(['build-1']);
  });
});

describe('setListsForBuild', () => {
  it('sincroniza presenças entre listas', () => {
    const a = lists.createList('A');
    const b = lists.createList('B');
    const c = lists.createList('C');

    lists.setListsForBuild('build-1', [a.id, b.id]);
    expect(lists.listsContainingBuild('build-1').sort()).toEqual([a.id, b.id].sort());

    lists.setListsForBuild('build-1', [c.id]);
    expect(lists.listsContainingBuild('build-1')).toEqual([c.id]);

    lists.setListsForBuild('build-1', []);
    expect(lists.isBookmarked('build-1')).toBe(false);
  });
});

describe('isolamento por utilizador', () => {
  it('cada utilizador tem as suas listas', () => {
    lists.createList('Alice list');
    localStorage.setItem('mc_user', JSON.stringify({ username: 'bob', role: 'player' }));
    expect(lists.listLists()).toEqual([]);
    lists.createList('Bob list');
    expect(lists.listLists().map((l) => l.name)).toEqual(['Bob list']);
    // alice continua a ver só a sua
    localStorage.setItem('mc_user', JSON.stringify({ username: 'alice', role: 'player' }));
    expect(lists.listLists().map((l) => l.name)).toEqual(['Alice list']);
  });
});

describe('purgeBuildAcrossAllLists', () => {
  it('remove o build de todas as listas do user atual', () => {
    const a = lists.createList('A');
    const b = lists.createList('B');
    lists.addBuildToList(a.id, 'build-1');
    lists.addBuildToList(b.id, 'build-1');
    lists.purgeBuildAcrossAllLists('build-1');
    expect(lists.isBookmarked('build-1')).toBe(false);
  });
});

describe('falhas sem sessão', () => {
  it('createList lança sem sessão', () => {
    localStorage.removeItem('mc_user');
    expect(() => lists.createList('X')).toThrow(/sessão/i);
  });
});
