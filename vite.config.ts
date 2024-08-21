import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
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
        "scanner/index": "src/scanner/index.ts",
        "stream/index": "src/stream/index.ts",
        "react/index": "src/react/index.ts",
        "react/hooks/index": "src/react/hooks/index.ts",
        "react/components/index": "src/react/components/index.ts",
      },
      formats: ["es"],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    outDir: "dist/es",
    rollupOptions: {
      external: ["react"],
      output: {
        chunkFileNames: "[name]-[hash].js",
        manualChunks: (id) => {
          if (/webrtc-adapter\/dist\/utils/.test(id)) {
            return "shim-utils";
          }
          if (/webrtc-adapter\/dist\/chrome/.test(id)) {
            return "shim-chrome";
          }
          if (/webrtc-adapter\/dist\/firefox/.test(id)) {
            return "shim-firefox";
          }
          if (/webrtc-adapter\/dist\/safari/.test(id)) {
            return "shim-safari";
          }
          if (/zustand/.test(id)) {
            return "zustand";
          }
          if (
            /core\.ts|exposedReaderBindings\.ts|exposedWriterBindings\.ts/.test(
              id,
            )
          ) {
            return "core";
          }
          if (/src\/reader\/index\.ts/.test(id)) {
            return "reader";
          }
          if (/src\/writer\/index\.ts/.test(id)) {
            return "writer";
          }
          if (/src\/full\/index\.ts/.test(id)) {
            return "full";
          }
          if (/src\/scanner\/index\.ts/.test(id)) {
            return "scanner";
          }
          if (/src\/stream\/index\.ts/.test(id)) {
            return "stream";
          }
          if (/src\/react\/hooks\/index\.ts/.test(id)) {
            return "react-hooks";
          }
          if (/src\/react\/components\/index\.ts/.test(id)) {
            return "react-components";
          }
        },
      },
    },
  },
  plugins: [
    vanillaExtractPlugin(),
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
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
