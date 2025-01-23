import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import babel from "vite-plugin-babel";
import { defineConfig } from "vitest/config";
import { version } from "./package.json";
import { emscriptenPatch } from "./scripts/babel-plugin-emscripten-patch.js";

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
    rollupOptions: {
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
  plugins: [
    babel({
      babelConfig: {
        plugins: [emscriptenPatch()],
      },
      filter: /zxing_(reader|writer|full)\.js$/,
      include: /zxing_(reader|writer|full)\.js$/,
    }),
  ],
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
      }).trim(),
    ),
  },
  test: {
    testTimeout: 10000,
    includeSource: ["src/bindings/barcodeFormat.ts"],
  },
});
