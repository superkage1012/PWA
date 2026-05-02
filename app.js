const preview = document.querySelector("#preview");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const statusText = document.querySelector("#status");
const resultField = document.querySelector("#result");
const copyButton = document.querySelector("#copyButton");

let stream;
let codeReader;
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
  if (!window.ZXing?.BrowserMultiFormatReader) {
    throw new Error("掃描模組載入失敗，請確認網路可連到 jsDelivr CDN。");
  }

  codeReader = new window.ZXing.BrowserMultiFormatReader();
}

function stopScanning() {
  codeReader?.reset();

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
    codeReader.decodeFromVideoElement(preview, (result, error) => {
      if (result) {
        const nextValue = result.getText();
        if (!nextValue || nextValue === lastValue) {
          return;
        }

        updateResult(nextValue);
        setStatus("已掃描到 QR code。");
        return;
      }

      if (!error) {
        return;
      }

      if (
        error instanceof window.ZXing.NotFoundException ||
        error instanceof window.ZXing.ChecksumException ||
        error instanceof window.ZXing.FormatException
      ) {
        return;
      }

      console.error("Scan failed:", error);
      setStatus("掃描時發生錯誤，請稍後再試。");
    });
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
