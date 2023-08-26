import zxingModuleFactory from "./zxing_full.js";
import {
  ZXingModuleFactoryTypeExtractor,
  ZXingModuleOverrides,
  readBarcodesFromImageFile as _readBarcodesFromImageFile,
  readBarcodesFromImageData as _readBarcodesFromImageData,
  writeBarcodeToImageFile as _writeBarcodeToImageFile,
  getZXingModule as _getZXingModule,
  defaultZXingReadOptions,
  ZXingReadOptions,
  ZXingReadOutput,
  defaultZXingWriteOptions,
  ZXingWriteOptions,
  ZXingWriteOutput,
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

export async function readBarcodeFromImageData(
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

export async function writeBarcodeToImageFile(
  text: string,
  {
    format = defaultZXingWriteOptions.format,
    charset = defaultZXingWriteOptions.charset,
    quietZone = defaultZXingWriteOptions.quietZone,
    width = defaultZXingWriteOptions.width,
    height = defaultZXingWriteOptions.height,
    eccLevel = defaultZXingWriteOptions.eccLevel,
  }: ZXingWriteOptions = defaultZXingWriteOptions,
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
    zxingModuleFactory,
  );
}

export * from "../exposed.js";
