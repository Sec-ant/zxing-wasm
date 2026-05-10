import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { version } from "./package.json";
import { emscriptenPatch } from "./scripts/vite-plugin-emscripten-patch.js";

export default defineConfig({
  build: {
    target: ["es2020", "edge88", "firefox68", "chrome75", "safari13"],
    lib: {
      entry: {
        "reader/index": "src/reader/index.ts",
        "writer/index": "src/writer/index.ts",
        "full/index": "src/full/index.ts",
      },
      formats: ["es"],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    outDir: "dist/es",
    rolldownOptions: {
      output: {
        chunkFileNames: "[name].js",
        manualChunks: (id) => {
          if (
            /share\.ts|exposedReaderBindings\.ts|exposedWriterBindings\.ts/.test(
              id,
            )
          ) {
            return "share";
          }
        },
      },
    },
  },
  plugins: [emscriptenPatch()],
  define: {
    NPM_PACKAGE_VERSION: JSON.stringify(version),
    "import.meta.vitest": "undefined",
    READER_HASH: JSON.stringify(
      createHash("sha256")
        .update(
          await readFile(
            fileURLToPath(
              new URL("./src/reader/zxing_reader.wasm", import.meta.url),
            ),
          ),
        )
        .digest("hex"),
    ),
    WRITER_HASH: JSON.stringify(
      createHash("sha256")
        .update(
          await readFile(
            fileURLToPath(
              new URL("./src/writer/zxing_writer.wasm", import.meta.url),
            ),
          ),
        )
        .digest("hex"),
    ),
    FULL_HASH: JSON.stringify(
      createHash("sha256")
        .update(
          await readFile(
            fileURLToPath(
              new URL("./src/full/zxing_full.wasm", import.meta.url),
            ),
          ),
        )
        .digest("hex"),
    ),
    SUBMODULE_COMMIT: JSON.stringify(
      execSync("git submodule status | cut -c-41", {
        encoding: "utf-8",
      })
        .trim()
        .replace(/[^0-9a-f]/g, ""),
    ),
  },
  test: {
    testTimeout: 10000,
    includeSource: ["src/bindings/barcodeFormat.ts"],
    // Scope benchmarks to the project's tests/ tree. The default glob
    // (**/*.{bench,benchmark}.?(c|m)[jt]s?(x)) otherwise picks up files
    // inside .emsdk-cache/ on CI (e.g. emscripten's embind.benchmark.js),
    // which fail to load outside their own runtime.
    benchmark: {
      include: ["tests/**/*.bench.?(c|m)[jt]s?(x)"],
      // tinybench defaults (time: 500ms, warmupTime: 100ms) leave wall-clock
      // means too noisy on GitHub-hosted runners — micro-ops show ±20% swings
      // run-to-run. Longer sampling windows tighten the mean's confidence
      // interval, which the Bencher t-test relies on. Trade-off: roughly 4×
      // longer bench job on CI (still well under the size workflow's runtime).
      time: 2000,
      warmupTime: 500,
      iterations: 32,
      warmupIterations: 16,
    },
  },
});
