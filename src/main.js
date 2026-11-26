import "./style.css";
import { mountUI, icons, toast } from "./ui.js";
import { Capture } from "./capture.js";
import { initOpenCV, processImage } from "./vision/opencv.js";
import { DrawingClassifier } from "./vision/model.js";
import { createScene } from "./scene/scene.js";
import { drawSample, labels } from "./samples.js";

mountUI();
const $ = (selector) => document.querySelector(selector);
const capture = new Capture($("#source"));
const classifier = new DrawingClassifier();
let scene,
  ready = false,
  busy = false,
  processing = false,
  pendingProcess = false,
  result,
  prediction,
  corners,
  selectedCorners = [],
  selecting = false,
  lastFrame = 0,
  timer;
const params = {
  thresholdC: 8,
  blockSize: 21,
  blurSize: 3,
  morphSize: 3,
  minArea: 100,
  epsilon: 2,
  resolution: 384,
};
capture.draw(drawSample("casa"));
function renderScores() {
  $("#class-scores").innerHTML = Object.entries(labels)
    .map(([key, label]) => {
      const p = Math.round((prediction?.probabilities[key] || 0) * 100);
      return `<div>${label}<span>${prediction?.label ? p + "%" : "—"}</span><b style="--score:${p}%"></b></div>`;
    })
    .join("");
  $("#classification").innerHTML =
    `<i data-lucide="sparkles"></i> ${prediction?.label ? `${labels[prediction.label]} · ${Math.round(prediction.confidence * 100)}%` : "IA aguardando treinamento"}`;
  icons();
}
function drawCorners() {
  $("#corners").innerHTML = selectedCorners.length
    ? `<polygon points="${selectedCorners.map((p) => `${p.x * 100},${p.y * 100}`).join(" ")}"/>${selectedCorners.map((p) => `<circle cx="${p.x * 100}" cy="${p.y * 100}" r="1.4"/>`).join("")}`
    : "";
}
function resetCorners() {
  corners = undefined;
  selectedCorners = [];
  selecting = false;
  $("#drop-zone").classList.remove("selecting");
  $("#corner-help").hidden = true;
  drawCorners();
}
function refreshScene() {
  if (result)
    scene.update({
      polygons: result.polygons,
      textureCanvas: result.correctedCanvas,
      label: prediction?.label,
      confidence: prediction?.confidence,
      depth: Number($("#depth").value),
    });
}
async function processCurrent() {
  pendingProcess = true;
  if (!ready || busy || processing) return;
  pendingProcess = false;
  processing = true;
  try {
    const nextResult = processImage(capture.canvas, params, corners);
    const nextPrediction = nextResult.polygons.length
      ? await classifier.predict(nextResult.maskCanvas)
      : null;
    if (pendingProcess) return;
    result = nextResult;
    prediction = nextPrediction;
    const mask = $("#mask");
    mask.width = result.maskCanvas.width;
    mask.height = result.maskCanvas.height;
    mask.getContext("2d").drawImage(result.maskCanvas, 0, 0);
    refreshScene();
    renderScores();
    $("#geometry-info").textContent =
      `${result.metrics.contourCount} contorno${result.metrics.contourCount === 1 ? "" : "s"} · ${result.metrics.vertices} vértices`;
    $("#contour-count").textContent =
      `${result.metrics.contourCount} contorno${result.metrics.contourCount === 1 ? "" : "s"} encontrado${result.metrics.contourCount === 1 ? "" : "s"}`;
    $("#processing-time").textContent =
      `${result.metrics.processingMs.toFixed(0)} ms · OpenCV.js · 384 × 384`;
    $("#export").disabled = !result.polygons.length;
    if (!result.polygons.length && !capture.stream)
      toast(
        "Nenhum contorno encontrado. Use um desenho escuro e fechado ou ajuste a sensibilidade.",
      );
  } catch (e) {
    toast(e.message, true);
  } finally {
    processing = false;
    if (pendingProcess && !busy) queueMicrotask(processCurrent);
  }
}
function scheduleProcess() {
  clearTimeout(timer);
  timer = setTimeout(processCurrent, 120);
}
function updateCounts() {
  const c = classifier.counts;
  $("#training-status").textContent =
    `${c.casa} casas · ${c.arvore} árvores · ${c.carro} carros. Exemplos nesta sessão; base inicial sintética.`;
}
function stopCamera() {
  capture.stopCamera();
  $("#camera-preview").hidden = true;
  $("#camera-preview").srcObject = null;
  $("#camera").innerHTML = '<i data-lucide="camera"></i> Usar webcam';
  icons();
}
async function loadFile(file) {
  try {
    stopCamera();
    if (!(await capture.loadFile(file))) return;
    resetCorners();
    $("#source-tag").textContent = "SUA IMAGEM";
    $("#paper-label").textContent = file.name;
    document
      .querySelectorAll(".sample")
      .forEach((b) => b.classList.remove("active"));
    await processCurrent();
  } catch (e) {
    toast(e.message, true);
  }
}
$("#upload").onclick = () => $("#file").click();
$("#file").onchange = async (e) => {
  if (e.target.files[0]) await loadFile(e.target.files[0]);
  e.target.value = "";
};
$("#drop-zone").ondragover = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
};
$("#drop-zone").ondrop = (e) => {
  e.preventDefault();
  if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
};
$("#camera").onclick = async () => {
  if (capture.stream) {
    capture.grabFrame();
    stopCamera();
    await processCurrent();
    toast("Quadro capturado. Agora você pode corrigir a perspectiva.");
    return;
  }
  try {
    resetCorners();
    const video = await capture.startCamera();
    if (!video) return;
    $("#camera-preview").srcObject = video.srcObject;
    $("#camera-preview").hidden = false;
    await $("#camera-preview").play();
    $("#camera").innerHTML = '<i data-lucide="square"></i> Capturar e parar';
    $("#source-tag").textContent = "WEBCAM";
    $("#paper-label").textContent = "CAPTURA LOCAL";
    icons();
  } catch (e) {
    stopCamera();
    toast(
      `Não foi possível abrir a webcam. Verifique a permissão e a câmera. ${e.message}`,
      true,
    );
  }
};
document.querySelectorAll("[data-sample]").forEach(
  (button) =>
    (button.onclick = async () => {
      stopCamera();
      resetCorners();
      capture.draw(drawSample(button.dataset.sample));
      $("#source-tag").textContent = "EXEMPLO";
      $("#paper-label").textContent =
        `${labels[button.dataset.sample].toUpperCase()} · EXEMPLO ILUSTRATIVO`;
      document
        .querySelectorAll(".sample")
        .forEach((b) => b.classList.toggle("active", b === button));
      await processCurrent();
    }),
);
$("#perspective").onclick = () => {
  if (capture.stream) {
    toast("Capture e pare a webcam antes de marcar os cantos.");
    return;
  }
  selectedCorners = [];
  selecting = true;
  $("#drop-zone").classList.add("selecting");
  $("#corner-help").hidden = false;
  drawCorners();
};
$("#source").onclick = async (e) => {
  if (!selecting) return;
  const rect = e.target.getBoundingClientRect();
  selectedCorners.push({
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height,
  });
  drawCorners();
  if (selectedCorners.length === 4) {
    corners = [...selectedCorners];
    selecting = false;
    $("#drop-zone").classList.remove("selecting");
    $("#corner-help").hidden = true;
    await processCurrent();
  }
};
$("#reset-corners").onclick = () => {
  resetCorners();
  scheduleProcess();
};
for (const [id, key, output, suffix] of [
  ["threshold", "thresholdC", "threshold-value", ""],
  ["block-size", "blockSize"],
  ["blur", "blurSize"],
  ["morph", "morphSize"],
  ["min-area", "minArea", "area-value", " px²"],
  ["epsilon", "epsilon", "epsilon-value", " px"],
]) {
  $("#" + id).addEventListener("input", (e) => {
    params[key] = Number(e.target.value);
    if (output) $("#" + output).value = e.target.value + suffix;
    scheduleProcess();
  });
}
$("#depth").oninput = (e) => {
  $("#depth-value").value = Number(e.target.value).toFixed(2).replace(".", ",");
  scene?.setOptions({ depth: Number(e.target.value) });
};
$("#animate").onchange = (e) =>
  scene?.setOptions({ animate: e.target.checked });
