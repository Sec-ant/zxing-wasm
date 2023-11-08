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
import type { DecodeHints, EncodeHints } from "../bindings/index.js";

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

export async function writeBarcodeToImageFile(
  text: string,
  encodeHints?: EncodeHints,
) {
  return writeBarcodeToImageFileWithFactory(
    zxingModuleFactory,
    text,
    encodeHints,
  );
}

export * from "../readerExposedBindings.js";
export * from "../writerExposedBindings.js";
export {
  purgeZXingModule,
  type ZXingFullModule,
  type ZXingModuleOverrides,
} from "../core.js";
