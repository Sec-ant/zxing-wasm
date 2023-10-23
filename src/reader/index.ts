import zxingModuleFactory from "./zxing_reader.js";
import {
  type ZXingModuleOverrides,
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  readBarcodesFromImageDataWithFactory,
  readBarcodesFromImageFileWithFactory,
} from "../core.js";
import type { DecodeHints } from "../bindings/decodeHints.js";

export function getZXingModule(
  zxingModuleOverrides?: ZXingModuleOverrides<"reader">,
) {
  return getZXingModuleWithFactory(zxingModuleFactory, zxingModuleOverrides);
}

export function setZXingModuleOverrides(
  zxingModuleOverrides: ZXingModuleOverrides<"reader">,
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

export * from "../exposed.js";
