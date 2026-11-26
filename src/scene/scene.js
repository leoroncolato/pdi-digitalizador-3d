import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { animateDrawing, buildDrawing } from "./objects.js";

/** Rendering runs independently of the slower CV / model inference pipeline. */
export function createScene(container, { onFps } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#101a23");
  scene.fog = new THREE.Fog("#101a23", 15, 30);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute(
    "aria-label",
    "Modelo 3D: arraste para orbitar, use a roda para aproximar",
  );
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 3;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI * 0.77;

  scene.add(new THREE.HemisphereLight("#dbf9ff", "#344956", 2.1));
  const key = new THREE.DirectionalLight("#fff8e8", 3.5);
  key.position.set(3, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.normalBias = 0.025;
  scene.add(key);
  const rim = new THREE.DirectionalLight("#9ed8ef", 2.2);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  const groundGeometry = new THREE.PlaneGeometry(80, 80);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: "#101a23",
    roughness: 0.95,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.07;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(30, 60, "#3e5967", "#2a3e4b");
  grid.position.y = -2.055;
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);

  let drawing = null;
  let currentData = null;
  let disposed = false;
  const options = { depth: 0.35, animate: true, wireframe: false };

  function resize() {
    if (disposed) return;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function resetCamera() {
    camera.position.set(4.1, 2.6, 6.4);
    controls.target.set(0, -0.05, 0);
    controls.update();
  }

  function update(data) {
    if (disposed) return;
    currentData = data;
    if (Number.isFinite(data.depth)) options.depth = data.depth;
    if (drawing) {
      scene.remove(drawing.group);
      drawing.dispose();
    }
    drawing = buildDrawing({ ...data, depth: options.depth });
    drawing.setWireframe(options.wireframe);
    scene.add(drawing.group);
  }

  function setOptions(next) {
    const depthChanged =
      next.depth !== undefined && next.depth !== options.depth;
    Object.assign(options, next);
    if (depthChanged && currentData)
      update({ ...currentData, depth: options.depth });
    drawing?.setWireframe(options.wireframe);
  }

  function exportSTL() {
    if (!drawing?.meshes.length)
      throw new Error("Processe um desenho com contornos antes de exportar.");
    // Export the neutral pose, independently of the current animation frame.
    const position = drawing.group.position.clone();
    const rotation = drawing.group.rotation.clone();
    drawing.group.position.set(0, 0, 0);
    drawing.group.rotation.set(0, 0, 0);
    drawing.group.updateMatrixWorld(true);
    const stl = new STLExporter().parse(drawing.group, { binary: true });
    drawing.group.position.copy(position);
    drawing.group.rotation.copy(rotation);
    const blob = new Blob([stl], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `desenho-${currentData?.label || "3d"}.stl`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return blob;
  }

  resetCamera();
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  const startedAt = performance.now();
  let frames = 0;
  let measuredAt = startedAt;
  renderer.setAnimationLoop((timestamp) => {
    if (disposed) return;
    const now = Number.isFinite(timestamp) ? timestamp : performance.now();
    if (drawing)
      animateDrawing(
        drawing.group,
        currentData?.label,
        (now - startedAt) / 1000,
        options.animate,
      );
    controls.update();
    renderer.render(scene, camera);
    frames += 1;
    if (now - measuredAt >= 750) {
      onFps?.(Math.round((frames * 1000) / (now - measuredAt)));
      frames = 0;
      measuredAt = now;
    }
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    observer.disconnect();
    controls.dispose();
    drawing?.dispose();
    groundGeometry.dispose();
    groundMaterial.dispose();
    grid.geometry.dispose();
    grid.material.dispose();
    scene.clear();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { update, setOptions, resetCamera, exportSTL, resize, dispose };
}
