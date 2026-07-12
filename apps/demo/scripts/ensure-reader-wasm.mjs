import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../../..", import.meta.url));
const readerDirectory = fileURLToPath(
  new URL("../../../packages/zxing-wasm/src/reader/", import.meta.url),
);
const readerArtifacts = ["zxing_reader.js", "zxing_reader.wasm"].map(
  (filename) => new URL(filename, `file://${readerDirectory}`).pathname,
);

if (!readerArtifacts.every(existsSync)) {
  execFileSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["--filter", "zxing-wasm", "build:wasm:reader"],
    { cwd: workspaceRoot, stdio: "inherit" },
  );
}
