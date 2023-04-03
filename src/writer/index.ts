import ZXing from "./zxing_writer.js";
import {
  writeBarcodeToImageFile as _writeBarcodeToImageFile,
  getZXingInstance as _getZXingInstance,
  defaultZXingWriteOptions,
  ZXingWriteOptions,
  ZXingWriteResult,
} from "../ZXing.js";

export function getZXingInstance() {
  return _getZXingInstance(ZXing);
}

export async function writeBarcodeToImageFile(
  text: string,
  {
    format = defaultZXingWriteOptions.format,
    charset = defaultZXingWriteOptions.charset,
    quietZone = defaultZXingWriteOptions.quietZone,
    width = defaultZXingWriteOptions.width,
    height = defaultZXingWriteOptions.height,
    eccLevel = defaultZXingWriteOptions.eccLevel,
  }: ZXingWriteOptions = defaultZXingWriteOptions
): Promise<ZXingWriteResult> {
  return _writeBarcodeToImageFile(
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

export * from "../exposed.js";
