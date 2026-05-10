/** Snapshot served from `/public/data` when live FAOSTAT calls fail (CORS, 5xx, etc.). */
export type LivestockFallbackFile = {
  note?: string;
  species: Record<string, { value: number; year: number; sourceUrl: string }>;
};

export async function loadLivestockFallback(): Promise<LivestockFallbackFile> {
  const res = await fetch("/data/livestock-fallback.json");
  if (!res.ok) throw new Error(`Fallback livestock JSON HTTP ${res.status}`);
  return (await res.json()) as LivestockFallbackFile;
}
