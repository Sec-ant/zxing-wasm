import type { ReaderOptions, ReadResult } from "../bindings/index.js";
import { prepareZXingModule, readBarcodes } from "../reader/index.js";
import { capture } from "./capture.js";
import { createWorkerDecode } from "./workerDecode.js";

export interface ScanOptions {
  readerOptions?: ReaderOptions | (() => ReaderOptions);
  wasmBinary?: ArrayBuffer;
  worker?: boolean | string;
  signal?: AbortSignal;
}

type DecodeFn = (
  imageData: ImageData,
  readerOptions: ReaderOptions,
) => Promise<ReadResult[]>;

function resolveReaderOptions(
  input: ScanOptions["readerOptions"],
): () => ReaderOptions {
  if (typeof input === "function") {
    return () => input() ?? {};
  }
  return () => input ?? {};
}

export async function* scan(
  element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  options: ScanOptions = {},
): AsyncGenerator<ReadResult[], void, undefined> {
  const getReaderOptions = resolveReaderOptions(options.readerOptions);
  const workerMode = options.worker;
  let decode: DecodeFn;
  let destroy: (() => void) | undefined;

  if (workerMode === true || typeof workerMode === "string") {
    const workerDecode = createWorkerDecode(
      typeof workerMode === "string" ? workerMode : undefined,
      options.wasmBinary,
    );
    decode = workerDecode.decode;
    destroy = workerDecode.destroy;
  } else {
    const modulePromise = options.wasmBinary
      ? prepareZXingModule({
          overrides: { wasmBinary: options.wasmBinary },
          fireImmediately: true,
        })
      : prepareZXingModule({ fireImmediately: true });

    decode = async (imageData, readerOptions) => {
      await modulePromise;
      return readBarcodes(imageData, readerOptions);
    };
  }

  try {
    for await (const imageData of capture(element, { signal: options.signal })) {
      yield await decode(imageData, getReaderOptions());
    }
  } finally {
    destroy?.();
  }
}
