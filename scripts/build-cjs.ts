import { writeFile } from "node:fs/promises";
import { type LibraryOptions, build } from "vite";
import viteConfig from "../vite.config.js";

async function buildCjs() {
  await build({
    ...viteConfig,
    build: {
      ...viteConfig.build,
      lib: {
        ...(viteConfig.build?.lib as LibraryOptions),
        formats: ["cjs"],
      },
      outDir: "dist/cjs",
    },
    configFile: false,
  });
  await writeFile(
    "dist/cjs/package.json",
    `${JSON.stringify({ type: "commonjs" }, undefined, 2)}\n`,
  );
}

buildCjs();
