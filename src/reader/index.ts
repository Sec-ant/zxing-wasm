import type { ReaderOptions } from "../bindings/index.js";
import {
  type ZXingModuleOverrides,
  type ZXingReaderModule,
  getZXingModuleWithFactory,
  readBarcodesFromImageDataWithFactory,
  readBarcodesFromImageFileWithFactory,
  setZXingModuleOverridesWithFactory,
} from "../core.js";
import zxingModuleFactory from "./zxing_reader.js";

export function getZXingModule(zxingModuleOverrides?: ZXingModuleOverrides) {
  return getZXingModuleWithFactory(
    zxingModuleFactory,
    zxingModuleOverrides,
  ) as Promise<ZXingReaderModule>;
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

export * from "../bindings/exposedReaderBindings.js";
export {
  purgeZXingModule,
  type ZXingReaderModule,
  type ZXingModuleOverrides,
} from "../core.js";
