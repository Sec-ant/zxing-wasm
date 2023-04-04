import zxingModuleFactory from "./zxing_writer.js";
import {
  readBarcodeFromImageFile as _readBarcodeFromImageFile,
  readBarcodeFromImageData as _readBarcodeFromImageData,
  writeBarcodeToImageFile as _writeBarcodeToImageFile,
  getZXingModule as _getZXingModule,
  defaultZXingWriteOptions,
  ZXingWriteOptions,
  ZXingWriteOutput,
} from "../ZXing.js";

export function getZXingInstance(
  zxingModuleOverrides?: Partial<Awaited<ReturnType<typeof zxingModuleFactory>>>
) {
  _getZXingModule(zxingModuleFactory, zxingModuleOverrides);
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
): Promise<ZXingWriteOutput> {
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
    zxingModuleFactory
  );
}

export * from "../exposed.js";
