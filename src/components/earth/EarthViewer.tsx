import { useEffect, useRef } from "react";

import { createGlobeScene } from "../../lib/earth/createGlobeScene";

/**
 * React wrapper around imperative Three.js setup.
 * The canvas fills its parent; App / layout controls final size (here: full viewport via CSS).
 */
export function EarthViewer() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const { dispose } = createGlobeScene(host);
    return dispose;
  }, []);

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
