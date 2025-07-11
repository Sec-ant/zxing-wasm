import { writeFile } from "node:fs/promises";
import { rimraf } from "rimraf";
import { build, type LibraryOptions } from "vite";
import viteConfig from "../vite.config.js";

async function buildMiniprogram() {
  await rimraf("dist/miniprogram");
  await build({
    ...viteConfig,
    mode: "miniprogram",
    build: {
      ...viteConfig.build,
      target: ["es2018"],
      lib: {
        ...(viteConfig.build?.lib as LibraryOptions),
        entry: {
          index: "./src/full/index.ts",
        },
        formats: ["cjs"],
      },
      outDir: "dist/miniprogram",
      rollupOptions: {
        ...viteConfig.build?.rollupOptions,
        output: {
          ...viteConfig.build?.rollupOptions?.output,
          manualChunks: {},
        },
      },
    },
    configFile: false,
    define: {
      ...viteConfig.define,
      WebAssembly: "WXWebAssembly",
    },
  });
  await writeFile(
    "dist/miniprogram/package.json",
    `${JSON.stringify({ type: "commonjs" }, undefined, 2)}\n`,
  );
}

buildMiniprogram();
