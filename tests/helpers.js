/**
 * Test helpers — localStorage mock and character factory
 */

class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) { return this.store[key] ?? null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
  get length() { return Object.keys(this.store).length; }
  key(i) { return Object.keys(this.store)[i] ?? null; }
}

export function setupLocalStorage() {
  const storage = new MockStorage();
  globalThis.localStorage = storage;
  return storage;
}

export function createMockCharacterData(overrides = {}) {
  return {
    id: 'test-char',
    identidade: {
      nome: 'Test',
      elemento: 'fire',
      subclasse: '',
      nivel: 1,
      xp_atual: 0,
      xp_proximo_nivel: 0,
      marco: 'Iniciante',
      idade: '20',
      genero: 'M',
      alinhamento: 'Neutro',
      aparncia: '',
      historia: '',
    },
    atributos: { FOR: 10, AGI: 10, CHI: 10, PER: 10, RES: 10, ESP: 10 },
    pontos_disponiveis: 0,
    stats_derived: {},
    habilidades: {},
    itens: [],
    equipamentos: { arma: null, armadura: null, acessorio: null },
    status_effects: [],
    inventario: [],
    ouro: 100,
    moedas: { fire_coins: 0, water_coins: 0, earth_coins: 0, air_coins: 0, universal_coins: 0 },
    scrolls: {},
    subclass_bonus: {},
    anotacoes: '',
    ...overrides,
  };
}

/**
 * Minimal Character-like object for tests that need character methods
 */
export function createMockCharacter(overrides = {}) {
  const data = createMockCharacterData(overrides);
  return {
    data,
    getData() { return this.data; },
    serialize() { return JSON.parse(JSON.stringify(this.data)); },
    load(newData) { this.data = newData; },
    notify() {},
    getGold() { return this.data.ouro || 0; },
    addGold(amount) { this.data.ouro = (this.data.ouro || 0) + amount; },
    spendGold(amount) {
      if ((this.data.ouro || 0) < amount) return false;
      this.data.ouro -= amount;
      return true;
    },
  };
}
