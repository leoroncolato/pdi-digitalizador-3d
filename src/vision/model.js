import * as tf from "@tensorflow/tfjs";

export const LABELS = ["casa", "arvore", "carro"];
const SIDE = 24;

/** Convert the OpenCV mask (white foreground) into centered, scale-normalized ink. */
function features(canvas) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  if (!width || !height) throw new Error("A imagem de treinamento está vazia.");
  const pixels = context.getImageData(0, 0, width, height).data;
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4] > 127) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left)
    throw new Error("Nenhum traço encontrado para classificar.");
  const small = document.createElement("canvas");
  small.width = small.height = SIDE;
  const target = small.getContext("2d", { willReadFrequently: true });
  target.fillStyle = "#000";
  target.fillRect(0, 0, SIDE, SIDE);
  const w = right - left + 1,
    h = bottom - top + 1;
  const scale = (SIDE - 4) / Math.max(w, h);
  target.drawImage(
    canvas,
    left,
    top,
    w,
    h,
    (SIDE - w * scale) / 2,
    (SIDE - h * scale) / 2,
    w * scale,
    h * scale,
  );
  const data = target.getImageData(0, 0, SIDE, SIDE).data;
  return Float32Array.from(
    { length: SIDE * SIDE },
    (_, i) => data[i * 4] / 255,
  );
}

export class DrawingClassifier {
  #examples = [];
  #model = null;
  #trained = false;
  #busy = false;

  get counts() {
    return Object.fromEntries(
      LABELS.map((label) => [
        label,
        this.#examples.filter((example) => example.label === label).length,
      ]),
    );
  }

  get trained() {
    return this.#trained;
  }
  get backend() {
    return tf.getBackend();
  }
  get tensorCount() {
    return tf.memory().numTensors;
  }

  async init() {
    try {
      await tf.setBackend("webgl");
    } catch {
      await tf.setBackend("cpu");
    }
    await tf.ready();
    return this;
  }

  addExample(canvas, label) {
    if (!LABELS.includes(label))
      throw new Error("Escolha casa, árvore ou carro.");
    if (this.#busy) throw new Error("Aguarde o treinamento terminar.");
    if (this.#examples.length >= 600)
      throw new Error(
        "Limite de 600 exemplos atingido. Reinicie a página para começar outro conjunto.",
      );
    this.#examples.push({ input: features(canvas), label });
    return this.counts;
  }

  /** onProgress receives { epoch, epochs, loss, accuracy }. Samples stay in this tab. */
  async train(onProgress = () => {}) {
    if (this.#busy) throw new Error("Um treinamento já está em andamento.");
    if (Object.values(this.counts).some((count) => count < 3))
      throw new Error("Adicione pelo menos três exemplos de cada classe.");
    this.#busy = true;
    const epochs = 45;
    let inputs, targets, candidate;
    try {
      inputs = tf.tensor2d(
        this.#examples.map(({ input }) => Array.from(input)),
        [this.#examples.length, SIDE * SIDE],
      );
      targets = tf.tidy(() =>
        tf.oneHot(
          tf.tensor1d(
            this.#examples.map(({ label }) => LABELS.indexOf(label)),
            "int32",
          ),
          LABELS.length,
        ),
      );
      candidate = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [SIDE * SIDE],
            units: 48,
            activation: "relu",
            kernelInitializer: "glorotUniform",
          }),
          tf.layers.dense({ units: LABELS.length, activation: "softmax" }),
        ],
      });
      candidate.compile({
        optimizer: tf.train.adam(0.005),
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"],
      });
      await candidate.fit(inputs, targets, {
        epochs,
        batchSize: Math.min(24, this.#examples.length),
        shuffle: true,
        yieldEvery: "epoch",
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            onProgress({
              epoch: epoch + 1,
              epochs,
              loss: logs.loss,
              accuracy: logs.acc ?? logs.accuracy,
            });
            await tf.nextFrame();
          },
        },
      });
      this.#model?.optimizer?.dispose();
      this.#model?.dispose();
      this.#model = candidate;
      candidate = null;
      this.#trained = true;
      return { counts: this.counts, epochs };
    } finally {
      inputs?.dispose();
      targets?.dispose();
      candidate?.optimizer?.dispose();
      candidate?.dispose();
      this.#busy = false;
    }
  }

  async predict(canvas) {
    if (!this.#trained || !this.#model)
      return { label: null, confidence: 0, probabilities: {} };
    const input = features(canvas);
    const output = tf.tidy(() =>
      this.#model.predict(tf.tensor2d(input, [1, SIDE * SIDE])),
    );
    try {
      const values = Array.from(await output.data());
      const winner = values.indexOf(Math.max(...values));
      return {
        label: LABELS[winner],
        confidence: values[winner],
        probabilities: Object.fromEntries(
          LABELS.map((label, i) => [label, values[i]]),
        ),
      };
    } finally {
      output.dispose();
    }
  }

  dispose() {
    if (this.#busy) return;
    this.#model?.optimizer?.dispose();
    this.#model?.dispose();
    this.#model = null;
    this.#trained = false;
    this.#examples = [];
  }
}
