// Grava interações reais no navegador; legendas explicativas são sobrepostas só na gravação.
// Requisitos: Chromium do Playwright (ou env executable path), ffmpeg do Playwright e ffmpeg no PATH.
import { chromium } from "@playwright/test";
import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const output =
  process.env.VIDEO_OUTPUT || "/workspace/artifacts/forma-demonstracao.mp4";
await mkdir(join(output, ".."), { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), "forma-video-"));
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
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: temporary, size: { width: 1280, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(process.env.APP_URL || "http://127.0.0.1:4173");
  await page.waitForFunction(() => window.__studio?.ready, null, {
    timeout: 90000,
  });
  const caption = async (title, text) =>
    page.evaluate(
      ({ title, text }) => {
        let el = document.querySelector("#video-caption");
        if (!el) {
          el = document.createElement("aside");
          el.id = "video-caption";
          el.style =
            "position:fixed;z-index:9999;bottom:12px;left:4%;right:4%;padding:18px 24px;border:1px solid #86b89c;background:#183c30f5;color:#fff;border-radius:10px;font:16px/1.5 system-ui;box-shadow:0 4px 30px #0004;pointer-events:none";
          document.body.append(el);
        }
        el.replaceChildren();
        const strong = document.createElement("strong");
        strong.textContent = title;
        strong.style =
          "display:block;color:#a9e6c4;margin-bottom:4px;font-size:18px";
        const span = document.createElement("span");
        span.textContent = text;
        el.append(strong, span);
      },
      { title, text },
    );
  const hold = (seconds) => page.waitForTimeout(seconds * 1000);
  const start = Date.now();
  await caption(
    "FORMA · Digitalizador de desenhos 3D",
    "Leonardo Felipe Roncolato e Mickael Lopes Mendes. Tema 1 de PDI e CG. Demonstração automatizada e legendada da aplicação real; exemplos sintéticos.",
  );
  await hold(16);
  await caption(
    "1 / Captura → processamento → IA → cena 3D",
    "Tudo acontece no navegador. Upload de imagem ou webcam; OpenCV.js transforma a imagem, TensorFlow.js classifica e Three.js extruda os contornos. Sem back-end.",
  );
  await hold(16);
  await page.locator("#about").click();
  await caption(
    "2 / Homografia e segmentação",
    "Na foto da folha, marcamos quatro cantos em ordem. warpPerspective retifica para 384 × 384. Depois: cinza, filtro gaussiano, limiarização adaptativa e fechamento morfológico.",
  );
  await hold(22);
  await page.keyboard.press("Escape");
  await page.locator("#threshold").scrollIntoViewIfNeeded();
  await page.locator("#threshold").fill("14");
  await page.locator("#threshold").dispatchEvent("input");
  await caption(
    "3 / Parâmetros reais de PDI",
    "Mudamos a constante C da limiarização. A máscara binária alimenta os contornos simplificados e a IA. A área mínima elimina ruído; a tolerância controla o número de vértices.",
  );
  await hold(17);
  await page.locator("#threshold").fill("8");
  await page.locator("#threshold").dispatchEvent("input");
  await page.locator("#train").click();
  await caption(
    "4 / Treinamento TensorFlow.js nesta sessão",
    "54 exemplos sintéticos, 18 por classe. Máscaras normalizadas em 24 × 24 → rede densa 48 ReLU → 3 saídas softmax. Treinamento real de 45 épocas, sem modelo remoto.",
  );
  await page.waitForFunction(
    () => window.__studio?.classifier.trained && !window.__studio.busy,
    null,
    { timeout: 90000 },
  );
  await hold(15);
  await page.locator('[data-sample="arvore"]').click();
  await page.locator("#scene").scrollIntoViewIfNeeded();
  await caption(
    "5 / A inferência altera a cena",
    "Árvore: material verde e oscilação lateral. A malha continua vindo dos contornos OpenCV; a classe não substitui o desenho por um objeto pronto. Confira o FPS medido na cena.",
  );
  await hold(20);
  await page.locator('[data-sample="carro"]').click();
  await caption(
    "6 / Outra classe, outra geometria e animação",
    "Carro: material âmbar e movimento horizontal. A imagem retificada vira CanvasTexture. A cena tem câmera, três luzes, OrbitControls e renderer.setAnimationLoop.",
  );
  await hold(18);
  await page.locator("#depth").scrollIntoViewIfNeeded();
  await page.locator("#depth").fill("0.8");
  await page.locator("#depth").dispatchEvent("input");
  await page.locator("#wireframe").check();
  await page.locator("#scene").scrollIntoViewIfNeeded();
  await caption(
    "7 / Do contorno ao volume",
    "ExtrudeGeometry adiciona profundidade à silhueta. A malha permite inspecionar a triangulação; o arquivo pode ser exportado em STL. É relevo 2,5D, não reconstrução volumétrica.",
  );
  await hold(18);
  await page.locator("#wireframe").uncheck();
  await page.locator('[data-sample="casa"]').click();
  await caption(
    "8 / Validação e limites",
    "Testes cobrem homografia, classificação sintética, memória, upload e exportação. Dados reais exigem treinamento variado e teste separado. Webcam física e ≥15 FPS devem ser validados no laboratório.",
  );
  await hold(20);
  await caption(
    "Entrega e autoria",
    "Código modular, README, matriz de requisitos e roteiro de apresentação no repositório. Assistência de OpenAI Codex declarada. A dupla deve revisar o código, publicar a aplicação e demonstrar domínio na apresentação.",
  );
  await hold(16);
  const duration = (Date.now() - start) / 1000;
  const video = page.video();
  await context.close();
  const raw = await video.path();
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-sseof",
      String(-duration),
      "-i",
      raw,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "25",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      output,
    ],
    { stdio: "pipe" },
  );
  console.log(JSON.stringify({ output, durationSeconds: duration }));
} finally {
  await browser.close();
}
