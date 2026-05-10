import type { SpeciesId } from "../visualization/speciesIds";

/** Provenance metadata stored next to population (helps future re-sync / debugging). */
export const SPECIES_REMOTE_META: Record<
  SpeciesId,
  { worldBankIndicatorId?: string; faostatQclItemCode?: number; notes?: string }
> = {
  humans: {
    worldBankIndicatorId: "SP.POP.TOTL",
    notes: "Banque mondiale — agrégat monde (WLD).",
  },
  cattle: {
    faostatQclItemCode: 1808,
    notes: "FAOSTAT QCL stocks / secours local si API indispo.",
  },
  chickens: {
    faostatQclItemCode: 1058,
    notes: "FAOSTAT QCL stocks / secours local si API indispo.",
  },
  tiger: {
    notes: "Effectif sauvage — synthèse type Liste rouge IUCN / rapports nationaux ; pas de flux FAOSTAT.",
  },
  mountain_gorilla: {
    notes: "Gorilla beringei beringei — estimations census régionaux (Virunga, Bwindi…).",
  },
  black_rhino: {
    notes: "Diceros bicornis — agrégats sauvage (Afrique de l’Est / Sud).",
  },
  vaquita: {
    notes: "Phocoena sinus — effectif critique du golfe de Californie.",
  },
};
