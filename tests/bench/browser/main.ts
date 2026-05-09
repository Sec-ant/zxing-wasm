/**
 * Browser benchmark runner — main thread entry point.
 *
 * Loaded by bench.html via <script type="module">.
 * Runs three benchmark groups:
 *   Bench D — DOM element extraction methods
 *   Bench E — Full pipeline (main thread vs Worker)
 *   Bench F — postMessage serialization overhead
 *
 * Results are stored on window.__BENCH_RESULTS__ for Playwright to collect.
 */
import {
  prepareZXingModule,
  type ReaderOptions,
  readBarcodes,
} from "../../../src/reader/index.js";
import { type BenchResult, benchmark } from "./harness.js";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    __BENCH_RESULTS__: BenchResult[];
    __BENCH_DONE__: boolean;
    __BENCH_ERROR__: string | null;
  }
}

const resolutions = ["720p", "1080p", "4k"] as const;
type Res = (typeof resolutions)[number];

const dims: Record<Res, [w: number, h: number]> = {
  "720p": [1280, 720],
  "1080p": [1920, 1080],
  "4k": [3840, 2160],
};

const optimizedOpts: ReaderOptions = {
  tryInvert: false,
  tryRotate: false,
  maxNumberOfSymbols: 1,
  formats: ["QRCode"],
};

const status = document.getElementById("status")!;
const results: BenchResult[] = [];

