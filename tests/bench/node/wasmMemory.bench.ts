/**
 * Bench C — WASM memory operations.
 *
 * Measures _malloc, HEAPU8.set, and _free in isolation and as a full cycle.
 * Buffer sizes correspond to grayscale (1 B/px) and RGBA (4 B/px) at each
 * resolution, matching the real allocation patterns in readBarcodesWithFactory.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterAll, beforeAll, bench, describe } from "vitest";
import { prepareZXingModule } from "../../../src/reader/index.js";
import type { ZXingReaderModule } from "../../../src/share.js";

const wasmPath = resolve(
  import.meta.dirname,
  "../../../src/reader/zxing_reader.wasm",
);

let zxingModule: ZXingReaderModule;

// 4K sizes omitted: the lum/rgba size pairs at 720p/1080p already span
// ~9x range (0.9 MB → 8.3 MB), enough to spot allocator / memcpy regressions.
const bufferSizes = [
  { name: "720p/lum", size: 1280 * 720 },
  { name: "1080p/lum", size: 1920 * 1080 },
  { name: "720p/rgba", size: 1280 * 720 * 4 },
  { name: "1080p/rgba", size: 1920 * 1080 * 4 },
] as const;

/** Source data for HEAPU8.set benchmarks (pre-allocated, filled with pattern) */
const srcBuffers: Record<string, Uint8Array> = {};

beforeAll(async () => {
  zxingModule = await prepareZXingModule({
    overrides: {
      wasmBinary: (await readFile(wasmPath)).buffer as ArrayBuffer,
    },
    fireImmediately: true,
  });

  for (const { name, size } of bufferSizes) {
    const buf = new Uint8Array(size);
    // Fill first 1 KB with a pattern; rest stays zeroed (realistic for lum data)
    for (let i = 0; i < Math.min(size, 1024); i++) {
      buf[i] = i & 0xff;
    }
    srcBuffers[name] = buf;
  }
}, 30_000);

/* ------------------------------------------------------------------ */
/*  _malloc + _free (allocation round-trip)                            */
/* ------------------------------------------------------------------ */

describe("WASM malloc + free", () => {
  for (const { name, size } of bufferSizes) {
    bench(
      `${name} (${size.toLocaleString()} B)`,
      () => {
        const ptr = zxingModule._malloc(size);
        zxingModule._free(ptr);
      },
      { warmupIterations: 20, iterations: 200 },
    );
  }
});

/* ------------------------------------------------------------------ */
/*  HEAPU8.set (memcpy into WASM heap)                                 */
/* ------------------------------------------------------------------ */

describe("WASM HEAPU8.set", () => {
  /** Persistent allocations for set-only benchmarks */
  const ptrs: Record<string, number> = {};

  beforeAll(() => {
    for (const { name, size } of bufferSizes) {
      ptrs[name] = zxingModule._malloc(size);
    }
  });

  afterAll(() => {
    for (const { name } of bufferSizes) {
      if (ptrs[name]) zxingModule._free(ptrs[name]);
    }
  });

  for (const { name, size } of bufferSizes) {
    bench(
      `${name} (${size.toLocaleString()} B)`,
      () => {
        zxingModule.HEAPU8.set(srcBuffers[name]!, ptrs[name]!);
      },
      { warmupIterations: 20, iterations: 200 },
    );
  }
});

/* ------------------------------------------------------------------ */
/*  Full cycle: malloc → set → free                                    */
/* ------------------------------------------------------------------ */

describe("WASM malloc + set + free (full cycle)", () => {
  for (const { name, size } of bufferSizes) {
    bench(
      `${name} (${size.toLocaleString()} B)`,
      () => {
        const ptr = zxingModule._malloc(size);
        zxingModule.HEAPU8.set(srcBuffers[name]!, ptr);
        zxingModule._free(ptr);
      },
      { warmupIterations: 20, iterations: 200 },
    );
  }
});
