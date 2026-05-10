/**
 * World Bank Indicators API v2 — no API key, JSON with CORS suitable for browsers.
 * @see https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures
 */

const WB_BASE = "https://api.worldbank.org/v2";

type WbMeta = { page: number; pages: number; per_page: number; total: number };
type WbRow = {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
};

export type WorldBankLatest = {
  value: number;
  year: number;
  indicatorName: string;
  indicatorId: string;
  countryLabel: string;
  sourceUrl: string;
};

/** Latest non-null observation for a country + indicator (e.g. WLD + SP.POP.TOTL). */
export async function fetchWorldBankLatest(countryIso3: string, indicatorId: string): Promise<WorldBankLatest> {
  const url = `${WB_BASE}/country/${encodeURIComponent(countryIso3)}/indicator/${encodeURIComponent(indicatorId)}?format=json&mrnev=1&per_page=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank HTTP ${res.status}`);
  const json = (await res.json()) as [WbMeta, WbRow[]];
  const row = json[1]?.[0];
  if (!row || row.value == null) throw new Error("World Bank: no data point returned");
  const year = Number(row.date);
  if (!Number.isFinite(year)) throw new Error("World Bank: invalid year");
  return {
    value: row.value,
    year,
    indicatorName: row.indicator.value,
    indicatorId: row.indicator.id,
    countryLabel: row.country.value,
    sourceUrl: url,
  };
}
