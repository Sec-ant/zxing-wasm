/**
 * readBarcodes end-to-end benchmark.
 *
 * Measures the public `readBarcodes(ImageData)` API at three resolutions
 * with both default and optimized reader options.
 *
 * Usage:
 *   pnpm bench                # run and print results
 *   pnpm bench:save           # save baseline to bench/bench.json
 *   pnpm bench:compare        # compare against saved baseline
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { beforeAll, bench, describe } from "vitest";
import type { ReaderOptions } from "../src/bindings/index.js";
import { prepareZXingModule, readBarcodes } from "../src/reader/index.js";

/* ------------------------------------------------------------------ */
/*  Setup                                                              */
/* ------------------------------------------------------------------ */

let img720: ImageData;
let img1080: ImageData;
let img4k: ImageData;

const optimizedOpts: ReaderOptions = {
  tryInvert: false,
  tryRotate: false,
  maxNumberOfSymbols: 1,
  formats: ["QRCode"],
};

async function makeImageData(w: number, h: number): Promise<ImageData> {
  const raw = await loadImage(
    await readFile(
      resolve(import.meta.dirname, "./samples/qrcode/wikipedia.png"),
    ),
  );
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w, h) * 0.4;
  ctx.drawImage(raw, (w - s) / 2, (h - s) / 2, s, s);
  const id = ctx.getImageData(0, 0, w, h);
  Object.defineProperty(id, "colorSpace", { value: "srgb", writable: false });
  return id as ImageData;
}

beforeAll(async () => {
  await prepareZXingModule({
    overrides: {
      wasmBinary: (
        await readFile(
          resolve(import.meta.dirname, "../src/reader/zxing_reader.wasm"),
        )
      ).buffer as ArrayBuffer,
    },
    fireImmediately: true,
  });

  [img720, img1080, img4k] = await Promise.all([
    makeImageData(1280, 720),
    makeImageData(1920, 1080),
    makeImageData(3840, 2160),
  ]);
}, 60_000);

/* ------------------------------------------------------------------ */
/*  readBarcodes — default options                                     */
/* ------------------------------------------------------------------ */

describe("readBarcodes (default options)", () => {
  bench(
    "720p",
    async () => {
      await readBarcodes(img720);
    },
    { warmupIterations: 20, iterations: 100 },
  );
  bench(
    "1080p",
    async () => {
      await readBarcodes(img1080);
    },
    { warmupIterations: 20, iterations: 100 },
  );
  bench(
    "4K",
    async () => {
      await readBarcodes(img4k);
    },
    { warmupIterations: 20, iterations: 100 },
  );
});

/* ------------------------------------------------------------------ */
/*  readBarcodes — optimized options (video-scan scenario)              */
/* ------------------------------------------------------------------ */

describe("readBarcodes (optimized options)", () => {
  bench(
    "720p optimized",
    async () => {
      await readBarcodes(img720, optimizedOpts);
    },
    { warmupIterations: 20, iterations: 100 },
  );
  bench(
    "1080p optimized",
    async () => {
      await readBarcodes(img1080, optimizedOpts);
    },
    { warmupIterations: 20, iterations: 100 },
  );
  bench(
    "4K optimized",
    async () => {
      await readBarcodes(img4k, optimizedOpts);
    },
    { warmupIterations: 20, iterations: 100 },
  );
});
