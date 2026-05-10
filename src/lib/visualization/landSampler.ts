import * as THREE from "three";

import { unitDirectionFromLonLatDegThreeDefaultSphere } from "../earth/sphereGeometryLatLon";

/**
 * Heuristic ocean detection on the Blue-Marble-style diffuse map (lots of deep blue water).
 */
function isLikelyOcean(r: number, g: number, b: number): boolean {
  return b > 0.42 && b > r + 0.06 && b > g + 0.04;
}

/**
 * Builds a pool of surface directions over land by rejection-sampling the day texture.
 */
export function buildLandDirectionPool(image: HTMLImageElement, targetCount: number): THREE.Vector3[] {
  const canvas = document.createElement("canvas");
  const w = Math.min(1024, image.naturalWidth || image.width);
  const h = Math.max(2, Math.round((w * (image.naturalHeight || image.height)) / (image.naturalWidth || image.width || 1)));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h).data;

  const pool: THREE.Vector3[] = [];
  const tmp = new THREE.Vector3();
  let attempts = 0;
  const maxAttempts = targetCount * 80;
  while (pool.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const u = Math.random();
    const v = Math.random();
    const ix = Math.min(w - 1, Math.floor(u * w));
    const iy = Math.min(h - 1, Math.floor(v * h));
    const i = (iy * w + ix) * 4;
    const r = img[i]! / 255;
    const g = img[i + 1]! / 255;
    const b = img[i + 2]! / 255;
    if (isLikelyOcean(r, g, b)) continue;
    const lonDeg = u * 360 - 180;
    const latDeg = 90 - 180 * v;
    unitDirectionFromLonLatDegThreeDefaultSphere(lonDeg, latDeg, tmp);
    pool.push(tmp.clone());
  }
  return pool;
}
