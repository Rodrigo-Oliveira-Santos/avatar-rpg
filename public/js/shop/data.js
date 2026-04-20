/**
 * Shop Mock Data
 * Hardcoded items for Phase 1 demo
 */

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
    id: 'item-scroll-fire',
    name: 'Pergaminho de Fogo',
    description: 'Um pergaminho antigo que melhora habilidades de fogo.',
    type: 'accessory',
    rarity: 'rare',
    price: 150,
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
    effect: 'Cegueira (área) por 1 turno',
  },
  {
    id: 'item-water-skin',
    name: 'Cantil de Água Espiritual',
    description: 'Água abençoada do Oásis dos Espíritos. Usada para cura avançada.',
    type: 'consumable',
    rarity: 'epic',
    price: 250,
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
    damage: '1d10',
    weight: 'heavy',
    element: 'earth',
  },
];

/**
 * Get mock shop items, optionally filtered
 * @param {string} [category] - Filter by type
 * @param {string} [search] - Search by name/description
 * @returns {object[]}
 */
export function getShopItems(category = 'all', search = '') {
  let items = [...MOCK_SHOP_ITEMS];

  if (category && category !== 'all') {
    items = items.filter(i => i.type === category);
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    );
  }

  return items;
}
