import * as THREE from "three";

import { unitDirectionFromLonLatDegThreeDefaultSphere } from "./sphereGeometryLatLon";

/** `FeatureCollection` Natural Earth / GeoJSON (pays en `Polygon` ou `MultiPolygon`). */
export type GeoJsonAdminCountriesFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    properties?: Record<string, unknown> | null;
    geometry?: { type: string; coordinates?: unknown } | null;
  }>;
};

function ringsFromPolygon(coords: number[][][]): number[][][] {
  return coords;
}

function ringsFromMultiPolygon(coords: number[][][][]): number[][][] {
  const rings: number[][][] = [];
  for (const polygon of coords) {
    for (const ring of polygon) {
      rings.push(ring);
    }
  }
  return rings;
}

function ringsFromGeometry(geom: { type: string; coordinates?: unknown }): number[][][] {
  const c = geom.coordinates;
  if (!c) return [];
  if (geom.type === "Polygon") return ringsFromPolygon(c as number[][][]);
  if (geom.type === "MultiPolygon") return ringsFromMultiPolygon(c as number[][][][]);
  return [];
}

/** Retire le dernier sommet s’il duplique le premier (anneau fermé GeoJSON). */
function openRing(ring: number[][]): number[][] {
  if (ring.length < 2) return [];
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring.slice(0, -1);
  }
  return ring.slice();
}

/**
 * Toutes les frontières en un seul `LineSegments` (segments par arête d’anneau), légèrement au-dessus du globe.
 */
export function createWorldAdminBordersLineSegments(
  data: GeoJsonAdminCountriesFeatureCollection,
  options?: { radius?: number; color?: number },
): THREE.LineSegments {
  const radius = options?.radius ?? 1.015;
  const color = options?.color ?? 0x1a6cff;
  const material = new THREE.LineBasicMaterial({ color });
  const dir = new THREE.Vector3();
  const flat: number[] = [];

  const pushVertex = (lon: number, lat: number) => {
    unitDirectionFromLonLatDegThreeDefaultSphere(lon, lat, dir);
    dir.multiplyScalar(radius);
    flat.push(dir.x, dir.y, dir.z);
  };

  for (const feat of data.features) {
    const geom = feat.geometry;
    if (!geom) continue;
    for (const ring of ringsFromGeometry(geom)) {
      const pts = openRing(ring);
      const n = pts.length;
      if (n < 2) continue;
      for (let i = 0; i < n; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % n]!;
        pushVertex(a[0]!, a[1]!);
        pushVertex(b[0]!, b[1]!);
      }
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(flat, 3));
  return new THREE.LineSegments(g, material);
}

export function disposeBorderLineSegments(mesh: THREE.LineSegments): void {
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
}