$("#wireframe").onchange = (e) =>
  scene?.setOptions({ wireframe: e.target.checked });
$("#reset-view").onclick = () => scene?.resetCamera();
$("#export").onclick = () => {
  try {
    scene.exportSTL();
    toast("Objeto exportado em STL.");
  } catch (e) {
    toast(e.message, true);
  }
};
$("#add-example").onclick = () => {
  try {
    if (!result?.polygons.length)
      throw new Error("Processe um desenho com contornos primeiro.");
    classifier.addExample(result.maskCanvas, $("#training-label").value);
    updateCounts();
    toast("Exemplo adicionado. Treine novamente para atualizar o modelo.");
  } catch (e) {
    toast(e.message, true);
  }
};
$("#train").onclick = async () => {
  if (!ready || busy) return;
  busy = true;
  $("#train").disabled = true;
  $("#add-example").disabled = true;
  try {
    await classifier.train(({ epoch, epochs, accuracy }) => {
      $("#training-status").textContent =
        `Época ${epoch}/${epochs} · acurácia no treino ${Math.round(accuracy * 100)}% (não é validação)`;
    });
    toast(
      "Modelo treinado nesta sessão. A classificação agora controla a cena.",
    );
  } catch (e) {
    toast(e.message, true);
  } finally {
    busy = false;
    $("#train").disabled = false;
    $("#add-example").disabled = false;
    updateCounts();
    await processCurrent();
  }
};
$("#about").onclick = () => $("#about-dialog").showModal();
$("#close-about").onclick = () => $("#about-dialog").close();
$("#about-dialog").onclick = (e) => {
  if (e.target === $("#about-dialog")) {
    const r = e.target.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      e.target.close();
  }
};
async function cameraLoop(now) {
  if (
    capture.stream &&
    ready &&
    !busy &&
    !processing &&
    !document.hidden &&
    now - lastFrame > 300
  ) {
    lastFrame = now;
    capture.grabFrame();
    await processCurrent();
  }
  requestAnimationFrame(cameraLoop);
}
async function init() {
  $("#train").disabled = true;
  $("#add-example").disabled = true;
  try {
    scene = createScene($("#scene"), {
      onFps: (fps) => {
        $("#fps").textContent = `${Math.round(fps)} FPS`;
      },
    });
    await Promise.all([initOpenCV(), classifier.init()]);
    $("#engine-state").textContent = "OpenCV pronto · IA local";
    for (let i = 0; i < 18; i++) {
      for (const label of Object.keys(labels)) {
        const sample = processImage(drawSample(label, i, 256), params);
        classifier.addExample(sample.maskCanvas, label);
      }
      if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    ready = true;
    updateCounts();
    await processCurrent();
    $("#scene-loading").hidden = true;
    $("#train").disabled = false;
    $("#add-example").disabled = false;
    window.__studio = {
      get ready() {
        return ready;
      },
      classifier,
      processImage,
      drawSample,
      get result() {
        return result;
      },
      get prediction() {
        return prediction;
      },
      get busy() {
        return busy;
      },
      scene,
      capture,
    };
    requestAnimationFrame(cameraLoop);
  } catch (e) {
    $("#engine-state").textContent = "Falha na inicialização";
    $("#scene-loading").textContent = e.message;
    toast(e.message, true);
    console.error(e);
  }
}
window.addEventListener("pagehide", (event) => {
  stopCamera();
  if (event.persisted) return;
  classifier.dispose();
  scene?.dispose();
});
init();
