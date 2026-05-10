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
  pigeons: {
    faostatQclItemCode: 1079,
    notes: "Code article FAOSTAT à valider selon révision de la base.",
  },
};
