import zxingModuleFactory from "./zxing_reader.js";
import {
  ZXingModuleFactoryTypeExtractor,
  ZXingModuleOverrides,
  readBarcodeFromImageFile as _readBarcodeFromImageFile,
  readBarcodeFromImageData as _readBarcodeFromImageData,
  writeBarcodeToImageFile as _writeBarcodeToImageFile,
  getZXingModule as _getZXingModule,
  defaultZXingReadOptions,
  ZXingReadOptions,
  ZXingReadOutput,
} from "../core.js";

export function getZXingModule(
  zxingModuleOverrides?: ZXingModuleOverrides<
    ZXingModuleFactoryTypeExtractor<typeof zxingModuleFactory>
  >
): ReturnType<typeof _getZXingModule> {
  return _getZXingModule(zxingModuleFactory, zxingModuleOverrides);
}

export async function readBarcodeFromImageFile(
  imageFile: Blob | File,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxNumberOfSymbols = defaultZXingReadOptions.maxNumberOfSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions
): Promise<ZXingReadOutput[]> {
  return _readBarcodeFromImageFile(
    imageFile,
    {
      tryHarder,
      formats,
      maxNumberOfSymbols,
    },
    zxingModuleFactory
  );
}

export * from "../exposed.js";
