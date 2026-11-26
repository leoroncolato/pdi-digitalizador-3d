import * as THREE from "three";

export const DRAWING_SIZE = 4;

const CLASS_COLORS = {
  casa: { front: "#b4f3d5", side: "#55bc99" },
  arvore: { front: "#c3f2a7", side: "#69b96b" },
  carro: { front: "#f5d5ad", side: "#d89b56" },
  default: { front: "#b4f3d5", side: "#55bc99" },
};

/** UVs preserve the position of every contour within the original image. */
const imageUVs = {
  generateTopUV(_geometry, vertices, a, b, c) {
    return [a, b, c].map(
      (index) =>
        new THREE.Vector2(
          vertices[index * 3] / DRAWING_SIZE + 0.5,
          vertices[index * 3 + 1] / DRAWING_SIZE + 0.5,
        ),
    );
  },
  generateSideWallUV(_geometry, vertices, a, b, c, d) {
    return [a, b, c, d].map(
      (index) =>
        new THREE.Vector2(
          vertices[index * 3] / DRAWING_SIZE + 0.5,
          vertices[index * 3 + 2],
        ),
    );
  },
};

function drawingTexture(source, color) {
  if (!source?.width || !source?.height) return null;
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "multiply";
  context.drawImage(source, 0, 0);
  context.globalCompositeOperation = "source-over";
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Build actual OpenCV contours, without substituting class-specific primitives. */
export function buildDrawing({
  polygons = [],
  textureCanvas,
  label = "default",
  depth = 0.35,
} = {}) {
  const group = new THREE.Group();
  group.name = "desenho-digitalizado";
  const colors = CLASS_COLORS[label] || CLASS_COLORS.default;
  const texture = drawingTexture(textureCanvas, colors.front);
  const front = new THREE.MeshStandardMaterial({
    color: texture ? "#ffffff" : colors.front,
    map: texture,
    roughness: 0.63,
    metalness: 0.03,
  });
  const sides = new THREE.MeshStandardMaterial({
    color: colors.side,
    roughness: 0.4,
    metalness: 0.08,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: "#e5fff0",
    transparent: true,
    opacity: 0.18,
  });
  const thickness = THREE.MathUtils.clamp(Number(depth) || 0.35, 0.03, 2);
  const meshes = [];
  for (const polygon of polygons) {
    const points = polygon.filter(
      (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
    );
    if (points.length < 3) continue;
    const shape = new THREE.Shape(
      points.map(
        ({ x, y }) =>
          new THREE.Vector2((x - 0.5) * DRAWING_SIZE, (0.5 - y) * DRAWING_SIZE),
      ),
    );
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      steps: 1,
      bevelEnabled: false,
      UVGenerator: imageUVs,
    });
    const mesh = new THREE.Mesh(geometry, [front, sides]);
    mesh.position.z = -thickness / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `contorno-${meshes.length + 1}`;
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 35),
      edgeMaterial,
    );
    mesh.add(outline);
    group.add(mesh);
    meshes.push(mesh);
  }
  return {
    group,
    meshes,
    setWireframe(value) {
      front.wireframe = Boolean(value);
      sides.wireframe = Boolean(value);
    },
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        for (const edge of mesh.children) edge.geometry?.dispose();
      }
      front.dispose();
      sides.dispose();
      edgeMaterial.dispose();
      texture?.dispose();
      group.clear();
    },
  };
}

export function animateDrawing(group, label, time, enabled) {
  group.position.set(0, 0, 0);
  group.rotation.set(0, 0, 0);
  if (!enabled) return;
  if (label === "arvore") {
    group.rotation.z = Math.sin(time * 1.5) * 0.055;
  } else if (label === "carro") {
    group.position.x = Math.sin(time * 0.8) * 0.32;
    group.rotation.y = Math.sin(time * 0.8) * 0.08;
  } else {
    group.position.y = Math.sin(time * 1.25) * 0.055;
    group.rotation.y = Math.sin(time * 0.6) * 0.075;
  }
}
