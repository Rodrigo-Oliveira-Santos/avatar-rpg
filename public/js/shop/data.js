/**
 * Shop data source.
 *
 * Resolution order when a render asks for items:
 *   1. Supabase items (warmed by `loadShopItemsFromSupabase()` on app start)
 *   2. GM-imported items (localStorage)
 *   3. MOCK_SHOP_ITEMS (only ones not already provided by sources 1 or 2)
 *
 * The async warmer is best-effort — when Supabase is off (or unreachable)
 * the sync path keeps working with imported + mock data exactly as before.
 */

import { getImportedItems } from '../import/storage.js';
import { listAll as listSupabaseItems } from '../api/items.js';

// Items fetched from Supabase, cached for the session.
let _supabaseItems = [];
let _supabaseLoaded = false;

/**
 * Warm the Supabase item cache. Safe to call multiple times; subsequent
 * calls only refresh when forced. Returns the cached array.
 */
export async function loadShopItemsFromSupabase({ force = false } = {}) {
  if (_supabaseLoaded && !force) return _supabaseItems;
  try {
    const items = await listSupabaseItems();
    _supabaseItems = Array.isArray(items) ? items : [];
    _supabaseLoaded = true;
  } catch (err) {
    console.warn('[shop.loadShopItemsFromSupabase] failed', err);
    _supabaseItems = [];
    _supabaseLoaded = true;
  }
  return _supabaseItems;
}


export const MOCK_SHOP_ITEMS = [
  {
    id: 'item-sword-basic',
    name: 'Espada de Ferro',
    description: 'Uma espada simples mas resistente, forjada em ferro comum.',
    type: 'weapon',
    rarity: 'common',
    price: 50,
    damage: '1d8',
    weight: 'medium',
    element: null,
  },
  {
    id: 'item-staff-chi',
    name: 'Bastão de Chi',
    description: 'Bastão de madeira encantada que canaliza a energia chi do portador.',
    type: 'weapon',
    rarity: 'rare',
    price: 120,
    damage: '1d6+2',
    weight: 'light',
    element: null,
  },
  {
    id: 'item-armor-leather',
    name: 'Armadura de Couro',
    description: 'Proteção leve que permite liberdade de movimento.',
    type: 'armor',
    rarity: 'common',
    price: 80,
    defense_bonus: 3,
    dodge_penalty: 0,
    weight_class: 'light',
  },
  {
    id: 'item-armor-iron',
    name: 'Armadura de Ferro',
    description: 'Proteção pesada feita de placas de ferro sobrepostas.',
    type: 'armor',
    rarity: 'rare',
    price: 200,
    defense_bonus: 7,
    dodge_penalty: 3,
    weight_class: 'heavy',
  },
  {
    id: 'item-potion-hp',
    name: 'Poção de Vida',
    description: 'Restaura 2d6 pontos de vida quando consumida.',
    type: 'consumable',
    rarity: 'common',
    price: 25,
    effect: 'Restaura 2d6 PV',
  },
  {
    id: 'item-potion-chi',
    name: 'Poção de Chi',
    description: 'Restaura 2d4 pontos de chi.',
    type: 'consumable',
    rarity: 'common',
    price: 30,
    effect: 'Restaura 2d4 Chi',
  },
  {
    id: 'scroll_slot_1',
    name: 'Pergaminho de Expansão',
    description: 'Aumenta +1 slot de sub-habilidade numa skill.',
    type: 'scroll',
    scrollType: 'slot_expand',
    price: 500,
    rarity: 'rare',
  },
  {
    id: 'scroll_slot_2',
    name: 'Pergaminho de Expansão Grande',
    description: 'Aumenta +2 slots de sub-habilidade numa skill.',
    type: 'scroll',
    scrollType: 'slot_expand',
    scrollValue: 2,
    price: 1200,
    rarity: 'epic',
  },
  {
    id: 'scroll_mastery',
    name: 'Pergaminho de Maestria',
    description: 'Marca uma skill como "Dominada", desbloqueando sub-skills bónus.',
    type: 'scroll',
    scrollType: 'mastery',
    price: 2000,
    rarity: 'legendary',
  },
  {
    id: 'item-scroll-fire',
    name: 'Pergaminho de Fogo',
    description: 'Um pergaminho antigo que melhora habilidades de fogo.',
    type: 'accessory',
    rarity: 'rare',
    price: 150,
    nationPrice: { currency: 'fire_coins', amount: 50 },
    element: 'fire',
    effect: '+1 dano em habilidades de Fogo',
  },
  {
    id: 'item-ring-spirit',
    name: 'Anel Espiritual',
    description: 'Um anel de jade que fortalece a conexão espiritual.',
    type: 'accessory',
    rarity: 'epic',
    price: 350,
    effect: '+2 ESP',
  },
  {
    id: 'item-cloak-shadow',
    name: 'Manto das Sombras',
    description: 'Um manto lendário tecido na escuridão do Mundo Espiritual.',
    type: 'armor',
    rarity: 'legendary',
    price: 800,
    defense_bonus: 5,
    dodge_penalty: -2,
    weight_class: 'light',
    effect: '+4 Esquiva, furtividade',
  },
  {
    id: 'item-bomb-smoke',
    name: 'Bomba de Fumo',
    description: 'Cria uma nuvem de fumo que obscurece a visão numa área.',
    type: 'consumable',
    rarity: 'common',
    price: 15,
    nationPrice: { currency: 'universal_coins', amount: 12 },
    effect: 'Cegueira (área) por 1 turno',
  },
  {
    id: 'item-water-skin',
    name: 'Cantil de Água Espiritual',
    description: 'Água abençoada do Oásis dos Espíritos. Usada para cura avançada.',
    type: 'consumable',
    rarity: 'epic',
    price: 250,
    nationPrice: { currency: 'water_coins', amount: 60 },
    element: 'water',
    effect: 'Restaura 4d6 PV + remove debuffs',
  },
  {
    id: 'item-earth-gauntlets',
    name: 'Manoplas de Terra',
    description: 'Pesadas manoplas reforçadas com cristais de terra.',
    type: 'weapon',
    rarity: 'rare',
    price: 180,
    nationPrice: { currency: 'earth_coins', amount: 55 },
    damage: '1d10',
    weight: 'heavy',
    element: 'earth',
  },
];

