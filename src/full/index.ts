import zxingModuleFactory from "./zxing_full.js";
import {
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  readBarcodesFromImageDataWithFactory,
  readBarcodesFromImageFileWithFactory,
  writeBarcodeToImageFileWithFactory,
  type ZXingFullModule,
  type ZXingModuleOverrides,
} from "../core.js";
import type { ReaderOptions, WriterOptions } from "../bindings/index.js";

export function getZXingModule(zxingModuleOverrides?: ZXingModuleOverrides) {
  return getZXingModuleWithFactory(
    zxingModuleFactory,
    zxingModuleOverrides,
  ) as Promise<ZXingFullModule>;
}

export function setZXingModuleOverrides(
  zxingModuleOverrides: ZXingModuleOverrides,
) {
  return setZXingModuleOverridesWithFactory(
    zxingModuleFactory,
    zxingModuleOverrides,
  );
}

export async function readBarcodesFromImageFile(
  imageFile: Blob,
  readerOptions?: ReaderOptions,
) {
  return readBarcodesFromImageFileWithFactory(
    zxingModuleFactory,
    imageFile,
    readerOptions,
  );
}

export async function readBarcodesFromImageData(
  imageData: ImageData,
  readerOptions?: ReaderOptions,
) {
  return readBarcodesFromImageDataWithFactory(
    zxingModuleFactory,
    imageData,
    readerOptions,
  );
}

export async function writeBarcodeToImageFile(
  text: string,
  writerOptions?: WriterOptions,
) {
  return writeBarcodeToImageFileWithFactory(
    zxingModuleFactory,
    text,
    writerOptions,
  );
}

export * from "../bindings/exposedReaderBindings.js";
export * from "../bindings/exposedWriterBindings.js";
export {
  purgeZXingModule,
  type ZXingFullModule,
  type ZXingModuleOverrides,
} from "../core.js";