function log(msg: string) {
  status.textContent = msg;
  console.log(`[bench] ${msg}`);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Load an image by URL and return the HTMLImageElement. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load ${url}: ${e}`));
    img.src = url;
  });
}

/** Extract ImageData from an HTMLImageElement via OffscreenCanvas. */
function extractImageData(
  img: HTMLImageElement,
  w: number,
  h: number,
): ImageData {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/** Extract a Blob from an HTMLImageElement via OffscreenCanvas. */
async function extractBlob(
  img: HTMLImageElement,
  w: number,
  h: number,
  type = "image/png",
): Promise<Blob> {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.convertToBlob({ type });
}

/** Create a Worker and wait for it to be ready. */
function createScannerWorker(): Promise<Worker> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./scanner-worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e) => {
      if (e.data.type === "ready") resolve(worker);
    };
    worker.onerror = (e) => reject(new Error(`Worker error: ${e.message}`));
  });
}

/** Send data to Worker and wait for result. Returns decode time from Worker. */
function workerDecode(
  worker: Worker,
  input: ImageData | Blob | Uint8Array,
  transfer?: Transferable[],
  mode?: string,
): Promise<{ decodeTime: number; found: number }> {
  return new Promise((resolve) => {
    const id = Math.random();
    const handler = (e: MessageEvent) => {
      if (e.data.id === id) {
        worker.removeEventListener("message", handler);
        resolve({ decodeTime: e.data.decodeTime, found: e.data.found });
      }
    };
    worker.addEventListener("message", handler);
    const msg = { id, input, mode };
    if (transfer) {
      worker.postMessage(msg, transfer);
    } else {
      worker.postMessage(msg);
    }
  });
}

/** Send raw buffer + dimensions to Worker. */
function workerDecodeRaw(
  worker: Worker,
  mode: "rawBuffer" | "grayscale",
  buffer: ArrayBuffer,
  width: number,
  height: number,
  transfer: boolean,
): Promise<{ decodeTime: number; found: number }> {
  return new Promise((resolve) => {
    const id = Math.random();
    const handler = (e: MessageEvent) => {
      if (e.data.id === id) {
        worker.removeEventListener("message", handler);
        resolve({ decodeTime: e.data.decodeTime, found: e.data.found });
      }
    };
    worker.addEventListener("message", handler);
    const msg = { id, mode, input: { buffer, width, height } };
    if (transfer) {
      worker.postMessage(msg, [buffer]);
    } else {
      worker.postMessage(msg);
    }
  });
}

/**
 * rgbaToGrayscale — same formula as src/share.ts
 * (306*R + 601*G + 117*B + 0x200) >> 10
 */
function rgbaToGrayscale(data: Uint8ClampedArray): Uint8Array {
  const pixelCount = data.byteLength >> 2;
  const lum = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const offset = i << 2;
    lum[i] =
      (306 * data[offset]! +
        601 * data[offset + 1]! +
        117 * data[offset + 2]! +
        0x200) >>
      10;
  }
  return lum;
}

/* ------------------------------------------------------------------ */
/*  Bench D — DOM element extraction methods                           */
/* ------------------------------------------------------------------ */

async function benchD(images: Record<Res, HTMLImageElement>) {
  log("Running Bench D — DOM extraction methods...");

  for (const res of resolutions) {
    const [w, h] = dims[res];
    const img = images[res];

    // D1: drawImage + getImageData (OffscreenCanvas)
    results.push(
      await benchmark(
        `D: Extraction — ${res}`,
        "OffscreenCanvas drawImage+getImageData",
        () => {
          const canvas = new OffscreenCanvas(w, h);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          ctx.getImageData(0, 0, w, h);
        },
        { warmup: 10, iterations: 50 },
      ),
    );

    // D2: OffscreenCanvas convertToBlob (PNG)
    results.push(
      await benchmark(
        `D: Extraction — ${res}`,
        "OffscreenCanvas convertToBlob(PNG)",
        async () => {
          const canvas = new OffscreenCanvas(w, h);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          await canvas.convertToBlob({ type: "image/png" });
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    // D3: OffscreenCanvas convertToBlob (JPEG)
    results.push(
      await benchmark(
        `D: Extraction — ${res}`,
        "OffscreenCanvas convertToBlob(JPEG)",
        async () => {
          const canvas = new OffscreenCanvas(w, h);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    // D4: createImageBitmap (from img element)
    results.push(
      await benchmark(
        `D: Extraction — ${res}`,
        "createImageBitmap",
        async () => {
          const bmp = await createImageBitmap(img);
          bmp.close();
        },
        { warmup: 10, iterations: 50 },
      ),
    );

    // D5: createImageBitmap then draw to get ImageData
    results.push(
      await benchmark(
        `D: Extraction — ${res}`,
        "createImageBitmap+drawImage+getImageData",
        async () => {
          const bmp = await createImageBitmap(img);
          const canvas = new OffscreenCanvas(w, h);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(bmp, 0, 0);
          ctx.getImageData(0, 0, w, h);
          bmp.close();
        },
        { warmup: 10, iterations: 50 },
      ),
    );

    log(`Bench D: ${res} done`);
  }
}

/* ------------------------------------------------------------------ */
/*  Bench E — Full pipeline (main thread vs Worker)                    */
/* ------------------------------------------------------------------ */

async function benchE(images: Record<Res, HTMLImageElement>) {
  log("Running Bench E — Full pipeline...");

  // Prepare WASM module on main thread
  await prepareZXingModule({ fireImmediately: true });

  // Create worker
  const worker = await createScannerWorker();

  for (const res of resolutions) {
    const [w, h] = dims[res];
    const img = images[res];

    // E1: Main thread — ImageData path (extract + decode)
    results.push(
      await benchmark(
        `E: Full pipeline — ${res}`,
        "Main thread: ImageData",
        async () => {
          const imageData = extractImageData(img, w, h);
          await readBarcodes(imageData, optimizedOpts);
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    // E2: Main thread — Blob path (extract + decode)
    results.push(
      await benchmark(
        `E: Full pipeline — ${res}`,
        "Main thread: Blob(JPEG)",
        async () => {
          const blob = await extractBlob(img, w, h, "image/jpeg");
          await readBarcodes(blob, optimizedOpts);
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    // E3: Worker — ImageData via structured clone
    results.push(
      await benchmark(
        `E: Full pipeline — ${res}`,
        "Worker: ImageData (clone)",
        async () => {
          const imageData = extractImageData(img, w, h);
          await workerDecode(worker, imageData);
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    // E4: Worker — ImageData via transfer (ArrayBuffer)
    results.push(
      await benchmark(
        `E: Full pipeline — ${res}`,
        "Worker: ImageData (transfer)",
        async () => {
          const imageData = extractImageData(img, w, h);
          await workerDecode(worker, imageData, [imageData.data.buffer]);
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    // E5: Worker — Blob (structured clone, but Blobs are cheap to clone)
    results.push(
      await benchmark(
        `E: Full pipeline — ${res}`,
        "Worker: Blob(JPEG)",
        async () => {
          const blob = await extractBlob(img, w, h, "image/jpeg");
          await workerDecode(worker, blob);
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    // E6: Worker — raw ArrayBuffer transfer + reconstruct ImageData in Worker
    // Main thread extracts pixel data, transfers the underlying ArrayBuffer
    // Worker reconstructs ImageData and calls readBarcodes()
    results.push(
      await benchmark(
        `E: Full pipeline — ${res}`,
        "Worker: raw RGBA transfer→ImageData",
        async () => {
          const imageData = extractImageData(img, w, h);
          const buffer = imageData.data.buffer as ArrayBuffer;
          await workerDecodeRaw(worker, "rawBuffer", buffer, w, h, true);
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    // E7: Worker — grayscale on main thread + transfer grayscale buffer
    // Main thread: extract → rgbaToGrayscale → transfer 1/4 size buffer
    // Worker: direct readBarcodesFromPixmap (skips redundant grayscale)
    results.push(
      await benchmark(
        `E: Full pipeline — ${res}`,
        "Worker: grayscale transfer→Pixmap",
        async () => {
          const imageData = extractImageData(img, w, h);
          const lum = rgbaToGrayscale(imageData.data);
          await workerDecodeRaw(
            worker,
            "grayscale",
            lum.buffer as ArrayBuffer,
            w,
            h,
            true,
          );
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    log(`Bench E: ${res} done`);
  }

  worker.terminate();
}

/* ------------------------------------------------------------------ */
/*  Bench F — postMessage serialization overhead                       */
/* ------------------------------------------------------------------ */

async function benchF() {
  log("Running Bench F — postMessage overhead...");

  // Use a simple echo worker for measuring postMessage round-trip
  const echoWorkerCode = `
    self.onmessage = (e) => {
      self.postMessage({ id: e.data.id, received: true });
    };
  `;
  const blob = new Blob([echoWorkerCode], { type: "application/javascript" });
  const echoWorker = new Worker(URL.createObjectURL(blob));

  function echoRoundTrip(
    data: unknown,
    transfer?: Transferable[],
  ): Promise<void> {
    return new Promise((resolve) => {
      const id = Math.random();
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          echoWorker.removeEventListener("message", handler);
          resolve();
        }
      };
      echoWorker.addEventListener("message", handler);
      if (transfer) {
        echoWorker.postMessage({ id, data }, transfer);
      } else {
        echoWorker.postMessage({ id, data });
      }
    });
  }

  // Test different payload sizes
  const payloads = [
    { name: "720p RGBA (3.7MB)", size: 1280 * 720 * 4 },
    { name: "1080p RGBA (8.3MB)", size: 1920 * 1080 * 4 },
    { name: "4K RGBA (33.2MB)", size: 3840 * 2160 * 4 },
    { name: "720p Lum (0.9MB)", size: 1280 * 720 },
    { name: "1080p Lum (2.1MB)", size: 1920 * 1080 },
    { name: "4K Lum (8.3MB)", size: 3840 * 2160 },
  ];

  for (const { name, size } of payloads) {
    // F1: Structured clone (Uint8Array)
    results.push(
      await benchmark(
        "F: postMessage overhead",
        `Clone: ${name}`,
        async () => {
          const buf = new Uint8Array(size);
          await echoRoundTrip(buf);
        },
        { warmup: 5, iterations: 30 },
      ),
    );

    // F2: Transfer (ArrayBuffer)
    results.push(
      await benchmark(
        "F: postMessage overhead",
        `Transfer: ${name}`,
        async () => {
          const buf = new Uint8Array(size);
          await echoRoundTrip(buf, [buf.buffer]);
        },
        { warmup: 5, iterations: 30 },
      ),
    );
  }

  // F3: Blob (reference semantics — should be near-zero overhead)
  for (const { name, size } of payloads.slice(0, 3)) {
    results.push(
      await benchmark(
        "F: postMessage overhead",
        `Blob: ${name}`,
        async () => {
          const b = new Blob([new Uint8Array(size)]);
          await echoRoundTrip(b);
        },
        { warmup: 5, iterations: 30 },
      ),
    );
  }

  echoWorker.terminate();
}

/* ------------------------------------------------------------------ */
/*  Main orchestrator                                                  */
/* ------------------------------------------------------------------ */

async function main() {
  try {
    window.__BENCH_RESULTS__ = [];
    window.__BENCH_DONE__ = false;
    window.__BENCH_ERROR__ = null;

    // Load fixture images
    log("Loading fixture images...");
    const images = {} as Record<Res, HTMLImageElement>;
    for (const res of resolutions) {
      images[res] = await loadImage(`/tests/bench/fixtures/qrcode-${res}.png`);
    }
    log("Images loaded.");

    // Run benchmarks sequentially
    await benchD(images);
    await benchE(images);
    await benchF();

    window.__BENCH_RESULTS__ = results;
    window.__BENCH_DONE__ = true;
    log(`Done! ${results.length} benchmarks completed.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    window.__BENCH_ERROR__ = msg;
    window.__BENCH_DONE__ = true;
    log(`ERROR: ${msg}`);
    console.error(e);
  }
}

main();
