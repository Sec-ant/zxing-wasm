/// <reference types="vitest" />
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  build: {
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
    NPM_PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
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
