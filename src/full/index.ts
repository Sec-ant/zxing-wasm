import zxingModuleFactory from "./zxing_full.js";
import {
  readBarcodeFromImageFile as _readBarcodeFromImageFile,
  readBarcodeFromImageData as _readBarcodeFromImageData,
  writeBarcodeToImageFile as _writeBarcodeToImageFile,
  getZXingModule as _getZXingModule,
  defaultZXingReadOptions,
  ZXingReadOptions,
  ZXingReadOutput,
  defaultZXingWriteOptions,
  ZXingWriteOptions,
  ZXingWriteOutput,
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

export async function readBarcodeFromImageData(
  imageData: ImageData,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxNumberOfSymbols = defaultZXingReadOptions.maxNumberOfSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions
): Promise<ZXingReadOutput[]> {
  return _readBarcodeFromImageData(
    imageData,
    {
      tryHarder,
      formats,
      maxNumberOfSymbols,
    },
    zxingModuleFactory
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
