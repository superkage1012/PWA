const preview = document.querySelector("#preview");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const statusText = document.querySelector("#status");
const resultField = document.querySelector("#result");
const copyButton = document.querySelector("#copyButton");

let codeReader;
let controls;
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
  if (!window.ZXingBrowser?.BrowserQRCodeReader) {
    throw new Error("掃描模組載入失敗，請確認網路可連到 CDN。");
  }

  codeReader = new window.ZXingBrowser.BrowserQRCodeReader();
}

function stopScanning() {
  controls?.stop();
  controls = undefined;
  codeReader?.reset();
  preview.srcObject = null;
  setButtons(false);
  setStatus("已停止掃描。");
}

async function startScanning() {
  try {
    setStatus("初始化掃描器中...");
    await createDetector();

    updateResult("");
    setButtons(true);
    setStatus("相機已開啟，正在掃描中，請把 QR code 靠近並置中。");

    controls = await codeReader.decodeFromConstraints({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: "continuous"
      },
      audio: false
    }, preview, (result, error) => {
      if (result) {
        const nextValue = result.getText();
        if (!nextValue || nextValue === lastValue) {
          return;
        }

        updateResult(nextValue);
        setStatus("已掃描到 QR code。");
        controls?.stop();
        controls = undefined;
        return;
      }

      if (!error) {
        return;
      }

      if (
        error instanceof window.ZXingBrowser.NotFoundException ||
        error instanceof window.ZXingBrowser.ChecksumException ||
        error instanceof window.ZXingBrowser.FormatException
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
