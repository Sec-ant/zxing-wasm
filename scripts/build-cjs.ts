import { writeFile } from "node:fs/promises";
import { rimraf } from "rimraf";
import { build, type LibraryOptions } from "vite";
import viteConfig from "../vite.config.js";

async function buildCjs() {
  const libConfig = viteConfig.build?.lib as LibraryOptions;

  const entry = Object.fromEntries(
    Object.entries(libConfig.entry).filter(
      ([key]) => key !== "internal/scanner-worker",
    ),
  );

  await rimraf("dist/cjs");
  await build({
    ...viteConfig,
    build: {
      ...viteConfig.build,
      lib: {
        ...libConfig,
        entry,
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
