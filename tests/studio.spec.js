import { test, expect } from "@playwright/test";
test("estúdio: exemplos, upload, controles, exportação STL e layout móvel", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => window.__studio?.ready);
  await expect(page.locator("#scene-loading")).toBeHidden();
  const initial = await page.evaluate(() => window.__studio.result.polygons);
  expect(initial.length).toBeGreaterThan(0);
  await page.locator('[data-sample="arvore"]').click();
  await expect
    .poll(() =>
      page.evaluate(() => JSON.stringify(window.__studio.result.polygons)),
    )
    .not.toBe(JSON.stringify(initial));
  await page.locator("#depth").fill("0.65");
  await page.locator("#depth").dispatchEvent("input");
  await expect(page.locator("#depth-value")).toHaveText("0,65");
  await page.locator("#wireframe").check();
  await page.locator("#animate").uncheck();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.stl$/);
  const png = await page.evaluate(
    () => window.__studio.drawSample("carro").toDataURL().split(",")[1],
  );
  await page.locator("#file").setInputFiles({
    name: "carro.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await expect(page.locator("#source-tag")).toHaveText("SUA IMAGEM");
  await expect(page.locator("#paper-label")).toHaveText("carro.png");
  await page.locator("#about").click();
  await expect(page.locator("#about-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("webcam com vídeo simulado processa quadros e libera captura", async ({
  browser,
}) => {
  const context = await browser.newContext({ permissions: ["camera"] });
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForFunction(() => window.__studio?.ready);
  // Mock only the physical device: the app still captures real video frames from a canvas stream.
  await page.evaluate(() => {
    const sample = window.__studio.drawSample("casa");
    window.__cameraFixture = sample;
    window.__cameraTimer = setInterval(
      () => sample.getContext("2d").drawImage(sample, 0, 0),
      100,
    );
    navigator.mediaDevices.getUserMedia = async () => {
      window.__cameraStream = sample.captureStream(5);
      return window.__cameraStream;
    };
  });
  await page.locator("#camera").click();
  await expect(page.locator("#camera")).toContainText("Capturar e parar");
  await expect
    .poll(() => page.evaluate(() => window.__studio.capture.canvas.width))
    .toBe(512);
  await page.locator("#camera").click();
  await expect(page.locator("#camera-preview")).toBeHidden();
  expect(await page.evaluate(() => window.__studio.capture.stream)).toBeNull();
  expect(
    await page.evaluate(() => {
      clearInterval(window.__cameraTimer);
      return window.__cameraStream
        .getTracks()
        .every((t) => t.readyState === "ended");
    }),
  ).toBe(true);
  await context.close();
});
