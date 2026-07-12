import {
  prepareZXingModule,
  type ReaderOptions,
  readBarcodes,
} from "zxing-wasm/reader";
import readerWasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

let preparedReader: Promise<unknown> | undefined;

function prepareReader() {
  preparedReader ??= prepareZXingModule({
    fireImmediately: true,
    overrides: {
      locateFile: (path: string) =>
        path.endsWith(".wasm") ? readerWasmUrl : path,
    },
  });
  return preparedReader;
}

async function fileToImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("The browser could not create an image canvas");
    }
    context.drawImage(bitmap, 0, 0);
    return context.getImageData(0, 0, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

export interface ScanImageFileResult {
  decodeDuration: number;
  results: Awaited<ReturnType<typeof readBarcodes>>;
}

async function decode(
  input: File | ImageData,
  options: ReaderOptions,
): Promise<ScanImageFileResult> {
  const startedAt = performance.now();
  const results = await readBarcodes(input, options);
  return {
    decodeDuration: performance.now() - startedAt,
    results,
  };
}

export async function scanImageFile(file: File, options: ReaderOptions) {
  await prepareReader();
  try {
    return await decode(await fileToImageData(file), options);
  } catch (error) {
    // Fallback keeps browser and non-browser encoders handled through reader decode.
    if (error instanceof DOMException || error instanceof TypeError) {
      return decode(file, options);
    }
    throw error;
  }
}
