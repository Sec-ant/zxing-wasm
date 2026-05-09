/**
 * Bench A — Input format comparison.
 *
 * Compares readBarcodes performance across input types:
 *   ImageData  → rgbaToGrayscale + readBarcodesFromPixmap
 *   PNG/JPEG/BMP/GIF as Uint8Array → readBarcodesFromImage (stb_image decoding)
 *   PNG as Blob → arrayBuffer() + readBarcodesFromImage
 *
 * 3 resolutions x 6 input types = 18 benchmark cases.
 * Uses optimized reader options to minimise scanning time and isolate
 * input-path overhead.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { beforeAll, bench, describe } from "vitest";
import type { ReaderOptions } from "../../../src/bindings/index.js";
import { prepareZXingModule, readBarcodes } from "../../../src/reader/index.js";

const fixtureDir = resolve(import.meta.dirname, "../fixtures");
const wasmPath = resolve(
  import.meta.dirname,
  "../../../src/reader/zxing_reader.wasm",
);

// 4K omitted: webcam/phone capture is overwhelmingly 720p/1080p, and
// each 4K case roughly quadruples runtime for marginal additional signal.
const resolutions = ["720p", "1080p"] as const;
type Res = (typeof resolutions)[number];

const dims: Record<Res, [w: number, h: number]> = {
  "720p": [1280, 720],
  "1080p": [1920, 1080],
};

const optimizedOpts: ReaderOptions = {
  tryInvert: false,
  tryRotate: false,
  maxNumberOfSymbols: 1,
  formats: ["QRCode"],
};

/* Pre-loaded inputs keyed by resolution */
const imageDataInputs: Record<string, ImageData> = {};
const pngU8: Record<string, Uint8Array> = {};
const jpegU8: Record<string, Uint8Array> = {};
const bmpU8: Record<string, Uint8Array> = {};
const gifU8: Record<string, Uint8Array> = {};
const pngBlobs: Record<string, Blob> = {};

beforeAll(async () => {
  await prepareZXingModule({
    overrides: {
      wasmBinary: (await readFile(wasmPath)).buffer as ArrayBuffer,
    },
    fireImmediately: true,
  });

  for (const res of resolutions) {
    const [w, h] = dims[res];

    // Encoded buffers
    const pngBuf = await readFile(resolve(fixtureDir, `qrcode-${res}.png`));
    pngU8[res] = new Uint8Array(pngBuf);
    jpegU8[res] = new Uint8Array(
      await readFile(resolve(fixtureDir, `qrcode-${res}.jpg`)),
    );
    bmpU8[res] = new Uint8Array(
      await readFile(resolve(fixtureDir, `qrcode-${res}.bmp`)),
    );
    gifU8[res] = new Uint8Array(
      await readFile(resolve(fixtureDir, `qrcode-${res}.gif`)),
    );

    // Blob
    pngBlobs[res] = new Blob([pngU8[res] as BlobPart], { type: "image/png" });

    // ImageData via @napi-rs/canvas
    const img = await loadImage(pngBuf);
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    const id = ctx.getImageData(0, 0, w, h);
    Object.defineProperty(id, "colorSpace", {
      value: "srgb",
      writable: false,
    });
    imageDataInputs[res] = id as ImageData;
  }
}, 60_000);

/* ------------------------------------------------------------------ */
/*  Benchmarks                                                         */
/* ------------------------------------------------------------------ */

for (const res of resolutions) {
  describe(`Input formats — ${res}`, () => {
    bench(
      "ImageData",
      async () => {
        await readBarcodes(imageDataInputs[res]!, optimizedOpts);
      },
      { warmupIterations: 10, iterations: 50 },
    );

    bench(
      "PNG / Uint8Array",
      async () => {
        await readBarcodes(pngU8[res]!, optimizedOpts);
      },
      { warmupIterations: 10, iterations: 50 },
    );

    bench(
      "JPEG / Uint8Array",
      async () => {
        await readBarcodes(jpegU8[res]!, optimizedOpts);
      },
      { warmupIterations: 10, iterations: 50 },
    );

    bench(
      "BMP / Uint8Array",
      async () => {
        await readBarcodes(bmpU8[res]!, optimizedOpts);
      },
      { warmupIterations: 10, iterations: 50 },
    );

    bench(
      "GIF / Uint8Array",
      async () => {
        await readBarcodes(gifU8[res]!, optimizedOpts);
      },
      { warmupIterations: 10, iterations: 50 },
    );

    bench(
      "PNG / Blob",
      async () => {
        await readBarcodes(pngBlobs[res]!, optimizedOpts);
      },
      { warmupIterations: 10, iterations: 50 },
    );
  });
}
