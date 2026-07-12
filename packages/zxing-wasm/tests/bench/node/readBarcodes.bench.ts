/**
 * Bench — End-to-end readBarcodes (real-world signal).
 *
 * Tracks the public `readBarcodes(ImageData)` API at the resolutions most
 * web users actually hit (720p / 1080p webcam frames), with both default
 * options and a video-scan optimized preset. 4K is intentionally omitted:
 * camera input is rarely 4K and each 4K case dominates total bench time
 * with little additional signal.
 *
 * Per-format decoder costs and failure-path costs live in `decode.bench.ts`.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { beforeAll, bench, describe } from "vitest";
import type { ReaderOptions } from "../../../src/bindings/index.js";
import { prepareZXingModule, readBarcodes } from "../../../src/reader/index.js";

let img720: ImageData;
let img1080: ImageData;

const optimizedOpts: ReaderOptions = {
  tryInvert: false,
  tryRotate: false,
  maxNumberOfSymbols: 1,
  formats: ["QRCode"],
};

async function makeImageData(w: number, h: number): Promise<ImageData> {
  const raw = await loadImage(
    await readFile(
      resolve(import.meta.dirname, "../../samples/qrcode/wikipedia.png"),
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
          resolve(import.meta.dirname, "../../../src/reader/zxing_reader.wasm"),
        )
      ).buffer as ArrayBuffer,
    },
    fireImmediately: true,
  });

  [img720, img1080] = await Promise.all([
    makeImageData(1280, 720),
    makeImageData(1920, 1080),
  ]);
}, 60_000);

describe("readBarcodes — default options", () => {
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
});

describe("readBarcodes — optimized options", () => {
  bench(
    "720p",
    async () => {
      await readBarcodes(img720, optimizedOpts);
    },
    { warmupIterations: 20, iterations: 100 },
  );
  bench(
    "1080p",
    async () => {
      await readBarcodes(img1080, optimizedOpts);
    },
    { warmupIterations: 20, iterations: 100 },
  );
});
