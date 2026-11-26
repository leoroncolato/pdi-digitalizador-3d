import test from "node:test";
import assert from "node:assert/strict";
import { Box3, Vector3 } from "three";
import { buildDrawing, animateDrawing } from "../src/scene/objects.js";

const rectangle = [
  { x: 0.1, y: 0.2 },
  { x: 0.7, y: 0.2 },
  { x: 0.7, y: 0.9 },
  { x: 0.1, y: 0.9 },
];

function closeTo(actual, expected, tolerance = 1e-5) {
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} should be close to ${expected}`,
  );
}

function solidVolume(geometry) {
  const positions = geometry.getAttribute("position");
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  let volume = 0;
  for (let index = 0; index < positions.count; index += 3) {
    a.fromBufferAttribute(positions, index);
    b.fromBufferAttribute(positions, index + 1);
    c.fromBufferAttribute(positions, index + 2);
    volume += a.dot(b.cross(c)) / 6;
  }
  return Math.abs(volume);
}

test("extrusion preserves image position, inverts image Y, and creates the requested solid volume", () => {
  const drawing = buildDrawing({ polygons: [rectangle], depth: 0.6 });
  try {
    assert.equal(drawing.meshes.length, 1);
    const bounds = new Box3().setFromObject(drawing.group);
    closeTo(bounds.min.x, -1.6);
    closeTo(bounds.max.x, 0.8);
    closeTo(bounds.min.y, -1.6);
    closeTo(bounds.max.y, 1.2);
    closeTo(bounds.min.z, -0.3);
    closeTo(bounds.max.z, 0.3);
    closeTo(solidVolume(drawing.meshes[0].geometry), 2.4 * 2.8 * 0.6);
  } finally {
    drawing.dispose();
  }
});

test("front-face UVs address the same image region as their contour vertices", () => {
  const drawing = buildDrawing({ polygons: [rectangle] });
  try {
    const geometry = drawing.meshes[0].geometry;
    const positions = geometry.getAttribute("position");
    const uvs = geometry.getAttribute("uv");
    const faceGroup = geometry.groups.find(
      (group) => group.materialIndex === 0,
    );
    assert.ok(faceGroup?.count > 0, "extruded drawing needs cap faces");
    for (
      let index = faceGroup.start;
      index < faceGroup.start + faceGroup.count;
      index += 1
    ) {
      closeTo(uvs.getX(index), positions.getX(index) / 4 + 0.5);
      closeTo(uvs.getY(index), positions.getY(index) / 4 + 0.5);
    }
  } finally {
    drawing.dispose();
  }
});

test("disconnected contours keep their relative positions and invalid contours produce no mesh", () => {
  const left = [
    { x: 0.1, y: 0.2 },
    { x: 0.2, y: 0.2 },
    { x: 0.15, y: 0.4 },
  ];
  const right = left.map(({ x, y }) => ({ x: x + 0.6, y }));
  const invalid = [
    { x: NaN, y: 0.3 },
    { x: 0.2, y: 0.4 },
    { x: Infinity, y: 0.5 },
  ];
  const drawing = buildDrawing({ polygons: [left, [], invalid, right] });
  try {
    assert.equal(drawing.meshes.length, 2);
    const first = new Box3().setFromObject(drawing.meshes[0]);
    const second = new Box3().setFromObject(drawing.meshes[1]);
    closeTo(second.min.x - first.min.x, 2.4);
    closeTo(second.min.y, first.min.y);
  } finally {
    drawing.dispose();
  }
});

test("disposing a drawing releases contour and outline GPU resources and shared materials", () => {
  const drawing = buildDrawing({ polygons: [rectangle, rectangle] });
  const resources = new Set();
  drawing.group.traverse((object) => {
    if (object.geometry) resources.add(object.geometry);
    if (object.material) {
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        resources.add(material);
      }
    }
  });
  const released = new Set();
  for (const resource of resources)
    resource.addEventListener("dispose", () => released.add(resource));
  drawing.dispose();
  assert.equal(released.size, resources.size);
  assert.equal(drawing.group.children.length, 0);
});

test("class predictions change motion and switching or disabling animation clears the previous pose", () => {
  const drawing = buildDrawing({ polygons: [rectangle] });
  try {
    animateDrawing(drawing.group, "carro", 1, true);
    assert.notEqual(
      drawing.group.position.x,
      0,
      "car should move horizontally",
    );
    animateDrawing(drawing.group, "arvore", 1, true);
    assert.equal(
      drawing.group.position.x,
      0,
      "tree should not inherit car translation",
    );
    assert.notEqual(drawing.group.rotation.z, 0, "tree should sway");
    animateDrawing(drawing.group, "casa", 1, true);
    assert.equal(
      drawing.group.rotation.z,
      0,
      "house should not inherit tree sway",
    );
    assert.notEqual(drawing.group.position.y, 0, "house should float gently");
    animateDrawing(drawing.group, "casa", 1, false);
    assert.deepEqual(drawing.group.position.toArray(), [0, 0, 0]);
    assert.deepEqual(drawing.group.rotation.toArray().slice(0, 3), [0, 0, 0]);
  } finally {
    drawing.dispose();
  }
});