/**
 * Get shop items: Supabase (warmed) → imported → mock.
 * Sources are merged by `name` (later sources don't override earlier ones).
 * @param {string} [category] - Filter by type
 * @param {string} [search] - Search by name/description
 * @returns {object[]}
 */
export function getShopItems(category = 'all', search = '') {
  const supabaseRaw = _supabaseItems || [];
  const importedRaw = getImportedItems();
  // Build the "known names" set from RAW lists (including items that are
  // currently hidden via `in_shop === false`) so that a hidden imported
  // override correctly suppresses the mock fallback for the same name.
  // Without this, applying a profile that marks a mock as hidden would
  // still resurface the original mock through the fallback path below.
  const supabaseNames = new Set(supabaseRaw.map((i) => i.name));
  const importedNames = new Set(importedRaw.map((i) => i.name));
  const knownNames = new Set([...supabaseNames, ...importedNames]);

  const supabase = supabaseRaw.filter((i) => i.in_shop !== false);
  const imported = importedRaw
    .filter((i) => i.in_shop !== false)
    .filter((i) => !supabaseNames.has(i.name));
  const mockFiltered = MOCK_SHOP_ITEMS.filter((m) => !knownNames.has(m.name));
  let items = [...supabase, ...imported, ...mockFiltered];

  if (category && category !== 'all') {
    items = items.filter((i) => i.type === category);
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q)
    );
  }

  return items;
}

/**
 * Variant of {@link getShopItems} used by the GM manage UI: returns
 * EVERY item the catalogue knows about — visible (`in_shop !== false`)
 * AND hidden (`in_shop === false`). Without this, an item the GM
 * accidentally toggled off would vanish from the management table and
 * become unrecoverable without going through a profile.
 *
 * Override priority is the same as the player view: supabase > imported > mock.
 */
export function getAllManagedItems() {
  const supabaseRaw = _supabaseItems || [];
  const importedRaw = getImportedItems();
  const supabaseNames = new Set(supabaseRaw.map((i) => i.name));
  const importedNames = new Set(importedRaw.map((i) => i.name));
  const knownNames = new Set([...supabaseNames, ...importedNames]);
  const imported = importedRaw.filter((i) => !supabaseNames.has(i.name));
  const mocks = MOCK_SHOP_ITEMS.filter((m) => !knownNames.has(m.name));
  return [...supabaseRaw, ...imported, ...mocks];
}
