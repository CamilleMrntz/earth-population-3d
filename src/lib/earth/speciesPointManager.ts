import * as THREE from "three";

import { pickLandDirectionsForSpecies } from "../visualization/placement";
import type { SpeciesId } from "../visualization/speciesIds";

export type SpeciesPointLayerInput = {
  id: SpeciesId;
  /** Hex color (e.g. 0x38bdf8). */
  color: number;
  /** Number of instanced dots (already scaled / budgeted, not real population). */
  count: number;
};

/**
 * Renders selected species as InstancedMesh dots slightly above the globe surface.
 * Shares one low-poly sphere geometry across layers; materials are per-layer.
 */
export function createSpeciesPointManager(scene: THREE.Scene) {
  const group = new THREE.Group();
  scene.add(group);

  // Unit sphere + uniform scale: visible markers on a unit Earth (tune `s` if too big/small at your zoom).
  const sharedGeometry = new THREE.SphereGeometry(1, 10, 10);
  let landPool: THREE.Vector3[] | null = null;
  let lastLayers: SpeciesPointLayerInput[] = [];

  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  /** Globe radius = 1; small markers — increase `s` slightly if they disappear when zoomed out. */
  const s = new THREE.Vector3(0.007, 0.007, 0.007);

  function clearMeshes() {
    for (const child of [...group.children]) {
      if (child instanceof THREE.InstancedMesh) {
        child.material.dispose();
        group.remove(child);
      }
    }
  }

  function rebuild() {
    clearMeshes();
    if (!landPool?.length) return;

    for (const layer of lastLayers) {
      if (layer.count <= 0) continue;
      const dirs = pickLandDirectionsForSpecies(landPool, layer.id, layer.count);
      const material = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: 0.98,
        depthTest: true,
      });
      const mesh = new THREE.InstancedMesh(sharedGeometry, material, layer.count);
      for (let i = 0; i < layer.count; i++) {
        p.copy(dirs[i]!).multiplyScalar(1.032);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      group.add(mesh);
    }
  }

  return {
    setLandPool(pool: THREE.Vector3[]) {
      landPool = pool;
      rebuild();
    },

    setLayers(layers: SpeciesPointLayerInput[]) {
      lastLayers = layers;
      rebuild();
    },

    dispose() {
      clearMeshes();
      scene.remove(group);
      sharedGeometry.dispose();
    },
  };
}
