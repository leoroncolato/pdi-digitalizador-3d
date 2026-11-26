export class Capture {
  constructor(canvas) {
    this.canvas = canvas;
    this.stream = null;
    this.cameraRequest = 0;
    this.imageRequest = 0;
    this.video = document.createElement("video");
    this.video.playsInline = true;
    this.video.muted = true;
  }
  draw(source) {
    this.imageRequest++;
    const w = source.videoWidth || source.naturalWidth || source.width;
    const h = source.videoHeight || source.naturalHeight || source.height;
    if (!w || !h) throw new Error("A imagem ainda não está disponível.");
    const ratio = Math.min(1, 1000 / Math.max(w, h));
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(h * ratio);
    const context = this.canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);
  }
  async loadFile(file) {
    if (!file || !file.type.startsWith("image/"))
      throw new Error("Escolha uma imagem PNG, JPEG ou WebP.");
    if (file.size > 20 * 1024 * 1024)
      throw new Error("Use uma imagem de até 20 MB.");
    const request = ++this.imageRequest;
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (request !== this.imageRequest) return false;
      this.draw(img);
      return true;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async startCamera() {
    this.stopCamera();
    this.imageRequest++;
    const request = this.cameraRequest;
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error(
        "A webcam exige HTTPS ou localhost e um navegador compatível.",
      );
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "environment",
      },
      audio: false,
    });
    if (request !== this.cameraRequest) {
      stream.getTracks().forEach((track) => track.stop());
      return null;
    }
    this.stream = stream;
    try {
      this.video.srcObject = stream;
      await this.video.play();
    } catch (e) {
      if (request !== this.cameraRequest) return null;
      this.stopCamera();
      throw e;
    }
    return request === this.cameraRequest ? this.video : null;
  }
  grabFrame() {
    if (this.stream && this.video.readyState >= 2) this.draw(this.video);
  }
  stopCamera() {
    this.cameraRequest++;
    this.imageRequest++;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
  }
}
