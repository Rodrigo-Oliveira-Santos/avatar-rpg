/**
 * Character subclass definitions and helpers
 */

export const SUBCLASSES = {
  fire: [
    { id: 'blue_fire', name: 'Raio Azul', description: 'Fogo azul intenso, mais quente e preciso.', requirements: { nivel: 10, CHI: 14 }, bonus: { CHI: 2 } },
    { id: 'lightning', name: 'Relâmpago', description: 'Geração e redireção de relâmpagos.', requirements: { nivel: 15, PER: 12, AGI: 12 }, bonus: { PER: 1, AGI: 1 } },
    { id: 'combustion', name: 'Combustão', description: 'Explosões concentradas de calor à distância.', requirements: { nivel: 20, FOR: 14, CHI: 12 }, bonus: { FOR: 2 } },
  ],
  water: [
    { id: 'blood_bending', name: 'Dobra de Sangue', description: 'Controlo do corpo de outros seres vivos.', requirements: { nivel: 15, CHI: 16, ESP: 12 }, bonus: { CHI: 2 } },
    { id: 'healing', name: 'Cura Avançada', description: 'Cura profunda com água espiritual.', requirements: { nivel: 10, ESP: 14 }, bonus: { ESP: 2 } },
    { id: 'ice_mastery', name: 'Mestre do Gelo', description: 'Controlo total sobre gelo e cristais.', requirements: { nivel: 12, RES: 12, CHI: 12 }, bonus: { RES: 1, CHI: 1 } },
  ],
  earth: [
    { id: 'metal_bending', name: 'Dobra de Metal', description: 'Manipulação de metais refinados.', requirements: { nivel: 12, FOR: 14, PER: 12 }, bonus: { FOR: 1, PER: 1 } },
    { id: 'lava_bending', name: 'Dobra de Lava', description: 'Transformar terra em magma ardente.', requirements: { nivel: 18, FOR: 16, CHI: 12 }, bonus: { FOR: 2 } },
    { id: 'seismic_sense', name: 'Sentido Sísmico', description: 'Percepção total através de vibrações.', requirements: { nivel: 10, PER: 16 }, bonus: { PER: 2 } },
  ],
  air: [
    { id: 'spiritual_proj', name: 'Projeção Espiritual', description: 'Projetar o espírito para outros planos.', requirements: { nivel: 15, ESP: 16, CHI: 12 }, bonus: { ESP: 2 } },
    { id: 'flight', name: 'Voo', description: 'Libertar-se da gravidade completamente.', requirements: { nivel: 20, AGI: 16, ESP: 14 }, bonus: { AGI: 2 } },
    { id: 'sound_bending', name: 'Dobra de Som', description: 'Manipular ondas sonoras com o ar.', requirements: { nivel: 12, PER: 14, AGI: 12 }, bonus: { PER: 1, AGI: 1 } },
  ],
  none: [
    { id: 'strategist', name: 'Estrategista', description: 'Mente brilhante, planos infalíveis.', requirements: { nivel: 8, PER: 14 }, bonus: { PER: 2 } },
    { id: 'artisan', name: 'Artesão', description: 'Mestre em criar armas e equipamentos.', requirements: { nivel: 10, FOR: 12, PER: 12 }, bonus: { FOR: 1, PER: 1 } },
    { id: 'healer', name: 'Curandeiro', description: 'Conhecimento profundo de ervas e medicina.', requirements: { nivel: 8, ESP: 14 }, bonus: { ESP: 2 } },
  ],
};

function normalizeSubclassValue(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getSubclassesForElement(element) {
  return SUBCLASSES[element] || [];
}

export function getAllSubclasses() {
  return Object.values(SUBCLASSES).flat();
}

export function findSubclassDefinition(value, preferredElement = null) {
  if (!value) return null;

  const normalized = normalizeSubclassValue(value);
  const pools = preferredElement
    ? [getSubclassesForElement(preferredElement), getAllSubclasses()]
    : [getAllSubclasses()];

  for (const pool of pools) {
    const match = pool.find(subclass => {
      const idMatch = normalizeSubclassValue(subclass.id) === normalized;
      const nameMatch = normalizeSubclassValue(subclass.name) === normalized;
      return idMatch || nameMatch;
    });

    if (match) return match;
  }

  return null;
}
