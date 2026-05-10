/**
 * Bench B — Isolated rgbaToGrayscale cost.
 *
 * Measures the JS-side RGBA→grayscale conversion that runs for every
 * ImageData input (src/share.ts:293-307). This tells us what fraction
 * of the ImageData pipeline is spent on colour conversion vs WASM decode.
 *
 * Also benchmarks the Uint8Array allocation that backs the output buffer.
 *
 * Input bytes don't affect timing — the function is fixed-cost per pixel —
 * so we synthesise the RGBA buffer in-memory rather than reading a fixture.
 */
import { beforeAll, bench, describe } from "vitest";

// 4K omitted to keep total bench runtime in check; 720p/1080p already
// shows the linear scaling clearly.
const resolutions = [
  { name: "720p", width: 1280, height: 720 },
  { name: "1080p", width: 1920, height: 1080 },
] as const;

/**
 * Exact replica of the internal rgbaToGrayscale from src/share.ts:293-307.
 * Uses ZXing-C++ RGBToLum formula: (306*R + 601*G + 117*B + 0x200) >> 10.
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

const rgbaData: Record<string, Uint8ClampedArray> = {};

beforeAll(() => {
  for (const { name, width, height } of resolutions) {
    // Pseudo-random pattern keeps the JIT honest (avoids any constant-
    // folding optimisation around a single repeated byte) without the
    // overhead of crypto.getRandomValues for multi-MiB buffers.
    const buf = new Uint8ClampedArray(width * height * 4);
    let seed = 0x9e3779b1;
    for (let i = 0; i < buf.length; i++) {
      seed = (seed * 1664525 + 1013904223) | 0;
      buf[i] = seed & 0xff;
    }
    rgbaData[name] = buf;
  }
});

/* ------------------------------------------------------------------ */
/*  rgbaToGrayscale (conversion + allocation)                          */
/* ------------------------------------------------------------------ */

describe("rgbaToGrayscale", () => {
  for (const { name, width, height } of resolutions) {
    const pixels = width * height;
    bench(
      `${name} — ${pixels.toLocaleString()} px`,
      () => {
        rgbaToGrayscale(rgbaData[name]!);
      },
      { warmupIterations: 20, iterations: 100 },
    );
  }
});

/* ------------------------------------------------------------------ */
/*  Uint8Array allocation only (baseline cost of output buffer)        */
/* ------------------------------------------------------------------ */

describe("Uint8Array allocation (baseline)", () => {
  for (const { width, height } of resolutions) {
    const size = width * height;
    bench(
      `new Uint8Array(${size.toLocaleString()})`,
      () => {
        new Uint8Array(size);
      },
      { warmupIterations: 20, iterations: 100 },
    );
  }
});
