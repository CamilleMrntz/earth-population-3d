import type { Timestamp } from "firebase/firestore";

import type { SpeciesId } from "../visualization/speciesIds";

/** Firestore collection id (top-level). */
export const SPECIES_COLLECTION = "species";

/**
 * One document per species: `species/{speciesId}` avec `speciesId` parmi les ids connus de l’app.
 * Extra optional fields are safe to add later without breaking older clients.
 */
export type SpeciesFirestoreDoc = {
  speciesId: SpeciesId;
  /** Short scientific or English name (optional, for future UI / APIs). */
  nameEn?: string | null;
  /** Long UI label (same idea as `SpeciesStatRow.label`). */
  label: string;
  /** Last known headcount / population estimate used for viz scaling (not shown 1:1 as dot count). */
  population: number | null;
  /** Reference year of the estimate (survey / dataset year). */
  referenceYear: number | null;
  unit: string;
  sourceLabel: string;
  sourceUrl: string;
  status: "ok" | "error";
  errorMessage?: string | null;
  /** When this snapshot was written (server time). */
  updatedAt?: Timestamp | null;
  /** Traceability for refresh logic (World Bank indicator code, FAOSTAT item, etc.). */
  worldBankIndicatorId?: string | null;
  faostatQclItemCode?: number | null;
  /** Free-form notes (caveats, dataset version). */
  notes?: string | null;
};
