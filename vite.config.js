import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: [
        "src/reader/index.ts",
        "src/writer/index.ts",
        "src/full/index.ts",
      ],
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
  },
  plugins: [dts()],
});
