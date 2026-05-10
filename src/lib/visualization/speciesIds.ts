/** Espèces avec flux distant (Banque mondiale / FAOSTAT) ou logique « courante ». */
export const SPECIES_MAIN_IDS = ["humans", "cattle", "chickens"] as const;

/** Sous-ensemble « menacées » : chiffres indicatifs (sauvage), enrichissables plus tard. */
export const SPECIES_ENDANGERED_IDS = ["tiger", "mountain_gorilla", "black_rhino", "vaquita"] as const;

export const SPECIES_IDS = [...SPECIES_MAIN_IDS, ...SPECIES_ENDANGERED_IDS] as const;
export type SpeciesId = (typeof SPECIES_IDS)[number];

export function isSpeciesId(s: string): s is SpeciesId {
  return (SPECIES_IDS as readonly string[]).includes(s);
}

export function isEndangeredSpeciesId(id: SpeciesId): boolean {
  return (SPECIES_ENDANGERED_IDS as readonly string[]).includes(id);
}
