import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { version } from "../../packages/zxing-wasm/package.json";
import { emscriptenPatch } from "../../packages/zxing-wasm/scripts/vite-plugin-emscripten-patch";

const readerSourcePath = fileURLToPath(
  new URL("../../packages/zxing-wasm/src/reader/index.ts", import.meta.url),
);
const readerWasmPath = fileURLToPath(
  new URL(
    "../../packages/zxing-wasm/src/reader/zxing_reader.wasm",
    import.meta.url,
  ),
);
const readerWasmHash = createHash("sha256")
  .update(readFileSync(readerWasmPath))
  .digest("hex");

export default defineConfig(({ command }) => {
  const useSourceReader = command === "serve";

  return {
    base: "/demo/",
    plugins: [
      tailwindcss(),
      Icons({ compiler: "jsx", jsx: "react" }),
      ...(useSourceReader ? [emscriptenPatch()] : []),
    ],
    define: useSourceReader
      ? {
          NPM_PACKAGE_VERSION: JSON.stringify(version),
          READER_HASH: JSON.stringify(readerWasmHash),
          SUBMODULE_COMMIT: JSON.stringify("local-source"),
        }
      : undefined,
    resolve: useSourceReader
      ? {
          alias: [
            {
              find: /^zxing-wasm\/reader\/zxing_reader\.wasm\?url$/,
              replacement: `${readerWasmPath}?url`,
            },
            { find: "zxing-wasm/reader", replacement: readerSourcePath },
          ],
        }
      : undefined,
  };
});
