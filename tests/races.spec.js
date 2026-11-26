import { test, expect } from "@playwright/test";

test("trocar a fonte cancela webcam pendente e reprocessa a imagem mais recente após inferência", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => window.__studio?.ready);

  const expected = await page.evaluate(() => {
    const { processImage, drawSample } = window.__studio;
    const params = {
      thresholdC: 8,
      blockSize: 21,
      blurSize: 3,
      morphSize: 3,
      minArea: 100,
      epsilon: 2,
      resolution: 384,
    };
    window.__raceOriginalGetUserMedia = navigator.mediaDevices.getUserMedia;
    // Delay permission resolution while retaining a real MediaStream for disposal checks.
    navigator.mediaDevices.getUserMedia = () =>
      new Promise((resolve) => {
        window.__raceResolveCamera = resolve;
      });
    return {
      tree: JSON.stringify(processImage(drawSample("arvore"), params).polygons),
      car: JSON.stringify(processImage(drawSample("carro"), params).polygons),
    };
  });

  await page.locator("#camera").click();
  await page.waitForFunction(
    () => typeof window.__raceResolveCamera === "function",
  );
  await page.locator('[data-sample="arvore"]').click();
  await expect
    .poll(() =>
      page.evaluate(() => JSON.stringify(window.__studio.result.polygons)),
    )
    .toBe(expected.tree);
  await page.evaluate(() => {
    window.__raceCameraCanvas = window.__studio.drawSample("casa");
    window.__raceCameraStream = window.__raceCameraCanvas.captureStream(5);
    window.__raceResolveCamera(window.__raceCameraStream);
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__raceCameraStream
          .getTracks()
          .every((track) => track.readyState === "ended"),
      ),
    )
    .toBe(true);
  expect(await page.evaluate(() => window.__studio.capture.stream)).toBeNull();
  await expect(page.locator("#camera-preview")).toBeHidden();
  await expect(page.locator("#source-tag")).toHaveText("EXEMPLO");
  await expect(page.locator("#paper-label")).toContainText("ÁRVORE");

  await page.evaluate(() => {
    const classifier = window.__studio.classifier;
    window.__raceOriginalPredict = classifier.predict;
    window.__racePredictCalls = 0;
    classifier.predict = function (canvas) {
      window.__racePredictCalls += 1;
      if (window.__racePredictCalls === 1) {
        return new Promise((resolve) => {
          window.__raceResolvePrediction = resolve;
        });
      }
      return window.__raceOriginalPredict.call(this, canvas);
    };
  });

  // The first source's OpenCV result must not win after a newer source is selected.
  await page.locator('[data-sample="casa"]').click();
  await page.waitForFunction(
    () => typeof window.__raceResolvePrediction === "function",
  );
  await page.locator('[data-sample="carro"]').click();
  await expect(page.locator("#paper-label")).toContainText("CARRO");
  await page.evaluate(() => {
    window.__raceResolvePrediction({
      label: "casa",
      confidence: 1,
      probabilities: { casa: 1, arvore: 0, carro: 0 },
    });
  });
  await expect
    .poll(() =>
      page.evaluate(() => JSON.stringify(window.__studio.result.polygons)),
    )
    .toBe(expected.car);
  expect(
    await page.evaluate(() => window.__racePredictCalls),
  ).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => window.__studio.prediction?.label)).not.toBe(
    "casa",
  );
  await expect(page.locator("#export")).toBeEnabled();

  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = window.__raceOriginalGetUserMedia;
    window.__studio.classifier.predict = window.__raceOriginalPredict;
  });
  expect(errors).toEqual([]);
});
