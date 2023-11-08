import zxingModuleFactory from "./zxing_writer.js";
import {
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  writeBarcodeToImageFileWithFactory,
  type ZXingWriterModule,
  type ZXingModuleOverrides,
} from "../core.js";
import type { EncodeHints } from "../bindings/index.js";

export function getZXingModule(zxingModuleOverrides?: ZXingModuleOverrides) {
  return getZXingModuleWithFactory(
    zxingModuleFactory,
    zxingModuleOverrides,
  ) as Promise<ZXingWriterModule>;
}

export function setZXingModuleOverrides(
  zxingModuleOverrides: ZXingModuleOverrides,
) {
  return setZXingModuleOverridesWithFactory(
    zxingModuleFactory,
    zxingModuleOverrides,
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

export * from "../writerExposedBindings.js";
export {
  purgeZXingModule,
  type ZXingWriterModule,
  type ZXingModuleOverrides,
} from "../core.js";
