import { useEffect, useRef } from "react";

import { createGlobeScene, type GlobeSceneHandle } from "../../lib/earth/createGlobeScene";
import type { SpeciesPointLayerInput } from "../../lib/earth/speciesPointManager";

type EarthViewerProps = {
  /** Instanced dot layers (counts are already visualization budgets). */
  speciesLayers: SpeciesPointLayerInput[];
};

/**
 * React wrapper around imperative Three.js setup.
 * The canvas fills its parent; App / layout controls final size (here: full viewport via CSS).
 */
export function EarthViewer({ speciesLayers }: EarthViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<GlobeSceneHandle | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const api = createGlobeScene(host);
    apiRef.current = api;
    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    apiRef.current?.setSpeciesLayers(speciesLayers);
  }, [speciesLayers]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height: "100%",
        touchAction: "none",
      }}
      role="application"
      aria-label="Interactive 3D Earth. Drag to rotate, scroll to zoom."
    />
  );
}
