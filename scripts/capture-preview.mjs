import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
  });
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  await page.goto(process.env.APP_URL || "http://127.0.0.1:5173");
  await page.waitForFunction(() => window.__studio?.ready, null, {
    timeout: 90000,
  });
  await page.locator("#train").click();
  await page.waitForFunction(
    () => window.__studio?.classifier.trained && !window.__studio.busy,
    null,
    { timeout: 90000 },
  );
  await page.locator("#toast").waitFor({ state: "hidden" });
  await page.screenshot({
    path: "docs/screenshots/studio.png",
    fullPage: true,
  });
  console.log(
    await page.evaluate(() => ({
      fps: document.querySelector("#fps").textContent,
      classification: window.__studio.prediction,
      metrics: window.__studio.result.metrics,
    })),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
} finally {
  await browser.close();
}
