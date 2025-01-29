import { writeFile } from "node:fs/promises";
import { type LibraryOptions, build } from "vite";
import babel from "vite-plugin-babel";
import viteConfig from "../vite.config.js";
import { miniprogramPatch } from "./babel-plugin-miniprogram-patch";

async function buildCjs() {
  await build({
    ...viteConfig,
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
    plugins: [
      ...viteConfig.plugins!,
      babel({
        babelConfig: {
          plugins: [miniprogramPatch()],
        },
        filter: /zxing_(reader|writer|full)\.js$/,
        include: /zxing_(reader|writer|full)\.js$/,
      }),
    ],
    configFile: false,
  });
  await writeFile(
    "dist/miniprogram/package.json",
    `${JSON.stringify({ type: "commonjs" }, undefined, 2)}\n`,
  );
}

buildCjs();
