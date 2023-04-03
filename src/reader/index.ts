import ZXing from "./zxing_reader.js";
import {
  scanBarcodeFromImageFile as _scanBarcodeFromImageFile,
  scanBarcodeFromImageData as _scanBarcodeFromImageData,
  generateBarcodeToImageFile as _generateBarcodeToImageFile,
  getZXingInstance as _getZXingInstance,
  defaultZXingScanOptions,
  ZXingScanOptions,
  ZXingScanResult,
} from "../ZXing.js";

export function getZXingInstance() {
  return _getZXingInstance(ZXing);
}

export async function scanBarcodeFromImageFile(
  imageFile: Blob | File,
  {
    tryHarder = defaultZXingScanOptions.tryHarder,
    formats = defaultZXingScanOptions.formats,
    maxNumberOfSymbols = defaultZXingScanOptions.maxNumberOfSymbols,
  }: ZXingScanOptions = defaultZXingScanOptions
): Promise<ZXingScanResult[]> {
  return _scanBarcodeFromImageFile(
    imageFile,
    {
      tryHarder,
      formats,
      maxNumberOfSymbols,
    },
    ZXing
  );
}

export async function scanBarcodeFromImageData(
  imageData: ImageData,
  {
    tryHarder = defaultZXingScanOptions.tryHarder,
    formats = defaultZXingScanOptions.formats,
    maxNumberOfSymbols = defaultZXingScanOptions.maxNumberOfSymbols,
  }: ZXingScanOptions = defaultZXingScanOptions
): Promise<ZXingScanResult[]> {
  return _scanBarcodeFromImageData(
    imageData,
    {
      tryHarder,
      formats,
      maxNumberOfSymbols,
    },
    ZXing
  );
}
