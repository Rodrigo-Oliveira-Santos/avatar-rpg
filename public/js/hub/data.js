/**
 * Hub Mock Data
 * Mock player characters for Phase 1 demo
 */

export const MOCK_PLAYERS = [
  {
    id: 'player-1',
    name: 'Kael',
    element: 'fire',
    level: 12,
    hp: 98,
    hpMax: 118,
    chi: 66,
    chiMax: 66,
    espiritu: 80,
    espirituMax: 80,
    defense: 27,
    dodge: 13,
    subclass: null,
    buffs: [
      { name: 'Regeneração', type: 'positive' },
    ],
    debuffs: [],
  },
  {
    id: 'player-2',
    name: 'Yuki',
    element: 'water',
    level: 10,
    hp: 87,
    hpMax: 87,
    chi: 50,
    chiMax: 54,
    espiritu: 68,
    espirituMax: 68,
    defense: 24,
    dodge: 14,
    subclass: 'Cura Avançada',
    buffs: [],
    debuffs: [],
  },
  {
    id: 'player-3',
    name: 'Toph',
    element: 'earth',
    level: 15,
    hp: 130,
    hpMax: 145,
    chi: 41,
    chiMax: 46,
    espiritu: 62,
    espirituMax: 62,
    defense: 38,
    dodge: 11,
    subclass: 'Dobra de Metal',
    buffs: [
      { name: 'Escudo', type: 'positive' },
    ],
    debuffs: [
      { name: 'Lentidão', type: 'negative' },
    ],
  },
  {
    id: 'player-4',
    name: 'Jinora',
    element: 'air',
    level: 8,
    hp: 62,
    hpMax: 62,
    chi: 60,
    chiMax: 60,
    espiritu: 74,
    espirituMax: 74,
    defense: 19,
    dodge: 16,
    subclass: null,
    buffs: [],
    debuffs: [],
  },
  {
    id: 'player-5',
    name: 'Sokka',
    element: 'none',
    level: 11,
    hp: 45,
    hpMax: 110,
    chi: 30,
    chiMax: 46,
    espiritu: 55,
    espirituMax: 55,
    defense: 30,
    dodge: 13,
    subclass: 'Estrategista',
    buffs: [],
    debuffs: [
      { name: 'Sangramento', type: 'negative' },
    ],
  },
];

/**
 * Get mock players
 * @returns {object[]}
 */
export function getPlayers() {
  return [...MOCK_PLAYERS];
}
