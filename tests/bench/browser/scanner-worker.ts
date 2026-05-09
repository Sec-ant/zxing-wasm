/**
 * Worker that receives image data and runs readBarcodes.
 * Communicates back timing information for the WASM decode step.
 *
 * Supports three message types:
 *   - "imageData" or default: input is ImageData | Blob | Uint8Array → readBarcodes()
 *   - "rawBuffer": input is { buffer, width, height } → reconstruct ImageData → readBarcodes()
 *   - "grayscale": input is { buffer, width, height } → direct readBarcodesFromPixmap()
 */

import {
  defaultReaderOptions,
  readerOptionsToZXingReaderOptions,
} from "../../../src/bindings/index.js";
import {
  prepareZXingModule,
  type ReaderOptions,
  readBarcodes,
  type ZXingReaderModule,
} from "../../../src/reader/index.js";

const optimizedOpts: ReaderOptions = {
  tryInvert: false,
  tryRotate: false,
  maxNumberOfSymbols: 1,
  formats: ["QRCode"],
};

let ready = false;
let zxingModule: ZXingReaderModule;

async function init() {
  zxingModule = await prepareZXingModule({ fireImmediately: true });
  ready = true;
  self.postMessage({ type: "ready" });
}

init();

self.onmessage = async (e: MessageEvent) => {
  if (!ready) {
    self.postMessage({ type: "error", error: "Not ready" });
    return;
  }

  const { id, mode, input } = e.data;
  let decodeTime: number;
  let found: number;
  let text: string | null;

  try {
    if (mode === "rawBuffer") {
      // Reconstruct ImageData from transferred ArrayBuffer + dimensions
      const { buffer, width, height } = input as {
        buffer: ArrayBuffer;
        width: number;
        height: number;
      };
      const imageData = new ImageData(
        new Uint8ClampedArray(buffer),
        width,
        height,
      );
      const t0 = performance.now();
      const results = await readBarcodes(imageData, optimizedOpts);
      decodeTime = performance.now() - t0;
      found = results.length;
      text = results[0]?.text ?? null;
    } else if (mode === "grayscale") {
      // Direct WASM call with pre-computed grayscale buffer
      const { buffer, width, height } = input as {
        buffer: ArrayBuffer;
        width: number;
        height: number;
      };
      const lumBuffer = new Uint8Array(buffer);
      const lumSize = lumBuffer.byteLength;
      const t0 = performance.now();
      const bufferPtr = zxingModule._malloc(lumSize);
      if (!bufferPtr) {
        throw new Error(`Failed to allocate ${lumSize} bytes in WASM memory`);
      }
      try {
        zxingModule.HEAPU8.set(lumBuffer, bufferPtr);
        const requiredOpts = { ...defaultReaderOptions, ...optimizedOpts };
        const zxingOpts = readerOptionsToZXingReaderOptions(requiredOpts);
        const resultVector = zxingModule.readBarcodesFromPixmap(
          bufferPtr,
          width,
          height,
          zxingOpts,
        );
        found = resultVector.size();
        text = found > 0 ? resultVector.get(0)!.text : null;
        // Note: we don't convert to full ReadResult to keep overhead minimal
      } finally {
        zxingModule._free(bufferPtr);
      }
      decodeTime = performance.now() - t0;
    } else {
      // Default: ImageData | Blob | Uint8Array via readBarcodes
      const t0 = performance.now();
      const results = await readBarcodes(
        input as ImageData | Blob | Uint8Array,
        optimizedOpts,
      );
      decodeTime = performance.now() - t0;
      found = results.length;
      text = results[0]?.text ?? null;
    }

    self.postMessage({ type: "result", id, decodeTime, found, text });
  } catch (err) {
    self.postMessage({
      type: "error",
      id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
