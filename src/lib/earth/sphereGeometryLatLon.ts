import * as THREE from "three";

/**
 * Cible équirectangulaire classique (comme sur la carte image) → coordonnées UV sur le maillage
 * `SphereGeometry` par défaut (`uvs.push(u+uOffset, 1 - v)` dans Three.js).
 */
function targetMapUv(lonDeg: number, latDeg: number, out: { u: number; v: number }): void {
  out.u = (lonDeg + 180) / 360;
  // Sur le globe Three : pôle nord → UV.v proche de 1, équateur → 0,5 (voir `SphereGeometry`).
  out.v = (90 + latDeg) / 180;
}

/**
 * Direction unitaire vers le sommet du maillage dont les **UV** sont les plus proches du point carte
 * `(lon, lat)`. Aligne le marqueur sur la **texture** visible, pas seulement sur une formule lat/lon abstraite.
 */
export function unitDirectionOnSphereGeometryNearestMapUv(
  geometry: THREE.BufferGeometry,
  lonDeg: number,
  latDeg: number,
  target: THREE.Vector3,
): THREE.Vector3 {
  const want = { u: 0, v: 0 };
  targetMapUv(lonDeg, latDeg, want);

  const uvAttr = geometry.attributes.uv;
  const posAttr = geometry.attributes.position;
  if (!uvAttr || !posAttr || uvAttr.count !== posAttr.count) {
    return target.set(1, 0, 0).normalize();
  }

  let bestI = 0;
  let bestD = Infinity;
  const n = posAttr.count;
  for (let i = 0; i < n; i++) {
    const u = uvAttr.getX(i);
    const v = uvAttr.getY(i);
    let du = u - want.u;
    if (du > 0.5) du -= 1;
    if (du < -0.5) du += 1;
    const dv = v - want.v;
    const d2 = du * du + dv * dv;
    if (d2 < bestD) {
      bestD = d2;
      bestI = i;
    }
  }
  return target.set(posAttr.getX(bestI), posAttr.getY(bestI), posAttr.getZ(bestI)).normalize();
}

/**
 * Direction unitaire **continue** (lon, lat) → sphère, même convention que `SphereGeometry` par défaut
 * (`phiStart=0`, `thetaStart=0`, etc.) et les UV équirectangulaires de la carte.
 * À utiliser pour polylignes denses ; le plus proche sommet (`unitDirectionOnSphereGeometryNearestMapUv`)
 * quantifie fortement et déforme les contours.
 */
export function unitDirectionFromLonLatDegThreeDefaultSphere(
  lonDeg: number,
  latDeg: number,
  target: THREE.Vector3,
): THREE.Vector3 {
  const mapU = (lonDeg + 180) / 360;
  const mapV = (90 + latDeg) / 180;
  const vSphere = 1 - mapV;
  const phi = mapU * 2 * Math.PI;
  const theta = vSphere * Math.PI;
  const x = -Math.cos(phi) * Math.sin(theta);
  const y = Math.cos(theta);
  const z = Math.sin(phi) * Math.sin(theta);
  return target.set(x, y, z).normalize();
}

/**
 * Inverse de `unitDirectionFromLonLatDegThreeDefaultSphere` : direction sur la sphère Three par défaut → (lon, lat) °.
 * À utiliser pour décoder les directions du pool « terre » alignées sur le globe / le GeoJSON.
 */
export function lonLatDegFromThreeDefaultUnitDirection(
  dir: THREE.Vector3,
  out: { lonDeg: number; latDeg: number },
): void {
  const y = THREE.MathUtils.clamp(dir.y, -1, 1);
  const theta = Math.acos(y);
  const vSphere = theta / Math.PI;
  const mapV = 1 - vSphere;
  out.latDeg = mapV * 180 - 90;
  const sinTheta = Math.sin(theta);
  let phi = 0;
  if (sinTheta > 1e-8) {
    phi = Math.atan2(dir.z / sinTheta, -dir.x / sinTheta);
  }
  let phiNorm = phi;
  if (phiNorm < 0) {
    phiNorm += 2 * Math.PI;
  }
  out.lonDeg = (phiNorm * 180) / Math.PI - 180;
}
