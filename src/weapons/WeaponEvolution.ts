export interface EvolutionRecipe {
  weaponId: string;
  requiresPassive: string;
  resultId: string;
  resultName: string;
}

export const EVOLUTION_RECIPES: EvolutionRecipe[] = [
  {
    weaponId: 'knife',
    requiresPassive: 'bracer',
    resultId: 'thousand_edge',
    resultName: 'Bin Kesik'
  },
  {
    weaponId: 'whip',
    requiresPassive: 'hollow_heart',
    resultId: 'bloody_tear',
    resultName: 'Kanlı Yırtık'
  },
  {
    weaponId: 'garlic',
    requiresPassive: 'pummarola',
    resultId: 'soul_eater',
    resultName: 'Ruh Yiyen'
  }
];

export function getEvolution(weaponId: string, passiveIds: string[]): EvolutionRecipe | null {
  return EVOLUTION_RECIPES.find(
    r => r.weaponId === weaponId && passiveIds.includes(r.requiresPassive)
  ) ?? null;
}
