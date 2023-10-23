import zxingModuleFactory from "../wasm/zxing_reader.js";
import {
  ZXingModuleFactoryTypeExtractor,
  ZXingModuleOverrides,
  readBarcodesFromImageFile as _readBarcodesFromImageFile,
  readBarcodesFromImageData as _readBarcodesFromImageData,
  getZXingModule as _getZXingModule,
  defaultZXingReadOptions,
  ZXingReadOptions,
  ZXingReadOutput,
} from "../core.js";

export function getZXingModule(
  zxingModuleOverrides?: ZXingModuleOverrides<
    ZXingModuleFactoryTypeExtractor<typeof zxingModuleFactory>
  >,
): ReturnType<typeof _getZXingModule> {
  return _getZXingModule(zxingModuleFactory, zxingModuleOverrides);
}

export async function readBarcodesFromImageFile(
  imageFile: Blob | File,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxSymbols = defaultZXingReadOptions.maxSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions,
): Promise<ZXingReadOutput[]> {
  return _readBarcodesFromImageFile(
    imageFile,
    {
      tryHarder,
      formats,
      maxSymbols,
    },
    zxingModuleFactory,
  );
}

export async function readBarcodesFromImageData(
  imageData: ImageData,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxSymbols = defaultZXingReadOptions.maxSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions,
): Promise<ZXingReadOutput[]> {
  return _readBarcodesFromImageData(
    imageData,
    {
      tryHarder,
      formats,
      maxSymbols,
    },
    zxingModuleFactory,
  );
}

export * from "../exposed.js";
