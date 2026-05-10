import * as THREE from "three";

import { lonLatDegFromThreeDefaultUnitDirection } from "../earth/sphereGeometryLatLon";
import type { HumanCountryIndex } from "./humanCountryPlacement";
import { pickHumanDirectionsByCountry } from "./humanCountryPlacement";
import type { SpeciesId } from "./speciesIds";
import { isEndangeredSpeciesId } from "./speciesIds";

/** Broad livestock belts (score only; still restricted to land pool samples). */
function cattleChickenWeight(lonDeg: number, latDeg: number): number {
  const peaks: { lo: number; la: number; wLon: number; wLat: number; amp: number }[] = [
    { lo: -95, la: 40, wLon: 38, wLat: 22, amp: 1 },
    { lo: -58, la: -12, wLon: 28, wLat: 24, amp: 0.85 },
    { lo: 12, la: 48, wLon: 28, wLat: 16, amp: 0.9 },
    { lo: 78, la: 22, wLon: 20, wLat: 14, amp: 1 },
    { lo: 105, la: 32, wLon: 32, wLat: 20, amp: 1 },
    { lo: 135, la: -28, wLon: 22, wLat: 18, amp: 0.45 },
  ];
  let s = 0.04;
  for (const p of peaks) {
    const dlon = (lonDeg - p.lo) / p.wLon;
    const dlat = (latDeg - p.la) / p.wLat;
    s += p.amp * Math.exp(-(dlon * dlon + dlat * dlat));
  }
  return s;
}

function weightForSpecies(id: SpeciesId, lonDeg: number, latDeg: number): number {
  if (id === "humans" || isEndangeredSpeciesId(id)) return 1;
  if (id === "cattle" || id === "chickens") return cattleChickenWeight(lonDeg, latDeg);
  return 1;
}

/**
 * Picks `count` directions from `landPool` using weighted reservoir-like acceptance sampling.
 */
export function pickLandDirectionsForSpecies(
  landPool: THREE.Vector3[],
  speciesId: SpeciesId,
  count: number,
  humanCountryIndex?: HumanCountryIndex | null,
): THREE.Vector3[] {
  if (landPool.length === 0 || count <= 0) return [];

  if (speciesId === "humans" && humanCountryIndex?.countries.length) {
    return pickHumanDirectionsByCountry(landPool, humanCountryIndex, count);
  }

  const llDeg = { lonDeg: 0, latDeg: 0 };
  const out: THREE.Vector3[] = [];

  let wMax = 0;
  const probe = Math.min(landPool.length, 4000);
  for (let i = 0; i < probe; i++) {
    const d = landPool[(Math.random() * landPool.length) | 0]!;
    lonLatDegFromThreeDefaultUnitDirection(d, llDeg);
    wMax = Math.max(wMax, weightForSpecies(speciesId, llDeg.lonDeg, llDeg.latDeg));
  }
  wMax = Math.max(wMax, 1e-6);

  let guard = 0;
  const guardMax = count * 120;
  while (out.length < count && guard < guardMax) {
    guard++;
    const d = landPool[(Math.random() * landPool.length) | 0]!;
    lonLatDegFromThreeDefaultUnitDirection(d, llDeg);
    const lonDeg = llDeg.lonDeg;
    const latDeg = llDeg.latDeg;
    const w = weightForSpecies(speciesId, lonDeg, latDeg);
    if (Math.random() <= w / wMax) out.push(d.clone());
  }

  while (out.length < count) {
    out.push(landPool[(Math.random() * landPool.length) | 0]!.clone());
  }
  return out;
}
