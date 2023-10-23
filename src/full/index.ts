import zxingModuleFactory from "./zxing_full.js";
import {
  type ZXingModuleOverrides,
  type ZXingModule,
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  readBarcodesFromImageDataWithFactory,
  readBarcodesFromImageFileWithFactory,
  writeBarcodeToImageFileWithFactory,
} from "../core.js";
import type { DecodeHints } from "../bindings/decodeHints.js";
import type { EncodeHints } from "../bindings/encodeHints.js";

export function getZXingModule(
  zxingModuleOverrides?: ZXingModuleOverrides<"full">,
) {
  return getZXingModuleWithFactory(
    zxingModuleFactory,
    zxingModuleOverrides,
  ) as Promise<ZXingModule<"full">>;
}

export function setZXingModuleOverrides(
  zxingModuleOverrides: ZXingModuleOverrides<"full">,
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

export * from "../exposed.js";
