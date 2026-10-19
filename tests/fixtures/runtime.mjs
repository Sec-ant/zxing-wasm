import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";

const bytes = await readFile(
  new URL("../../src/full/zxing_full.wasm", import.meta.url),
);
const image = await readFile(
  new URL("../samples/qrcode/wikipedia.png", import.meta.url),
);

async function readWrite(api) {
  const results = await api.readBarcodes(image);
  const result = await api.writeBarcode("runtime test", { format: "QRCode" });
  return {
    texts: results.map(({ text }) => text),
    error: result.error,
    imageSize: result.image.size,
    width: result.symbol.width,
  };
}

const server = createServer((request, response) => {
  response.writeHead(200, {
    "Content-Type":
      request.url === "/wrong-mime"
        ? "application/octet-stream"
        : "application/wasm",
  });
  response.end(bytes);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const dataUrl = `data:application/wasm;base64,${bytes.toString("base64")}`;
const streaming = WebAssembly.instantiateStreaming;
const results = [];
try {
  const require = createRequire(import.meta.url);
  for (const [format, api] of [
    ["ESM", await import("../../dist/es/full/index.js")],
    ["CJS", require("../../dist/cjs/full/index.js")],
  ]) {
    const objectUrl = URL.createObjectURL(
      new Blob([bytes], { type: "application/wasm" }),
    );
    const modes = {
      wasmBinary: { wasmBinary: bytes },
      instantiateWasm: {
        instantiateWasm(imports, receive) {
          WebAssembly.instantiate(bytes, imports).then(({ instance }) =>
            receive(instance),
          );
          return {};
        },
      },
      http: { locateFile: () => url },
      "wrong MIME": { locateFile: () => `${url}/wrong-mime`, printErr() {} },
      "object URL": {
        locateFile: () => objectUrl,
        postRun: [() => URL.revokeObjectURL(objectUrl)],
      },
      "data URL": { locateFile: () => dataUrl },
      "without streaming": { locateFile: () => dataUrl, printErr() {} },
    };
    for (const [mode, overrides] of Object.entries(modes)) {
      WebAssembly.instantiateStreaming =
        mode === "without streaming" ? undefined : streaming;
      api.purgeZXingModule();
      await api.prepareZXingModule({ overrides, fireImmediately: true });
      results.push({ format, mode, ...(await readWrite(api)) });
    }
    api.purgeZXingModule();
  }
} finally {
  WebAssembly.instantiateStreaming = streaming;
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

console.log(JSON.stringify(results));
