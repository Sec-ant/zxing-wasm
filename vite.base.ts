import { execFileSync } from "node:child_process";
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

function getSubmoduleCommit() {
  try {
    const output = execFileSync("git", ["submodule", "status"], {
      encoding: "utf-8",
    }).trim();
    const match = output.match(/[0-9a-f]{40}/);
    return match?.[0] ?? "";
  } catch {
    return "";
  }
}

const defines: Record<string, string> = {
  "import.meta.env.NPM_PACKAGE_VERSION": JSON.stringify(
    (await import("./package.json", { with: { type: "json" } })).default
      .version,
  ),
  "import.meta.env.READER_HASH": JSON.stringify(
    wasmHash("src/reader/zxing_reader.wasm"),
  ),
  "import.meta.env.WRITER_HASH": JSON.stringify(
    wasmHash("src/writer/zxing_writer.wasm"),
  ),
  "import.meta.env.FULL_HASH": JSON.stringify(
    wasmHash("src/full/zxing_full.wasm"),
  ),
  "import.meta.env.SUBMODULE_COMMIT": JSON.stringify(getSubmoduleCommit()),
};

export default defineConfig({
  define: {
    ...defines,
    "import.meta.vitest": "undefined",
  },
});
