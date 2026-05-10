import { useCallback, useEffect, useMemo, useState } from "react";

import { EarthViewer } from "./components/earth/EarthViewer";
import { SpeciesStatsPanel } from "./components/stats/SpeciesStatsPanel";
import type { SpeciesPointLayerInput } from "./lib/earth/speciesPointManager";
import { loadSpeciesStatsCached } from "./lib/population/loadSpeciesStatsCached";
import type { SpeciesStatRow } from "./lib/population/types";
import { computeVizInstanceCounts, populationForScale } from "./lib/visualization/instanceBudget";
import { SPECIES_VIZ_COLORS } from "./lib/visualization/speciesUiMeta";
import { isSpeciesId, SPECIES_IDS, type SpeciesId } from "./lib/visualization/speciesIds";

/**
 * Globe + textual population stats + proportional point clouds (never 1:1 with real counts).
 */
export default function App() {
  const [rows, setRows] = useState<SpeciesStatRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selected, setSelected] = useState<SpeciesId[]>([]);

  const reloadStats = useCallback((forceRemote: boolean) => {
    setStatsLoading(true);
    void loadSpeciesStatsCached({ forceRemote })
      .then(setRows)
      .finally(() => setStatsLoading(false));
  }, []);

  /** Cold start: Firestore `species` cache first; remote APIs only if cache incomplete. */
  useEffect(() => {
    reloadStats(false);
  }, [reloadStats]);

  const popById = useMemo(() => {
    const m = new Map<SpeciesId, number | null>();
    for (const id of SPECIES_IDS) m.set(id, null);
    for (const r of rows) {
      if (r.status === "ok" && isSpeciesId(r.id)) m.set(r.id, r.value);
    }
    return m;
  }, [rows]);

  const speciesLayers: SpeciesPointLayerInput[] = useMemo(() => {
    const active = selected.map((id) => ({
      id,
      population: populationForScale(id, popById.get(id)),
    }));
    const counts = computeVizInstanceCounts(active);
    return selected.map((id) => ({
      id,
      color: SPECIES_VIZ_COLORS[id],
      count: counts.get(id) ?? 0,
    }));
  }, [selected, popById]);

  const toggleSpecies = useCallback((id: SpeciesId) => {
    setSelected((prev) => {
      const i = prev.indexOf(id);
      if (i >= 0) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1]!, id];
      }
      return [...prev, id];
    });
  }, []);

  return (
    <div className="app-shell">
      <SpeciesStatsPanel
        rows={rows}
        loading={statsLoading}
        onRefresh={() => reloadStats(true)}
        selected={selected}
        onToggleSpecies={toggleSpecies}
      />
      <div className="app-shell__globe">
        <EarthViewer speciesLayers={speciesLayers} />
      </div>
    </div>
  );
}
