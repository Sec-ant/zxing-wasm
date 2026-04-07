import { prepareZXingModule, readBarcodes } from "../reader/index.js";

self.addEventListener("message", async (e: MessageEvent) => {
  const { type } = e.data;

  if (type === "init") {
    // Eagerly trigger WASM loading on Worker init.
    // Fire-and-forget — readBarcodes internally awaits the same cached promise.
    if (e.data.wasmBinary) {
      prepareZXingModule({
        overrides: { wasmBinary: e.data.wasmBinary },
        fireImmediately: true,
      });
    } else {
      prepareZXingModule({ fireImmediately: true });
    }
    return;
  }

  if (type === "scan") {
    const { id, buffer, width, height, readerOptions } = e.data;
    try {
      const imageData = new ImageData(
        new Uint8ClampedArray(buffer),
        width,
        height,
      );
      const results = await readBarcodes(imageData, readerOptions);
      self.postMessage({ id, type: "result", results });
    } catch (err) {
      self.postMessage({
        id,
        type: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
});
