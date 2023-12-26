import zxingModuleFactory from "./zxing_reader.js";
import {
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  readBarcodesFromImageDataWithFactory,
  readBarcodesFromImageFileWithFactory,
  type ZXingReaderModule,
  type ZXingModuleOverrides,
} from "../core.js";
import type { ReaderOptions } from "../bindings/index.js";

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
