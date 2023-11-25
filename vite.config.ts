import { defineConfig } from "vite";
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
      fileName: (_, entryName) => `${entryName}.js`,
    },
    outDir: "dist/es",
    rollupOptions: {
      output: {
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
  define: {
    NPM_PACKAGE_VERSION: JSON.stringify(version),
  },
});
