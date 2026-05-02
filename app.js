const preview = document.querySelector("#preview");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const statusText = document.querySelector("#status");
const resultField = document.querySelector("#result");
const copyButton = document.querySelector("#copyButton");

let stream;
let detector;
let scanTimer;
let lastValue = "";

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.error("Service worker registration failed:", error);
  }
}

function setStatus(message) {
  statusText.textContent = message;
}

function setButtons(isScanning) {
  startButton.disabled = isScanning;
  stopButton.disabled = !isScanning;
}

function updateResult(value) {
  lastValue = value;
  resultField.value = value;
  copyButton.disabled = value.length === 0;
}

async function createDetector() {
  if (!("BarcodeDetector" in window)) {
    throw new Error("這個裝置的瀏覽器不支援 BarcodeDetector。請使用最新版 Chrome 或 Edge。");
  }

  const formats = await BarcodeDetector.getSupportedFormats();
  if (!formats.includes("qr_code")) {
    throw new Error("目前瀏覽器不支援 QR code 掃描格式。");
  }

  detector = new BarcodeDetector({ formats: ["qr_code"] });
}

async function scanFrame() {
  if (!detector || preview.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return;
  }

  try {
    const codes = await detector.detect(preview);
    if (codes.length === 0) {
      return;
    }

    const nextValue = codes[0].rawValue ?? "";
    if (!nextValue || nextValue === lastValue) {
      return;
    }

    updateResult(nextValue);
    setStatus("已掃描到 QR code。");
  } catch (error) {
    console.error("Scan failed:", error);
    setStatus("掃描時發生錯誤，請稍後再試。");
  }
}

function stopScanning() {
  window.clearInterval(scanTimer);
  scanTimer = undefined;

  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  stream = undefined;
  preview.srcObject = null;
  setButtons(false);
  setStatus("已停止掃描。");
}

async function startScanning() {
  try {
    setStatus("初始化掃描器中...");
    await createDetector();

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      },
      audio: false
    });

    preview.srcObject = stream;
    await preview.play();

    updateResult("");
    setButtons(true);
    setStatus("相機已開啟，請將 QR code 放進框內。");

    scanTimer = window.setInterval(scanFrame, 350);
  } catch (error) {
    console.error("Unable to start scanner:", error);
    stopScanning();
    setStatus(error instanceof Error ? error.message : "無法開啟相機。");
  }
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(lastValue);
    setStatus("內容已複製。");
  } catch (error) {
    console.error("Copy failed:", error);
    setStatus("無法複製內容。");
  }
}

startButton.addEventListener("click", startScanning);
stopButton.addEventListener("click", stopScanning);
copyButton.addEventListener("click", copyResult);
window.addEventListener("beforeunload", stopScanning);

registerServiceWorker();
