/**
 * Bench — Per-format decoder cost & failure-path cost.
 *
 * Goal: when a regression appears, attribute it to a specific symbology
 * decoder (or the failure-path detector) instead of seeing only an
 * aggregate "QR got slower" signal.
 *
 * Samples come from the upstream zxing-cpp blackbox suite (already
 * vendored as a submodule). Mix of real photos (qrcode / ean13) and
 * clean synthetic renders (datamatrix / aztec / pdf417 / code128) so
 * both binarizer and pure-decoder paths get exercised across the suite.
 *
 * Reader options are optimized (single-format constraint, no rotate /
 * no invert) so each case isolates that format's fast-path decoder.
 * The "failure" case uses default options on purpose — that's what real
 * users hit when no barcode is in frame, and the heavy try-everything
 * path is exactly where regressions hurt most.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createCanvas, ImageData, loadImage } from "@napi-rs/canvas";
import { beforeAll, bench, describe } from "vitest";
import type {
  ReaderOptions,
  ReadInputBarcodeFormat,
} from "../../../src/bindings/index.js";
import { prepareZXingModule, readBarcodes } from "../../../src/reader/index.js";

const repoRoot = resolve(import.meta.dirname, "../../..");
const wasmPath = resolve(repoRoot, "src/reader/zxing_reader.wasm");

interface FormatSample {
  format: ReadInputBarcodeFormat;
  /** Path relative to repo root. */
  path: string;
}

/**
 * One representative image per format. Picks lean toward small/clean
 * inputs so per-case time stays in the millisecond range.
 */
const samples: FormatSample[] = [
  { format: "QRCode", path: "zxing-cpp/test/samples/qrcode-1/1.png" },
  { format: "DataMatrix", path: "zxing-cpp/test/samples/datamatrix-2/01.png" },
  { format: "Aztec", path: "zxing-cpp/test/samples/aztec-1/abc-19x19C.png" },
  { format: "PDF417", path: "zxing-cpp/test/samples/pdf417-1/01.png" },
  { format: "Code128", path: "zxing-cpp/test/samples/code128-1/1.png" },
  { format: "EAN-13", path: "zxing-cpp/test/samples/ean13-1/1.png" },
];

const noBarcodeKey = "__none__";

/** Build a blank 1920x1080 white ImageData in-memory (failure-path input). */
function blankImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4).fill(0xff);
  const id = new ImageData(data, width, height);
  Object.defineProperty(id, "colorSpace", { value: "srgb", writable: false });
  return id;
}

/** Pre-decoded ImageData per format, plus the no-barcode frame. */
const inputs = new Map<string, ImageData>();

async function loadAsImageData(path: string): Promise<ImageData> {
  const buf = await readFile(path);
  const img = await loadImage(buf);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, img.width, img.height);
  Object.defineProperty(id, "colorSpace", { value: "srgb", writable: false });
  return id as ImageData;
}

beforeAll(async () => {
  await prepareZXingModule({
    overrides: {
      wasmBinary: (await readFile(wasmPath)).buffer as ArrayBuffer,
    },
    fireImmediately: true,
  });

  inputs.set(noBarcodeKey, blankImageData(1920, 1080));
  await Promise.all(
    samples.map(async ({ format, path }) => {
      inputs.set(format, await loadAsImageData(resolve(repoRoot, path)));
    }),
  );
}, 60_000);

describe("decode — fast path (single format, no rotate / no invert)", () => {
  for (const { format } of samples) {
    const opts: ReaderOptions = {
      formats: [format],
      tryInvert: false,
      tryRotate: false,
      maxNumberOfSymbols: 1,
    };
    bench(
      format,
      async () => {
        await readBarcodes(inputs.get(format)!, opts);
      },
      { warmupIterations: 10, iterations: 50 },
    );
  }
});

describe("decode — failure path (default options, no barcode in frame)", () => {
  // Default options enable tryHarder / tryInvert / tryRotate / all formats —
  // the heavy try-everything path that dominates "scanner is slow when
  // there's nothing to scan" complaints.
  bench(
    "no-barcode 1080p",
    async () => {
      await readBarcodes(inputs.get(noBarcodeKey)!);
    },
    { warmupIterations: 5, iterations: 20 },
  );
});
