import { scan } from "zxing-wasm/scanner";

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("Missing #root element.");
}

root.innerHTML = `
  <main style="font-family: ui-sans-serif, system-ui, sans-serif; margin: 40px auto; max-width: 720px; padding: 0 20px;">
    <h1 style="margin: 0 0 12px;">zxing-wasm scanner demo</h1>
    <p style="margin: 0 0 20px; color: #555;">
      Select an image, then start the async scan stream on the loaded element.
    </p>

    <label style="display: block; margin-bottom: 12px;">
      <span style="display: block; margin-bottom: 6px; font-weight: 600;">Image</span>
      <input id="file-input" type="file" accept="image/*" />
    </label>

    <label style="display: inline-flex; gap: 8px; align-items: center; margin-bottom: 16px;">
      <input id="worker-toggle" type="checkbox" checked />
      <span>Use shared worker</span>
    </label>

    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <button id="start-button" type="button">Start</button>
      <button id="stop-button" type="button" disabled>Stop</button>
    </div>

    <img id="preview" alt="Selected barcode image" style="display: none; max-width: 100%; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px;" />

    <section>
      <h2 style="margin: 0 0 8px; font-size: 1rem;">Status</h2>
      <pre id="status" style="background: #f6f6f6; border-radius: 8px; margin: 0; padding: 12px; white-space: pre-wrap;">Idle.</pre>
    </section>

    <section style="margin-top: 20px;">
      <h2 style="margin: 0 0 8px; font-size: 1rem;">Latest results</h2>
      <pre id="results" style="background: #111; border-radius: 8px; color: #f4f4f4; margin: 0; min-height: 120px; padding: 12px; white-space: pre-wrap;">[]</pre>
    </section>
  </main>
`;

const fileInput = root.querySelector<HTMLInputElement>("#file-input")!;
const workerToggle = root.querySelector<HTMLInputElement>("#worker-toggle")!;
const startButton = root.querySelector<HTMLButtonElement>("#start-button")!;
const stopButton = root.querySelector<HTMLButtonElement>("#stop-button")!;
const preview = root.querySelector<HTMLImageElement>("#preview")!;
const status = root.querySelector<HTMLPreElement>("#status")!;
const results = root.querySelector<HTMLPreElement>("#results")!;

let currentObjectUrl: string | undefined;
let currentRun: Promise<void> | undefined;
let currentAbortController: AbortController | undefined;

const setStatus = (value: string) => {
  status.textContent = value;
};

const stop = () => {
  currentAbortController?.abort();
  currentAbortController = undefined;
  stopButton.disabled = true;
  startButton.disabled = false;
};

const start = () => {
  if (!preview.src) {
    setStatus("Select an image first.");
    return;
  }
  if (currentRun) {
    setStatus("Scan already running.");
    return;
  }

  const abortController = new AbortController();
  currentAbortController = abortController;
  startButton.disabled = true;
  stopButton.disabled = false;
  setStatus("Scanning...");

  currentRun = (async () => {
    try {
      for await (const scanResults of scan(preview, {
        signal: abortController.signal,
        worker: workerToggle.checked,
      })) {
        results.textContent = JSON.stringify(scanResults, null, 2);
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        setStatus("Stopped.");
        return;
      }
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      if (currentAbortController === abortController) {
        currentAbortController = undefined;
      }
      currentRun = undefined;
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  })();
};

fileInput.addEventListener("change", () => {
  const [file] = fileInput.files ?? [];
  stop();
  results.textContent = "[]";

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = undefined;
  }

  if (!file) {
    preview.removeAttribute("src");
    preview.style.display = "none";
    setStatus("Idle.");
    return;
  }

  currentObjectUrl = URL.createObjectURL(file);
  preview.src = currentObjectUrl;
  preview.style.display = "block";
  setStatus(`Loaded ${file.name}.`);
});

startButton.addEventListener("click", start);
stopButton.addEventListener("click", stop);
