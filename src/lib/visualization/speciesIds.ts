export const SPECIES_IDS = ["humans", "cattle", "chickens", "pigeons"] as const;
export type SpeciesId = (typeof SPECIES_IDS)[number];

export function isSpeciesId(s: string): s is SpeciesId {
  return (SPECIES_IDS as readonly string[]).includes(s);
}
