/**
 * Bench — writeBarcode encoder cost.
 *
 * Covers the writer half of the library (previously zero bench coverage).
 * One representative case per major encoder family:
 *
 *   QRCode      — most common 2D matrix code
 *   DataMatrix  — alternate 2D matrix engine
 *   Aztec       — third 2D engine
 *   EAN-13      — 1D scanline writer (very different code path)
 *
 * Uses scale=1 to isolate the encoding/bit-matrix work from pixel
 * rasterization. Higher scales just measure pixel-fill speed and would
 * dilute the encoder signal.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, bench, describe } from "vitest";
import { prepareZXingModule, writeBarcode } from "../../../src/writer/index.js";

const wasmPath = resolve(
  import.meta.dirname,
  "../../../src/writer/zxing_writer.wasm",
);

const cases = [
  {
    name: "QRCode (URL)",
    input: "https://github.com/Sec-ant/zxing-wasm",
    format: "QRCode" as const,
  },
  {
    name: "DataMatrix (URL)",
    input: "https://github.com/Sec-ant/zxing-wasm",
    format: "DataMatrix" as const,
  },
  {
    name: "Aztec (text)",
    input: "Hello, ZXing-WASM benchmark!",
    format: "Aztec" as const,
  },
  {
    name: "EAN-13 (12 digits)",
    input: "123456789012",
    format: "EAN-13" as const,
  },
];

beforeAll(async () => {
  await prepareZXingModule({
    overrides: {
      wasmBinary: (await readFile(wasmPath)).buffer as ArrayBuffer,
    },
    fireImmediately: true,
  });
}, 60_000);

describe("writeBarcode — encoder", () => {
  for (const { name, input, format } of cases) {
    bench(
      name,
      async () => {
        await writeBarcode(input, { format, scale: 1 });
      },
      { warmupIterations: 10, iterations: 50 },
    );
  }
});
