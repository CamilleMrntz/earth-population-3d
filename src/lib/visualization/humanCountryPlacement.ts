import * as THREE from "three";

import type { GeoJsonAdminCountriesFeatureCollection } from "../earth/countryBorders";
import {
  lonLatDegFromThreeDefaultUnitDirection,
  unitDirectionFromLonLatDegThreeDefaultSphere,
} from "../earth/sphereGeometryLatLon";

export type CountryPolygon = {
  outer: number[][];
  holes: number[][][];
};

export type HumanCountryPlacementRecord = {
  adminA3: string;
  pop: number;
  /** Somme des aires « plan lon/lat » (shoelace) des anneaux extérieurs — ordre de grandeur spatiale. */
  planarOuterDeg2: number;
  /** Poids pour répartir les points : pop + bonus superficie (grands pays vides visuellement). */
  allocationWeight: number;
  polygons: CountryPolygon[];
  centroidLon: number;
  centroidLat: number;
};

/** Bonus √superficie (deg²) : ~59 → ~80 pts AU sur 10k sans écraser Chine/Inde. */
const AREA_VISUAL_COEFF = 1_000_000;

export type HumanCountryIndex = {
  countries: HumanCountryPlacementRecord[];
};

const tmpDir = new THREE.Vector3();
const tmpLonLat = { lonDeg: 0, latDeg: 0 };

/** Anneau fermé GeoJSON : test point-dans-polygone (plan lon/lat). */
function pointInRingLonLat(lon: number, lat: number, ring: number[][]): boolean {
  if (ring.length < 3) return false;
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i]![0]!;
    const yi = ring[i]![1]!;
    const xj = ring[j]![0]!;
    const yj = ring[j]![1]!;
    if (Math.abs(yj - yi) < 1e-14) continue;
    if ((yi > lat) === (yj > lat)) continue;
    const xInt = xi + ((xj - xi) * (lat - yi)) / (yj - yi);
    if (lon < xInt) inside = !inside;
  }
  return inside;
}

function pointInPolygonLonLat(lon: number, lat: number, poly: CountryPolygon): boolean {
  if (!pointInRingLonLat(lon, lat, poly.outer)) return false;
  for (const h of poly.holes) {
    if (pointInRingLonLat(lon, lat, h)) return false;
  }
  return true;
}

function pointInCountry(lon: number, lat: number, c: HumanCountryPlacementRecord): boolean {
  return c.polygons.some((p) => pointInPolygonLonLat(lon, lat, p));
}

function ringMean(ring: number[][]): { lon: number; lat: number } {
  if (ring.length === 0) return { lon: 0, lat: 0 };
  let slon = 0;
  let slat = 0;
  let n = 0;
  for (const p of ring) {
    slon += p[0]!;
    slat += p[1]!;
    n++;
  }
  return { lon: slon / n, lat: slat / n };
}

function ringAreaShoelace(ring: number[][]): number {
  if (ring.length < 3) return 0;
  let a = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += ring[i]![0]! * ring[j]![1]! - ring[j]![0]! * ring[i]![1]!;
  }
  return Math.abs(a / 2);
}

function centroidFromPolygons(polygons: CountryPolygon[]): { lon: number; lat: number } {
  let slon = 0;
  let slat = 0;
  let w = 0;
  for (const poly of polygons) {
    const area = Math.max(1e-9, ringAreaShoelace(poly.outer));
    const m = ringMean(poly.outer);
    slon += m.lon * area;
    slat += m.lat * area;
    w += area;
  }
  if (w <= 0) {
    const m = ringMean(polygons[0]!.outer);
    return { lon: m.lon, lat: m.lat };
  }
  return { lon: slon / w, lat: slat / w };
}

function sumOuterShoelaceArea(polygons: CountryPolygon[]): number {
  let s = 0;
  for (const poly of polygons) {
    s += ringAreaShoelace(poly.outer);
  }
  return Math.max(s, 1e-9);
}

function combinedBbox(polygons: CountryPolygon[]): {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
} {
  let minLon = 180;
  let maxLon = -180;
  let minLat = 90;
  let maxLat = -90;
  for (const poly of polygons) {
    for (const p of poly.outer) {
      minLon = Math.min(minLon, p[0]!);
      maxLon = Math.max(maxLon, p[0]!);
      minLat = Math.min(minLat, p[1]!);
      maxLat = Math.max(maxLat, p[1]!);
    }
  }
  return { minLon, maxLon, minLat, maxLat };
}

function polygonRingsToCountryPolygon(rings: number[][][]): CountryPolygon | null {
  if (rings.length === 0 || !rings[0]!.length) return null;
  const outer = rings[0]!;
  const holes = rings.slice(1);
  return { outer, holes };
}

function geometryToCountryPolygons(geom: { type: string; coordinates?: unknown }): CountryPolygon[] {
  const c = geom.coordinates;
  if (!c) return [];
  if (geom.type === "Polygon") {
    const poly = polygonRingsToCountryPolygon(c as number[][][]);
    return poly ? [poly] : [];
  }
  if (geom.type === "MultiPolygon") {
    const out: CountryPolygon[] = [];
    for (const rings of c as number[][][][]) {
      const poly = polygonRingsToCountryPolygon(rings);
      if (poly) out.push(poly);
    }
    return out;
  }
  return [];
}

