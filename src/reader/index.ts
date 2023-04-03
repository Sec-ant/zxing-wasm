import ZXing from "./zxing_reader.js";
import {
  readBarcodeFromImageFile as _readBarcodeFromImageFile,
  readBarcodeFromImageData as _readBarcodeFromImageData,
  getZXingInstance as _getZXingInstance,
  defaultZXingReadOptions,
  ZXingReadOptions,
  ZXingReadResult,
} from "../ZXing.js";

export function getZXingInstance() {
  return _getZXingInstance(ZXing);
}

export async function readBarcodeFromImageFile(
  imageFile: Blob | File,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxNumberOfSymbols = defaultZXingReadOptions.maxNumberOfSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions
): Promise<ZXingReadResult[]> {
  return _readBarcodeFromImageFile(
    imageFile,
    {
      tryHarder,
      formats,
      maxNumberOfSymbols,
    },
    ZXing
  );
}

export async function readBarcodeFromImageData(
  imageData: ImageData,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxNumberOfSymbols = defaultZXingReadOptions.maxNumberOfSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions
): Promise<ZXingReadResult[]> {
  return _readBarcodeFromImageData(
    imageData,
    {
      tryHarder,
      formats,
      maxNumberOfSymbols,
    },
    ZXing
  );
}

export * from "../exposed.js";
