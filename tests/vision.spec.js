import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__studio?.ready === true, null, {
    timeout: 90000,
  });
});

test("folha branca não gera geometria e quadriláteros inválidos são rejeitados", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 320;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 320, 320);
    const { processImage } = window.__studio;
    const blank = processImage(canvas, { blurSize: 1 });
    const pixels = blank.maskCanvas
      .getContext("2d")
      .getImageData(0, 0, 384, 384).data;
    let foreground = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i] > 127) foreground++;
    let error = "";
    try {
      processImage(canvas, {}, [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ]);
    } catch (exception) {
      error = exception.message;
    }
    return { count: blank.polygons.length, foreground, error };
  });
  expect(result.count).toBe(0);
  expect(result.foreground).toBe(0);
  expect(result.error).toContain("ordem");
});

test("homografia retifica uma folha trapezoidal e conserva a posição de dois traços", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const source = document.createElement("canvas");
    source.width = source.height = 320;
    const context = source.getContext("2d");
    context.fillStyle = "#333";
    context.fillRect(0, 0, 320, 320);
    context.fillStyle = "#fff";
    context.beginPath();
    context.moveTo(80, 40);
    context.lineTo(240, 40);
    context.lineTo(300, 280);
    context.lineTo(20, 280);
    context.closePath();
    context.fill();
    // Analytical projective mapping from the unit square onto this trapezoid.
    const project = (u, v) => ({
      x: 160 + (160 * (u - 0.5)) / (1 - (3 * v) / 7),
      y: (40 + 120 * v) / (1 - (3 * v) / 7),
    });
    context.fillStyle = "#000";
    for (const [u, v] of [
      [0.25, 0.25],
      [0.75, 0.75],
    ]) {
      const point = project(u, v);
      context.beginPath();
      context.arc(point.x, point.y, 8, 0, Math.PI * 2);
      context.fill();
    }
    const corners = [
      [80, 40],
      [240, 40],
      [300, 280],
      [20, 280],
    ].map(([x, y]) => ({ x: x / 319, y: y / 319 }));
    const corrected = window.__studio.processImage(
      source,
      { minArea: 40, blurSize: 1 },
      corners,
    );
    const ctx = corrected.correctedCanvas.getContext("2d");
    const pixel = (x, y) => ctx.getImageData(x, y, 1, 1).data[0];
    return {
      width: corrected.correctedCanvas.width,
      count: corrected.polygons.length,
      dark: [pixel(96, 96), pixel(287, 287)],
      white: [pixel(12, 12), pixel(192, 192), pixel(372, 372)],
      bounded: corrected.polygons
        .flat()
        .every(({ x, y }) => x >= 0 && x <= 1 && y >= 0 && y <= 1),
    };
  });
  expect(result.width).toBe(384);
  expect(result.count).toBe(2);
  expect(result.dark.every((value) => value < 60)).toBe(true);
  expect(result.white.every((value) => value > 240)).toBe(true);
  expect(result.bounded).toBe(true);
});

test("modelo treinado distingue exemplos das três classes sem acumular tensores na inferência", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.locator("#train").click();
  await page.waitForFunction(
    () => window.__studio.classifier.trained && !window.__studio.busy,
    null,
    { timeout: 90000 },
  );
  const result = await page.evaluate(async () => {
    const { classifier, drawSample, processImage } = window.__studio;
    const masks = ["casa", "arvore", "carro"].map((label) => ({
      label,
      mask: processImage(drawSample(label, 23)).maskCanvas,
    }));
    const predictions = [];
    for (const { label, mask } of masks)
      predictions.push({
        expected: label,
        ...(await classifier.predict(mask)),
      });
    const before = classifier.tensorCount;
    for (let round = 0; round < 12; round++)
      await classifier.predict(masks[round % masks.length].mask);
    return { predictions, before, after: classifier.tensorCount };
  });
  for (const prediction of result.predictions) {
    expect(prediction.label).toBe(prediction.expected);
    expect(prediction.confidence).toBeGreaterThan(0.5);
    expect(
      Object.values(prediction.probabilities).reduce((a, b) => a + b, 0),
    ).toBeCloseTo(1, 5);
  }
  expect(result.after).toBe(result.before);
});
