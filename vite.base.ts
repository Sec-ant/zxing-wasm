import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = new URL("./", import.meta.url);

function wasmHash(path: string): string {
  return createHash("sha256")
    .update(readFileSync(fileURLToPath(new URL(path, root))))
    .digest("hex");
}

const defines: Record<string, string> = {
  NPM_PACKAGE_VERSION: JSON.stringify(
    (await import("./package.json", { with: { type: "json" } })).default
      .version,
  ),
  READER_HASH: JSON.stringify(wasmHash("src/reader/zxing_reader.wasm")),
  WRITER_HASH: JSON.stringify(wasmHash("src/writer/zxing_writer.wasm")),
  FULL_HASH: JSON.stringify(wasmHash("src/full/zxing_full.wasm")),
  SUBMODULE_COMMIT: JSON.stringify(
    execSync("git submodule status | cut -c-41", { encoding: "utf-8" })
      .trim()
      .replace(/[^0-9a-f]/g, ""),
  ),
};

export default defineConfig({
  define: {
    ...defines,
    "import.meta.vitest": "undefined",
  },
});
