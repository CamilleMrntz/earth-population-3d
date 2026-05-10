/**
 * FAO FAOSTAT bulk API (FENIX) — Production / Live animals & livestock (domain QCL).
 * May occasionally fail (network, 5xx, or changing query rules); callers should handle errors
 * and fall back to a static snapshot if needed.
 *
 * Dimension codes (area / item / element) are documented in FAOSTAT bulk downloads metadata.
 * @see https://www.fao.org/faostat/en/#data/QCL
 */

const FAOSTAT_DATA = "https://fenixservices.fao.org/faostat/api/v1/en/data/QCL";

type FaostatRecord = Record<string, unknown>;

function pickNumber(row: FaostatRecord): number | null {
  const v = row.Value ?? row.value;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickYear(row: FaostatRecord): number | null {
  const y = row.Year ?? row.year;
  if (typeof y === "number" && Number.isFinite(y)) return y;
  if (typeof y === "string") {
    const n = Number(y);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export type FaostatHeadcountResult = {
  value: number;
  year: number;
  sourceUrl: string;
};

/**
 * Live-animal stocks (heads) for the world aggregate and a given FAOSTAT item code.
 * @param itemCode FAOSTAT QCL item code (e.g. cattle, chickens — see FAOSTAT item list).
 * @param elementCode Stocks element (FAOSTAT "Stocks" / live animals; often 5112 or 5110 depending on revision).
 */
export async function fetchFaostatQclWorldStocksHeads(params: {
  itemCode: number;
  elementCode: number;
  year?: number;
}): Promise<FaostatHeadcountResult> {
  const year = params.year ?? 2022;
  const qs = new URLSearchParams({
    area: "5000",
    element: String(params.elementCode),
    item: String(params.itemCode),
    year: String(year),
  });
  const url = `${FAOSTAT_DATA}?${qs.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FAOSTAT HTTP ${res.status}`);
  const json = (await res.json()) as { data?: FaostatRecord[]; Data?: FaostatRecord[] };
  const rows = json.data ?? json.Data ?? [];
  const first = rows[0];
  if (!first) throw new Error("FAOSTAT: empty result (check item/element/year codes)");
  const value = pickNumber(first);
  const y = pickYear(first) ?? year;
  if (value == null) throw new Error("FAOSTAT: could not parse numeric value");
  return { value, year: y, sourceUrl: url };
}
