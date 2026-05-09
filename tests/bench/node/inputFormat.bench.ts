/**
 * Bench A — Input format comparison.
 *
 * Compares readBarcodes performance across input types:
 *   ImageData       → rgbaToGrayscale + readBarcodesFromPixmap
 *   PNG/JPEG as Uint8Array → readBarcodesFromImage (stb_image decoding)
 *   PNG as Blob     → arrayBuffer() + readBarcodesFromImage
 *
 * 2 resolutions × 4 input types = 8 benchmark cases.
 *
 * Format coverage is limited to the formats users actually capture in the
 * wild (PNG + JPEG). BMP/GIF were dropped because GIF encoding under
 * jimp dominates startup time (~5s/1080p locally, multi-x worse under
 * CodSpeed's valgrind simulation) and BMP/GIF are vanishingly rare for
 * QR-scanning workloads.
 *
 * Fixtures are generated in-memory at startup from
 * `tests/samples/qrcode/wikipedia.png` via jimp — no on-disk fixtures
 * required, so this bench works in CI without any prep step.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Jimp } from "jimp";
import { beforeAll, bench, describe } from "vitest";
import type { ReaderOptions } from "../../../src/bindings/index.js";
import { prepareZXingModule, readBarcodes } from "../../../src/reader/index.js";

const sourceImage = resolve(
  import.meta.dirname,
  "../../samples/qrcode/wikipedia.png",
);
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
const pngBlobs: Record<string, Blob> = {};

beforeAll(async () => {
  await prepareZXingModule({
    overrides: {
      wasmBinary: (await readFile(wasmPath)).buffer as ArrayBuffer,
    },
    fireImmediately: true,
  });

  // Load source QR once, then resize + re-encode per resolution per format.
  // QR is centred on a white background (40% of the smaller dimension) so
  // it stays decodable at every target resolution.
  const source = await Jimp.read(sourceImage);

  for (const res of resolutions) {
    const [w, h] = dims[res];
    const qrSize = Math.round(Math.min(w, h) * 0.4);
    const qr = source.clone().resize({ w: qrSize, h: qrSize });
    const composite = new Jimp({ width: w, height: h, color: 0xffffffff });
    composite.composite(qr, (w - qrSize) >> 1, (h - qrSize) >> 1);

    pngU8[res] = new Uint8Array(await composite.getBuffer("image/png"));
    jpegU8[res] = new Uint8Array(
      await composite.getBuffer("image/jpeg", { quality: 85 }),
    );
    pngBlobs[res] = new Blob([pngU8[res] as BlobPart], { type: "image/png" });

    // ImageData via @napi-rs/canvas (matches browser ImageData semantics)
    const img = await loadImage(pngU8[res]);
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
});

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
      "PNG / Blob",
      async () => {
        await readBarcodes(pngBlobs[res]!, optimizedOpts);
      },
      { warmupIterations: 10, iterations: 50 },
    );
  });
}
