// Small three.js viewer for the landmark models (GLB files exported from Blender).
// It reuses the exact orthographic camera Blender rendered each still with (framing.json),
// so the live model lines up with the picture it replaces and starts turning from that pose.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const cache = new Map(); // url -> Promise<gltf>
let framing = null;

function loadModel(url) {
  if (!cache.has(url)) cache.set(url, loader.loadAsync(url));
  return cache.get(url);
}
function loadFraming() {
  if (!framing) framing = fetch("assets/models/framing.json").then((r) => r.json());
  return framing;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * @param {HTMLElement} host   element the canvas fills (may be larger than the picture so the model can turn freely)
 * @param {object} opts
 *   slug     model name, e.g. "03-slide-tower"
 *   view     "map" | "detail": which Blender camera to match
 *   getBox   () => {x, y, w, h}: the picture's box in host pixels (the still is object-fit: contain inside it)
 *   turn     radians per second
 *   animate  play baked animation (the Cowabunga bucket)
 *   onReady  called once the first frame is drawn
 */
export function createViewer(host, opts) {
  const { slug, view, getBox, turn = 0.15, animate = true, onReady } = opts;
  const still = prefersReducedMotion();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);

  // Same light as the Blender stills, in the same physical units, so the swap is seamless:
  // world colour #DCEBFA at strength 0.72 (uniform sky ⇒ ambient of π × strength)
  // and a 4.2 W/m² warm sun from the Blender sun's exact direction.
  const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
  scene.add(new THREE.AmbientLight(lin(0.7157, 0.8308, 0.956), 0.72 * Math.PI));
  const sun = new THREE.DirectionalLight(lin(1, 0.97, 0.9), 4.2);
  const SUN_DIR = new THREE.Vector3(0.6339, -0.6943, -0.3408); // direction the light travels (glTF axes)
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  const pivot = new THREE.Group(); // spins about the landmark's own vertical axis
  scene.add(pivot);

  let frame = null; // Blender camera for this view
  let mixer = null;
  let raf = 0;
  let disposed = false;
  const clock = new THREE.Clock();

  // Fit the Blender frustum into the picture's box exactly like object-fit: contain,
  // then extend it to cover the whole host so nothing is clipped while turning.
  function fitCamera() {
    if (!frame) return;
    const hw = host.clientWidth || 1, hh = host.clientHeight || 1;
    renderer.setSize(hw, hh, false);
    const [rx, ry] = frame.res;
    const halfW = rx >= ry ? frame.ortho / 2 : (frame.ortho / 2) * (rx / ry);
    const halfH = rx >= ry ? (frame.ortho / 2) * (ry / rx) : frame.ortho / 2;
    const b = getBox();
    const unitsPerPx = b.w / b.h > halfW / halfH ? (2 * halfH) / b.h : (2 * halfW) / b.w;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    camera.left = -cx * unitsPerPx;
    camera.right = (hw - cx) * unitsPerPx;
    camera.top = cy * unitsPerPx;
    camera.bottom = -(hh - cy) * unitsPerPx;
    camera.updateProjectionMatrix();
  }

  const ro = new ResizeObserver(() => { fitCamera(); if (still) render(); });
  ro.observe(host);

  function render() { renderer.render(scene, camera); }
  function tick() {
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    pivot.rotation.y += turn * dt;
    if (mixer) mixer.update(dt);
    render();
    raf = requestAnimationFrame(tick);
  }

  Promise.all([loadModel(`assets/models/${slug}.glb`), loadFraming()]).then(([gltf, all]) => {
    if (disposed) return;
    frame = all[slug][view];
    const model = gltf.scene.clone(true);
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    // the model keeps its exported position; the pivot sits under its centre so it turns in place
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    pivot.position.set(c.x, 0, c.z);
    model.position.set(-c.x, 0, -c.z);
    pivot.add(model);

    // Blender's camera, unchanged
    const [px, py, pz] = frame.pos, [dx, dy, dz] = frame.dir, [ux, uy, uz] = frame.up;
    camera.position.set(px, py, pz);
    camera.up.set(ux, uy, uz);
    camera.lookAt(px + dx, py + dy, pz + dz);
    camera.near = 0.1; camera.far = 200;

    const r = box.getSize(new THREE.Vector3()).length() / 2;
    sun.position.set(c.x, 0, c.z).addScaledVector(SUN_DIR, -r * 4);
    sun.target.position.set(c.x, 0, c.z);
    Object.assign(sun.shadow.camera, { left: -r * 1.5, right: r * 1.5, top: r * 1.5, bottom: -r * 1.5, near: 0.1, far: r * 10 });
    sun.shadow.camera.updateProjectionMatrix();

    if (animate && !still && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      // the zoomed Cowabunga still was rendered mid-pour (frame 70 of 144 at 24 fps)
      if (view === "detail") mixer.setTime(69 / 24);
    }

    fitCamera();
    render();
    onReady && onReady();
    if (!still) { clock.getDelta(); tick(); }
  }).catch((err) => console.warn("Model failed to load", slug, err));

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
