import opencvUrl from "@techstark/opencv-js/dist/opencv.js?url";
// All intermediate OpenCV allocations are scoped to one processing call.
let cv;
let ready;

export function initOpenCV() {
  if (!ready) {
    // Load the npm UMD bundle as a local asset. Bundling its exported Promise
    // as CommonJS changes the receiver of .then in production (Vite/Rolldown).
    ready = new Promise((resolve, reject) => {
      if (globalThis.cv) {
        resolve(globalThis.cv);
        return;
      }
      const script = document.createElement("script");
      script.src = opencvUrl;
      script.async = true;
      script.onload = () => resolve(globalThis.cv);
      script.onerror = () => {
        script.remove();
        reject(new Error("Não foi possível carregar o OpenCV local."));
      };
      document.head.append(script);
    })
      .then(async (runtime) => {
        if (typeof runtime.then === "function") runtime = await runtime;
        if (!runtime.Mat) {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () =>
                reject(
                  new Error(
                    "OpenCV demorou demais para inicializar. Recarregue a página.",
                  ),
                ),
              60000,
            );
            const previous = runtime.onRuntimeInitialized;
            runtime.onRuntimeInitialized = () => {
              clearTimeout(timeout);
              previous?.();
              resolve();
            };
            runtime.onAbort = (reason) => {
              clearTimeout(timeout);
              reject(new Error(`Falha ao iniciar OpenCV: ${reason}`));
            };
          });
        }
        cv = runtime;
        return cv;
      })
      .catch((error) => {
        ready = undefined;
        throw error;
      });
  }
  return ready;
}

const odd = (value, fallback, max = 99) => {
  const n = Math.max(3, Math.min(max, Math.round(Number(value) || fallback)));
  return n % 2 ? n : n + 1;
};

function validateCorners(corners) {
  if (!Array.isArray(corners) || corners.length !== 4)
    throw new Error("Marque os quatro cantos da folha.");
  const points = corners.map(({ x, y }) => ({ x: Number(x), y: Number(y) }));
  if (
    points.some(
      ({ x, y }) =>
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        x > 1 ||
        y < 0 ||
        y > 1,
    )
  ) {
    throw new Error("Os cantos precisam ficar dentro da imagem.");
  }
  const turns = points.map((a, i) => {
    const b = points[(i + 1) % 4];
    const c = points[(i + 2) % 4];
    return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
  });
  if (!turns.every((turn) => turn > 0.0001)) {
    throw new Error(
      "Posicione os cantos em ordem: superior esquerdo, superior direito, inferior direito e inferior esquerdo.",
    );
  }
  return points;
}

/** corners: normalized TL, TR, BR, BL. maskCanvas has white ink on black. */
export function processImage(
  sourceCanvas,
  params = {},
  corners = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
) {
  if (!cv?.Mat) throw new Error("Aguarde a inicialização do OpenCV.");
  if (!sourceCanvas.width || !sourceCanvas.height)
    throw new Error("Capture ou carregue uma imagem primeiro.");
  const started = performance.now();
  const points = validateCorners(corners);
  const size = Math.max(
    128,
    Math.min(768, Math.round(Number(params.resolution) || 384)),
  );
  const owned = [];
  const keep = (value) => {
    owned.push(value);
    return value;
  };
  try {
    const source = keep(cv.imread(sourceCanvas));
    const sourcePoints = keep(
      cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        points.flatMap(({ x, y }) => [
          x * (source.cols - 1),
          y * (source.rows - 1),
        ]),
      ),
    );
    const destinationPoints = keep(
      cv.matFromArray(4, 1, cv.CV_32FC2, [
        0,
        0,
        size - 1,
        0,
        size - 1,
        size - 1,
        0,
        size - 1,
      ]),
    );
    const homography = keep(
      cv.getPerspectiveTransform(sourcePoints, destinationPoints),
    );
    const corrected = keep(new cv.Mat());
    cv.warpPerspective(
      source,
      corrected,
      homography,
      new cv.Size(size, size),
      cv.INTER_LINEAR,
      cv.BORDER_REPLICATE,
    );
    const correctedCanvas = document.createElement("canvas");
    cv.imshow(correctedCanvas, corrected);

    const gray = keep(new cv.Mat());
    cv.cvtColor(corrected, gray, cv.COLOR_RGBA2GRAY);
    const smooth = keep(new cv.Mat());
    const blur =
      Number(params.blurSize) === 1 ? 1 : odd(params.blurSize, 3, 15);
    if (blur === 1) gray.copyTo(smooth);
    else
      cv.GaussianBlur(
        gray,
        smooth,
        new cv.Size(blur, blur),
        0,
        0,
        cv.BORDER_DEFAULT,
      );
    const binary = keep(new cv.Mat());
    cv.adaptiveThreshold(
      smooth,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      odd(params.blockSize, 21),
      Number.isFinite(Number(params.thresholdC))
        ? Number(params.thresholdC)
        : 8,
    );
    const mask = keep(new cv.Mat());
    const morphSize = Math.max(
      1,
      Math.min(11, Math.round(Number(params.morphSize) || 3)),
    );
    const kernel = keep(
      cv.getStructuringElement(
        cv.MORPH_ELLIPSE,
        new cv.Size(morphSize, morphSize),
      ),
    );
    cv.morphologyEx(binary, mask, cv.MORPH_CLOSE, kernel);
    const maskCanvas = document.createElement("canvas");
    cv.imshow(maskCanvas, mask);

    const contours = keep(new cv.MatVector());
    const hierarchy = keep(new cv.Mat());
    cv.findContours(
      mask,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );
    const candidates = [];
    const minArea = Math.max(1, Number(params.minArea) || 100);
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const approximation = new cv.Mat();
      try {
        const area = Math.abs(cv.contourArea(contour));
        if (area < minArea || area > size * size * 0.985) continue;
        cv.approxPolyDP(
          contour,
          approximation,
          Math.max(0.2, Number(params.epsilon) || 2),
          true,
        );
        if (approximation.rows < 3) continue;
        const polygon = [];
        for (let j = 0; j < approximation.rows; j++) {
          polygon.push({
            x: approximation.data32S[j * 2] / (size - 1),
            y: approximation.data32S[j * 2 + 1] / (size - 1),
          });
        }
        candidates.push({ area, polygon });
      } finally {
        approximation.delete();
        contour.delete();
      }
    }
    // A practical geometry budget protects the render loop from noisy photographs.
    const polygons = candidates
      .sort((a, b) => b.area - a.area)
      .slice(0, 24)
      .map(({ polygon }) => polygon);
    return {
      polygons,
      maskCanvas,
      correctedCanvas,
      metrics: {
        processingMs: performance.now() - started,
        contourCount: polygons.length,
        rawContourCount: contours.size(),
        vertices: polygons.reduce((sum, polygon) => sum + polygon.length, 0),
        width: size,
        height: size,
      },
    };
  } finally {
    for (let i = owned.length - 1; i >= 0; i--) owned[i].delete();
  }
}
