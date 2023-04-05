import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        "reader/index": "src/reader/index.ts",
        "writer/index": "src/writer/index.ts",
        "full/index": "src/full/index.ts",
      },
      formats: ["es"],
    },
  },
  plugins: [dts()],
  define: {
    NPM_PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
  },
});
