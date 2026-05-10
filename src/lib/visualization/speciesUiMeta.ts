import type { SpeciesId } from "./speciesIds";

export const SPECIES_VIZ_COLORS: Record<SpeciesId, number> = {
  humans: 0x38bdf8,
  cattle: 0xfb923c,
  chickens: 0xfacc15,
  pigeons: 0xc4b5fd,
};

export const SPECIES_CHECKBOX_LABEL: Record<SpeciesId, string> = {
  humans: "Humains (points sur les terres émergées)",
  cattle: "Bovins (densité visuelle majorée là où l’élevage est courant — approximation)",
  chickens: "Volailles (même logique d’approximation)",
  pigeons: "Pigeons (biais très grossier zones tempérées — à affiner avec données)",
};
