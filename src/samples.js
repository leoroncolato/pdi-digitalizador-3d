export const labels = { casa: "Casa", arvore: "Árvore", carro: "Carro" };
// Variações geométricas explícitas para uma base didática; não substituem fotos reais.
export function drawSample(label = "casa", variation = 0, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const c = canvas.getContext("2d");
  c.fillStyle = "#fff";
  c.fillRect(0, 0, size, size);
  c.save();
  c.scale(size / 512, size / 512);
  c.translate(
    256 + Math.sin(variation * 2.3) * 20,
    256 + Math.cos(variation * 1.7) * 14,
  );
  c.rotate(Math.sin(variation * 1.3) * 0.045);
  const s = 0.86 + (variation % 7) * 0.025;
  c.scale(s, s);
  c.translate(-256, -256);
  c.strokeStyle = "#172925";
  c.fillStyle = "#fff";
  c.lineWidth = 6 + (variation % 4);
  c.lineJoin = "round";
  c.lineCap = "round";
  const path = (points, close = true) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    if (close) c.closePath();
    c.stroke();
  };
  if (label === "casa") {
    path([
      [100, 242],
      [256, 108],
      [412, 242],
      [382, 242],
      [382, 397],
      [130, 397],
      [130, 242],
    ]);
    path(
      [
        [222, 397],
        [222, 292],
        [288, 292],
        [288, 397],
      ],
      false,
    );
    c.strokeRect(157, 271, 42, 46);
    c.strokeRect(312, 271, 42, 46);
    path(
      [
        [321, 163],
        [321, 119],
        [356, 119],
        [356, 195],
      ],
      false,
    );
  } else if (label === "arvore") {
    path([
      [240, 407],
      [240, 319],
      [115, 319],
      [173, 249],
      [139, 249],
      [208, 173],
      [184, 173],
      [256, 79],
      [328, 173],
      [304, 173],
      [373, 249],
      [339, 249],
      [397, 319],
      [272, 319],
      [272, 407],
    ]);
    path(
      [
        [256, 316],
        [256, 202],
      ],
      false,
    );
    path(
      [
        [256, 271],
        [220, 245],
      ],
      false,
    );
    path(
      [
        [256, 295],
        [299, 269],
      ],
      false,
    );
  } else {
    c.beginPath();
    c.moveTo(94, 283);
    c.lineTo(137, 268);
    c.lineTo(187, 184);
    c.lineTo(319, 184);
    c.lineTo(378, 268);
    c.lineTo(421, 286);
    c.lineTo(421, 352);
    c.lineTo(391, 352);
    c.arc(355, 352, 36, 0, Math.PI);
    c.lineTo(193, 352);
    c.arc(157, 352, 36, 0, Math.PI);
    c.lineTo(94, 352);
    c.closePath();
    c.stroke();
    path([
      [166, 265],
      [204, 208],
      [246, 208],
      [246, 265],
    ]);
    path([
      [266, 208],
      [308, 208],
      [349, 265],
      [266, 265],
    ]);
    c.beginPath();
    c.arc(157, 352, 20, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(355, 352, 20, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
  return canvas;
}
