import zxingModuleFactory from "./zxing_reader.js";
import {
  readBarcodeFromImageFile as _readBarcodeFromImageFile,
  readBarcodeFromImageData as _readBarcodeFromImageData,
  writeBarcodeToImageFile as _writeBarcodeToImageFile,
  getZXingModule as _getZXingModule,
  defaultZXingReadOptions,
  ZXingReadOptions,
  ZXingReadOutput,
} from "../ZXing.js";

export function getZXingInstance(
  zxingModuleOverrides?: Partial<Awaited<ReturnType<typeof zxingModuleFactory>>>
) {
  _getZXingModule(zxingModuleFactory, zxingModuleOverrides);
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
