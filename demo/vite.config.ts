import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../vite.base.js";

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: fileURLToPath(new URL(".", import.meta.url)),
    resolve: {
      alias: {
        "zxing-wasm/reader": fileURLToPath(
          new URL("../src/reader/index.ts", import.meta.url),
        ),
        "zxing-wasm/scanner": fileURLToPath(
          new URL("../src/scanner/index.ts", import.meta.url),
        ),
      },
    },
    build: {
      outDir: fileURLToPath(new URL("../dist/demo", import.meta.url)),
      emptyOutDir: true,
    },
  }),
);
