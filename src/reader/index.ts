import zxingModuleFactory from "./zxing_reader.js";
import {
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  readBarcodesFromImageDataWithFactory,
  readBarcodesFromImageFileWithFactory,
  type ZXingReaderModule,
  type ZXingModuleOverrides,
} from "../core.js";
import type { DecodeHints } from "../bindings/index.js";

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
  imageFile: Blob | File,
  decodeHints?: DecodeHints,
) {
  return readBarcodesFromImageFileWithFactory(
    zxingModuleFactory,
    imageFile,
    decodeHints,
  );
}

export async function readBarcodesFromImageData(
  imageData: ImageData,
  decodeHints?: DecodeHints,
) {
  return readBarcodesFromImageDataWithFactory(
    zxingModuleFactory,
    imageData,
    decodeHints,
  );
}

export * from "../readerExposedBindings.js";
export {
  purgeZXingModule,
  type ZXingReaderModule,
  type ZXingModuleOverrides,
} from "../core.js";
