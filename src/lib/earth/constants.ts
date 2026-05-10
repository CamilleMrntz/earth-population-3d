/**
 * Shared constants for the Earth globe (textures, geometry detail).
 * Maps live under `public/textures/` so Vite serves them at `/textures/...`
 * (same origin, no CDN 404, works offline after clone).
 */

/** Diffuse / color map (continents + ocean shading from Three.js examples). */
export const EARTH_DAY_MAP_PATH = "/textures/earth_daymap.jpg";

/** Tangent-space normal map for relief (mountains read under moving light). */
export const EARTH_NORMAL_MAP_PATH = "/textures/earth_normal.jpg";

/** Sphere tessellation: higher = smoother silhouette, slightly more GPU cost. */
export const EARTH_SPHERE_SEGMENTS = 64;
