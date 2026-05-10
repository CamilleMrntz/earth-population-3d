import * as THREE from "three";

/**
 * Astronomical approximations (low precision, ~few minutes / degrees) good enough
 * to align day/night on the globe with real UTC. Based on common formulas from
 * Meeus / NOAA-style solar position summaries.
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Julian Date (UTC), including fractional day. */
function julianDateUTC(d: Date): number {
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth() + 1;
  const da =
    d.getUTCDate() +
    (d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600 + d.getUTCMilliseconds() / 3_600_000) / 24;

  let Y = y;
  let M = mo;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + da + B - 1524.5;
}

/** Greenwich Mean Sidereal Time in degrees [0, 360). */
function gmstDegrees(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    T * T * (0.000387933 - (T * T) / 38710000);
  gmst %= 360;
  if (gmst < 0) gmst += 360;
  return gmst;
}

/** Subsolar latitude (rad) = solar declination; subsolar longitude (rad), east-positive, [-π, π]. */
export function getSubsolarRadians(now: Date): { lat: number; lon: number } {
  const jd = julianDateUTC(now);
  const n = jd - 2451545.0;

  const L = 280.46 + 0.9856474 * n;
  const g = 357.528 + 0.9856003 * n;
  const gr = g * DEG2RAD;

  const lambda =
    (L + 1.915 * Math.sin(gr) + 0.02 * Math.sin(2 * gr)) * DEG2RAD;
  const epsilon = (23.439 - 0.0000004 * n) * DEG2RAD;

  const sinDec = Math.sin(epsilon) * Math.sin(lambda);
  const lat = Math.asin(Math.max(-1, Math.min(1, sinDec)));

  const alpha = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  const raDeg = ((alpha * RAD2DEG) % 360 + 360) % 360;
  const gmst = gmstDegrees(jd);

  let lonDeg = raDeg - gmst;
  while (lonDeg > 180) lonDeg -= 360;
  while (lonDeg < -180) lonDeg += 360;

  return { lat, lon: lonDeg * DEG2RAD };
}

/**
 * Unit vector from Earth center toward the Sun, in the same frame as
 * `SphereGeometry` + our equirectangular texture (Greenwich ≈ +X, east ≈ +Z).
 */
export function getSunDirectionUnit(now: Date, target: THREE.Vector3): THREE.Vector3 {
  const { lat, lon } = getSubsolarRadians(now);
  const cosLat = Math.cos(lat);
  return target.set(cosLat * Math.cos(lon), Math.sin(lat), cosLat * Math.sin(lon)).normalize();
}
