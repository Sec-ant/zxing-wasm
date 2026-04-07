import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { version } from "../package.json";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      "zxing-wasm/reader": fileURLToPath(
        new URL("../src/reader/index.ts", import.meta.url),
      ),
      "zxing-wasm/react": fileURLToPath(
        new URL("../src/react/index.ts", import.meta.url),
      ),
    },
  },
  define: {
    NPM_PACKAGE_VERSION: JSON.stringify(version),
    "import.meta.vitest": "undefined",
    READER_HASH: JSON.stringify(
      createHash("sha256")
        .update(
          await readFile(
            fileURLToPath(
              new URL("../src/reader/zxing_reader.wasm", import.meta.url),
            ),
          ),
        )
        .digest("hex"),
    ),
    WRITER_HASH: JSON.stringify(
      createHash("sha256")
        .update(
          await readFile(
            fileURLToPath(
              new URL("../src/writer/zxing_writer.wasm", import.meta.url),
            ),
          ),
        )
        .digest("hex"),
    ),
    FULL_HASH: JSON.stringify(
      createHash("sha256")
        .update(
          await readFile(
            fileURLToPath(
              new URL("../src/full/zxing_full.wasm", import.meta.url),
            ),
          ),
        )
        .digest("hex"),
    ),
    SUBMODULE_COMMIT: JSON.stringify(
      execSync("git submodule status | cut -c-41", {
        encoding: "utf-8",
      })
        .trim()
        .replace(/[^0-9a-f]/g, ""),
    ),
  },
  build: {
    outDir: fileURLToPath(new URL("../dist/demo", import.meta.url)),
    emptyOutDir: true,
  },
});
