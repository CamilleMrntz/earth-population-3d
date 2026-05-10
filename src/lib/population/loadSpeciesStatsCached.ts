import { readCachedSpeciesRows, writeSpeciesRows } from "../firestore/speciesRepository";
import { fetchSpeciesStats } from "./fetchSpeciesStats";
import type { SpeciesStatRow } from "./types";

export type LoadSpeciesStatsOptions = {
  /** When true, skip Firestore read and refresh from remote APIs + write cache. */
  forceRemote: boolean;
};

/**
 * Prefer Firestore `species` cache so we do not hit World Bank / FAOSTAT on every cold start.
 * Use `forceRemote: true` (e.g. “Actualiser”) to re-fetch and update the collection.
 */
export async function loadSpeciesStatsCached({ forceRemote }: LoadSpeciesStatsOptions): Promise<SpeciesStatRow[]> {
  if (!forceRemote) {
    try {
      const cached = await readCachedSpeciesRows();
      if (cached) return cached;
    } catch (e) {
      console.warn("[species] lecture Firestore impossible, fetch distant.", e);
    }
  }

  const fresh = await fetchSpeciesStats();
  try {
    await writeSpeciesRows(fresh);
  } catch (e) {
    console.warn("[species] écriture Firestore impossible (règles / réseau). Données affichées = fetch distant.", e);
  }
  return fresh;
}
