import { SPECIES_ENDANGERED_IDS, SPECIES_MAIN_IDS, type SpeciesId } from "./speciesIds";

export const SPECIES_VIZ_COLORS: Record<SpeciesId, number> = {
  humans: 0x38bdf8,
  cattle: 0xfb923c,
  chickens: 0xfacc15,
  tiger: 0xf97316,
  mountain_gorilla: 0x4ade80,
  black_rhino: 0xa8a29e,
  vaquita: 0x22d3ee,
};

/** Nom court sur la ligne principale (case à cocher + effectif). */
export const SPECIES_SHORT_NAME: Record<SpeciesId, string> = {
  humans: "Humains",
  cattle: "Bovins",
  chickens: "Volailles",
  tiger: "Tigre",
  mountain_gorilla: "Gorille de montagne",
  black_rhino: "Rhinocéros noir",
  vaquita: "Vaquita",
};

/** Texte d’aide au survol de la ligne (visualisation / données). */
export const SPECIES_CHECKBOX_LABEL: Record<SpeciesId, string> = {
  humans: "Humains (points sur les terres émergées)",
  cattle: "Bovins (densité visuelle majorée là où l’élevage est courant — approximation)",
  chickens: "Volailles (même logique d’approximation)",
  tiger: "Tigre (Panthera tigris) — population sauvage estimée",
  mountain_gorilla: "Gorille de montagne — population sauvage estimée",
  black_rhino: "Rhinocéros noir — population sauvage estimée",
  vaquita: "Marsouin du Golfe de Californie (vaquita) — très petit effectif sauvage",
};

/** Deux blocs de cases à cocher dans le panneau latéral. */
export const SPECIES_CHECKBOX_GROUPS: { legend: string; ids: readonly SpeciesId[] }[] = [
  { legend: "Espèces à grande échelle", ids: SPECIES_MAIN_IDS },
  { legend: "Animaux en voie de disparition (ordres de grandeur, sauvage)", ids: SPECIES_ENDANGERED_IDS },
];
