import zxingModuleFactory from "./zxing_writer.js";
import {
  type ZXingModuleOverrides,
  type ZXingModule,
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  writeBarcodeToImageFileWithFactory,
} from "../core.js";
import type { EncodeHints } from "../bindings/encodeHints.js";

export function getZXingModule(
  zxingModuleOverrides?: ZXingModuleOverrides<"writer">,
) {
  return getZXingModuleWithFactory(
    zxingModuleFactory,
    zxingModuleOverrides,
  ) as Promise<ZXingModule<"writer">>;
}

export function setZXingModuleOverrides(
  zxingModuleOverrides: ZXingModuleOverrides<"writer">,
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

export * from "../exposed.js";
