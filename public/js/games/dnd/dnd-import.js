/**
 * D&D — Importação e armazenamento de packs SRD (GM only).
 *
 * 4 domínios, todos guardados em localStorage:
 *   • spells       → `dnd_imported_spells`
 *   • subclasses   → `dnd_imported_subclasses`
 *   • magic_items  → `dnd_imported_magic_items`
 *   • races        → `dnd_imported_races`
 *
 * Cada domínio aceita um JSON com um array de objetos. Os validadores
 * abaixo garantem o shape mínimo; campos extra são preservados.
 *
 * Em Supabase opt-in podem futuramente ir para tabelas próprias, mas
 * por agora o conteúdo é purely client-side (igual ao padrão Avatar).
 */

export const DOMAINS = ['spells', 'subclasses', 'magic_items', 'races'];

export const DOMAIN_LABELS = {
  spells:      'Magias',
  subclasses:  'Subclasses',
  magic_items: 'Itens Mágicos',
  races:       'Raças',
};

const STORAGE_KEYS = {
  spells:      'dnd_imported_spells',
  subclasses:  'dnd_imported_subclasses',
  magic_items: 'dnd_imported_magic_items',
  races:       'dnd_imported_races',
};

// ─── Validators ───────────────────────────────────────────────────

const SPELL_LEVELS = [0,1,2,3,4,5,6,7,8,9];
const SPELL_SCHOOLS = ['abjuration','conjuration','divination','enchantment','evocation','illusion','necromancy','transmutation'];

function nonEmptyStr(v) { return typeof v === 'string' && v.trim().length > 0; }

const VALIDATORS = {
  spells(entry) {
    const errors = [];
    if (!nonEmptyStr(entry?.name)) errors.push('name é obrigatório');
    if (!SPELL_LEVELS.includes(Number(entry?.level))) errors.push('level deve ser 0..9');
    if (entry?.school && !SPELL_SCHOOLS.includes(String(entry.school).toLowerCase())) {
      errors.push(`school inválida: ${entry.school}`);
    }
    if (entry?.classes && !Array.isArray(entry.classes)) errors.push('classes deve ser array de strings');
    return errors;
  },
  subclasses(entry) {
    const errors = [];
    if (!nonEmptyStr(entry?.name)) errors.push('name é obrigatório');
    if (!nonEmptyStr(entry?.class)) errors.push('class é obrigatório (id da classe base, ex: "wizard")');
    if (entry?.features && !Array.isArray(entry.features)) errors.push('features deve ser array');
    return errors;
  },
  magic_items(entry) {
    const errors = [];
    if (!nonEmptyStr(entry?.name)) errors.push('name é obrigatório');
    if (entry?.rarity && !['common','uncommon','rare','very rare','legendary','artifact'].includes(String(entry.rarity).toLowerCase())) {
      errors.push(`rarity inválida: ${entry.rarity}`);
    }
    if (entry?.requires_attunement != null && typeof entry.requires_attunement !== 'boolean') {
      errors.push('requires_attunement deve ser boolean');
    }
    return errors;
  },
  races(entry) {
    const errors = [];
    if (!nonEmptyStr(entry?.name)) errors.push('name é obrigatório');
    if (entry?.ability_bonuses && typeof entry.ability_bonuses !== 'object') {
      errors.push('ability_bonuses deve ser object (ex: { STR: 2, CON: 1 })');
    }
    if (entry?.speed != null && !Number.isFinite(Number(entry.speed))) errors.push('speed deve ser número');
    return errors;
  },
};

/**
 * Valida um JSON inteiro (string ou array).
 * Devolve { valid:boolean, entries:[], errors:[{index, errors}] }.
 */
export function validatePack(domain, jsonText) {
  if (!DOMAINS.includes(domain)) {
    return { valid: false, entries: [], errors: [{ index: -1, errors: [`domínio desconhecido: ${domain}`] }] };
  }
  let parsed;
  try {
    parsed = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
  } catch (err) {
    return { valid: false, entries: [], errors: [{ index: -1, errors: [`JSON inválido: ${err.message}`] }] };
  }
  if (!Array.isArray(parsed)) {
    return { valid: false, entries: [], errors: [{ index: -1, errors: ['o ficheiro deve ser um array de entradas'] }] };
  }
  const errors = [];
  const entries = [];
  const validator = VALIDATORS[domain];
  parsed.forEach((entry, index) => {
    const errs = validator(entry);
    if (errs.length) errors.push({ index, errors: errs });
    entries.push(entry);
  });
  return { valid: errors.length === 0, entries, errors };
}

// ─── Storage ──────────────────────────────────────────────────────

export function loadPack(domain) {
  if (!DOMAINS.includes(domain)) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[domain]);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function savePack(domain, entries) {
  if (!DOMAINS.includes(domain)) throw new Error('domínio desconhecido');
  if (!Array.isArray(entries)) throw new Error('entries deve ser array');
  localStorage.setItem(STORAGE_KEYS[domain], JSON.stringify(entries));
}

export function clearPack(domain) {
  if (!DOMAINS.includes(domain)) return;
  localStorage.removeItem(STORAGE_KEYS[domain]);
}

export function packStats(domain) {
  const entries = loadPack(domain);
  return { count: entries.length };
}

/**
 * Carrega o pack do domínio fazendo merge com SRD built-in (se houver).
 * Por ora SRD built-in está vazio — fica como hook para futuro.
 */
export function loadCombined(domain) {
  return [...BUILT_IN_DEFAULTS[domain], ...loadPack(domain)];
}

const BUILT_IN_DEFAULTS = {
  spells: [],
  subclasses: [],
  magic_items: [],
  races: [],
};
