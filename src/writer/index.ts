import ZXing from "./zxing_writer.js";
import {
  scanBarcodeFromImageFile as _scanBarcodeFromImageFile,
  scanBarcodeFromImageData as _scanBarcodeFromImageData,
  generateBarcodeToImageFile as _generateBarcodeToImageFile,
  getZXingInstance as _getZXingInstance,
  defaultZXingGenerateOptions,
  ZXingGenerateOptions,
  ZXingGenerateResult,
} from "../ZXing.js";

export function getZXingInstance() {
  return _getZXingInstance(ZXing);
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
