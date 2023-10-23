/// <reference types="vitest" />
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { version } from "./package-lock.json";

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
      fileName: (format, entryName) =>
        format === "es" ? `${entryName}.js` : `${entryName}.${format}.js`,
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "./src/full/*.d.ts",
          dest: "./full",
        },
        {
          src: "./src/reader/*.d.ts",
          dest: "./reader",
        },
        {
          src: "./src/writer/*.d.ts",
          dest: "./writer",
        },
      ],
    }),
  ],
  define: {
    NPM_PACKAGE_VERSION: JSON.stringify(version),
  },
  test: {
    passWithNoTests: true,
    browser: {
      enabled: true,
      headless: true,
      name: "chromium",
      provider: "playwright",
    },
    coverage: {
      provider: "istanbul",
    },
  },
});