/**
 * Index pour placer les humains : populations `POP_EST` du fichier Natural Earth admin-0
 * (cohérent avec les frontières affichées).
 */
export function buildHumanCountryIndexFromNe110m(
  data: GeoJsonAdminCountriesFeatureCollection,
): HumanCountryIndex | null {
  const countries: HumanCountryPlacementRecord[] = [];
  for (const feat of data.features) {
    const props = feat.properties as { POP_EST?: number; ADM0_A3?: string } | undefined;
    const adminA3 = typeof props?.ADM0_A3 === "string" ? props.ADM0_A3 : "";
    /** L’anneau admin-0 encercle le pôle : le PiP équirectangulaire est faux ; pas de densité humaine ici. */
    if (adminA3 === "ATA") continue;
    const pop = props?.POP_EST;
    if (typeof pop !== "number" || !Number.isFinite(pop) || pop < 1) continue;
    const geom = feat.geometry;
    if (!geom) continue;
    const polygons = geometryToCountryPolygons(geom);
    if (polygons.length === 0) continue;
    const { lon, lat } = centroidFromPolygons(polygons);
    const planarOuterDeg2 = sumOuterShoelaceArea(polygons);
    const allocationWeight = pop + AREA_VISUAL_COEFF * Math.sqrt(planarOuterDeg2);
    countries.push({
      adminA3,
      pop,
      planarOuterDeg2,
      allocationWeight,
      polygons,
      centroidLon: lon,
      centroidLat: lat,
    });
  }
  if (countries.length === 0) return null;
  return { countries };
}

function allocateDotCountsByWeights(weights: number[], totalDots: number): number[] {
  const n = weights.length;
  const out = new Array<number>(n).fill(0);
  const totalW = weights.reduce((s, w) => s + w, 0);
  if (totalW <= 0 || totalDots <= 0) return out;
  const exact = weights.map((w) => (totalDots * w) / totalW);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    out[i] = Math.floor(exact[i]!);
    sum += out[i]!;
  }
  let rem = totalDots - sum;
  const order = exact
    .map((x, i) => ({ i, frac: x - out[i]! }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < rem; k++) {
    out[order[k]!.i]!++;
  }
  return out;
}

function sampleDirectionsInCountry(
  landPool: THREE.Vector3[],
  country: HumanCountryPlacementRecord,
  n: number,
): THREE.Vector3[] {
  const res: THREE.Vector3[] = [];
  const bbox = combinedBbox(country.polygons);
  let tries = 0;
  const maxLandTries = Math.max(3000, n * 100);
  while (res.length < n && tries < maxLandTries) {
    tries++;
    const d = landPool[(Math.random() * landPool.length) | 0]!;
    lonLatDegFromThreeDefaultUnitDirection(d, tmpLonLat);
    const { lonDeg, latDeg } = tmpLonLat;
    if (pointInCountry(lonDeg, latDeg, country)) {
      res.push(d.clone());
    }
  }
  const maxBboxTries = Math.max(2000, n * 60);
  while (res.length < n && tries < maxLandTries + maxBboxTries) {
    tries++;
    const lon = bbox.minLon + Math.random() * (bbox.maxLon - bbox.minLon);
    const lat = bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat);
    if (pointInCountry(lon, lat, country)) {
      unitDirectionFromLonLatDegThreeDefaultSphere(lon, lat, tmpDir);
      res.push(tmpDir.clone());
    }
  }
  let fillGuard = 0;
  while (res.length < n && fillGuard < Math.max(800, n * 50)) {
    fillGuard++;
    const lon = country.centroidLon + (Math.random() - 0.5) * 10;
    const lat = country.centroidLat + (Math.random() - 0.5) * 8;
    if (pointInCountry(lon, lat, country)) {
      unitDirectionFromLonLatDegThreeDefaultSphere(lon, lat, tmpDir);
      res.push(tmpDir.clone());
    }
  }
  let tailGuard = 0;
  while (res.length < n && tailGuard < 20_000) {
    tailGuard++;
    const lon = bbox.minLon + Math.random() * (bbox.maxLon - bbox.minLon);
    const lat = bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat);
    if (pointInCountry(lon, lat, country)) {
      unitDirectionFromLonLatDegThreeDefaultSphere(lon, lat, tmpDir);
      res.push(tmpDir.clone());
    }
  }
  while (res.length < n) {
    unitDirectionFromLonLatDegThreeDefaultSphere(country.centroidLon, country.centroidLat, tmpDir);
    res.push(tmpDir.clone());
  }
  return res;
}

/**
 * Répartit les points humains par pays (poids ∝ population + bonus √superficie carte),
 * puis le pool « terre » à l’intérieur des polygones admin-0.
 */
export function pickHumanDirectionsByCountry(
  landPool: THREE.Vector3[],
  index: HumanCountryIndex,
  count: number,
): THREE.Vector3[] {
  if (landPool.length === 0 || count <= 0) return [];
  const weights = index.countries.map((c) => c.allocationWeight);
  const alloc = allocateDotCountsByWeights(weights, count);
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < index.countries.length; i++) {
    const k = alloc[i]!;
    if (k <= 0) continue;
    out.push(...sampleDirectionsInCountry(landPool, index.countries[i]!, k));
  }
  while (out.length < count) {
    out.push(landPool[(Math.random() * landPool.length) | 0]!.clone());
  }
  return out.slice(0, count);
}
