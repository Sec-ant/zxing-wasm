import { rimraf } from "rimraf";
import { type LibraryOptions, build } from "vite";
import viteConfig from "../vite.config.js";
import { emscriptenBun } from "./vite-plugin-emscripten-bun.js";

async function buildIife() {
  await rimraf("dist/iife");
  await Promise.all(
    Object.entries((viteConfig.build?.lib as LibraryOptions).entry)
      // TODO: pay attention to the order
      .slice(0, 3)
      .map(([entryAlias, entryPath]) => {
        return build({
          ...viteConfig,
          build: {
            ...viteConfig.build,
            lib: {
              ...(viteConfig.build?.lib as LibraryOptions),
              entry: {
                [entryAlias]: entryPath,
              },
              formats: ["iife"],
              name: "ZXingWASM",
            },
            rollupOptions: {
              external: ["react"],
              output: {
                globals: {
                  react: "React",
                },
              },
            },
            outDir: "dist/iife",
            emptyOutDir: false,
          },
          configFile: false,
          plugins: [emscriptenBun()],
        });
      }),
  );
}

buildIife();
