import ZXing from "./zxing_full.js";
import {
  scanBarcodeFromImageFile as _scanBarcodeFromImageFile,
  scanBarcodeFromImageData as _scanBarcodeFromImageData,
  generateBarcodeToImageFile as _generateBarcodeToImageFile,
  getZXingInstance as _getZXingInstance,
  defaultZXingScanOptions,
  ZXingScanOptions,
  ZXingScanResult,
  defaultZXingGenerateOptions,
  ZXingGenerateOptions,
  ZXingGenerateResult,
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

export async function generateBarcodeToImageFile(
  text: string,
  {
    format = defaultZXingGenerateOptions.format,
    charset = defaultZXingGenerateOptions.charset,
    quietZone = defaultZXingGenerateOptions.quietZone,
    width = defaultZXingGenerateOptions.width,
    height = defaultZXingGenerateOptions.height,
    eccLevel = defaultZXingGenerateOptions.eccLevel,
  }: ZXingGenerateOptions = defaultZXingGenerateOptions
): Promise<ZXingGenerateResult> {
  return _generateBarcodeToImageFile(
    text,
    {
      format,
      charset,
      quietZone,
      width,
      height,
      eccLevel,
    },
    ZXing
  );
}
