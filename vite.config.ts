/// <reference types="vitest" />
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
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
        chunkFileNames: "[name]-[hash].js",
        manualChunks: (id) => {
          if (
            /core\.ts|exposedReaderBindings\.ts|exposedWriterBindings\.ts/.test(
              id,
            )
          ) {
            return "core";
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
  },
  test: {
    testTimeout: 10000,
    includeSource: ["src/bindings/barcodeFormat.ts"],
    exclude: [".*/**/*"],
    coverage: {
      exclude: [".*/**/*"],
    },
  },
});
