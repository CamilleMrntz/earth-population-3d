import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { EARTH_DAY_MAP_PATH, EARTH_NORMAL_MAP_PATH, EARTH_SPHERE_SEGMENTS } from "./constants";
import { getSunDirectionUnit } from "./subsolar";

export type GlobeSceneHandle = {
  /** Stop the render loop and free GPU/CPU resources (call on React unmount). */
  dispose: () => void;
};

/**
 * Builds a self-contained Three.js scene: Earth mesh, lights, OrbitControls, and resize handling.
 * Returns a dispose() function for strict cleanup (important with React StrictMode double-mounting in dev).
 */
export function createGlobeScene(container: HTMLElement): GlobeSceneHandle {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  // Deep space backdrop; pairs with index.css body background.
  scene.background = new THREE.Color(0x020617);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0.35, 2.85);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Base wash so the night side is not pitch-black (educational viz > physical realism).
  const ambient = new THREE.AmbientLight(0xffffff, 0.52);
  scene.add(ambient);

  // Sky/ground wrap: lifts the hemisphere opposite the sun (similar to scattered light / earthshine).
  const hemi = new THREE.HemisphereLight(0x8eb4ff, 0x1a2233, 0.62);
  hemi.position.set(0, 1, 0);
  scene.add(hemi);

  // Main sun: direction follows the real subsolar point (UTC clock on your machine).
  const sun = new THREE.DirectionalLight(0xffffff, 1.05);
  sun.position.set(5, 2.5, 4);
  scene.add(sun);
  scene.add(sun.target);

  // Subtle cool fill from the anti-sun direction so the night limb stays readable.
  const fill = new THREE.DirectionalLight(0xc8d8ff, 0.28);
  fill.position.set(-4.5, -0.8, -3.8);
  scene.add(fill);
  scene.add(fill.target);

  const sunDirection = new THREE.Vector3();

  const geometry = new THREE.SphereGeometry(1, EARTH_SPHERE_SEGMENTS, EARTH_SPHERE_SEGMENTS);

  const textureLoader = new THREE.TextureLoader();

  const earthMap = textureLoader.load(EARTH_DAY_MAP_PATH);
  earthMap.colorSpace = THREE.SRGBColorSpace;
  earthMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const normalMap = textureLoader.load(EARTH_NORMAL_MAP_PATH);
  normalMap.colorSpace = THREE.LinearSRGBColorSpace;
  normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const material = new THREE.MeshStandardMaterial({
    map: earthMap,
    normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughness: 0.55,
    metalness: 0.08,
  });

  const earth = new THREE.Mesh(geometry, material);
  scene.add(earth);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.55;
  controls.minDistance = 1.45;
  controls.maxDistance = 6;
  controls.enablePan = false;
  controls.target.set(0, 0, 0);

  let rafId = 0;
  const animate = () => {
    rafId = requestAnimationFrame(animate);
    getSunDirectionUnit(new Date(), sunDirection);
    sun.position.copy(sunDirection).multiplyScalar(5.5);
    fill.position.copy(sunDirection).multiplyScalar(-4.8);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  const onResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  const dispose = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);

    controls.dispose();
    geometry.dispose();
    material.dispose();
    earthMap.dispose();
    normalMap.dispose();

    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return { dispose };
}
