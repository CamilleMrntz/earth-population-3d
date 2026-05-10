/** One row in the UI: a species or metric we try to load from an API (or fallback). */
export type SpeciesStatRow = {
  id: string;
  label: string;
  /** Headcount or population (individuals), when applicable. */
  value: number | null;
  year: number | null;
  unit: string;
  /** Human-readable data origin (e.g. API name + indicator). */
  sourceLabel: string;
  sourceUrl: string;
  status: "ok" | "loading" | "error";
  errorMessage?: string;
};
