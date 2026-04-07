import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import { emscriptenPatch } from "./scripts/vite-plugin-emscripten-patch.js";
import baseConfig from "./vite.base.js";

export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      target: ["es2020", "edge88", "firefox68", "chrome75", "safari13"],
      lib: {
        entry: {
          "reader/index": "src/reader/index.ts",
          "writer/index": "src/writer/index.ts",
          "full/index": "src/full/index.ts",
          "react/index": "src/react/index.ts",
          "react/scanner-worker": "src/react/scanner-worker.ts",
        },
        formats: ["es"],
        fileName: (_, entryName) => `${entryName}.js`,
      },
      outDir: "dist/es",
      rolldownOptions: {
        external: ["react"],
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
    test: {
      testTimeout: 10000,
      includeSource: ["src/bindings/barcodeFormat.ts"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.browser.test.{ts,tsx}",
      ],
    },
  }),
);
