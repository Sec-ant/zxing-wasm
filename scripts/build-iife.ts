import { rimraf } from "rimraf";
import { build, type LibraryOptions } from "vite";
import viteConfig from "../vite.config.js";

async function buildIife() {
  const libConfig = viteConfig.build?.lib as LibraryOptions;

  // Filter out react entries — react is ESM-only
  const entries = Object.entries(libConfig.entry).filter(
    ([key]) => !key.startsWith("react/"),
  );

  await rimraf("dist/iife");
  await Promise.all(
    entries.map(([entryAlias, entryPath]) => {
      return build({
        ...viteConfig,
        build: {
          ...viteConfig.build,
          lib: {
            ...libConfig,
            entry: {
              [entryAlias]: entryPath,
            },
            formats: ["iife"],
            name: "ZXingWASM",
          },
          rolldownOptions: undefined,
          outDir: "dist/iife",
          emptyOutDir: false,
        },
        configFile: false,
      });
    }),
  );
}

buildIife();
