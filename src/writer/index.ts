/**
 * The writer part API of this package is subject to change a lot. Please track the status of [this
 * issue](https://github.com/zxing-cpp/zxing-cpp/issues/332).
 *
 * @packageDocumentation
 */

import type { WriterOptions } from "../bindings/index.js";
import {
  type ZXingModuleOverrides,
  type ZXingWriterModule,
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  writeBarcodeToImageFileWithFactory,
} from "../core.js";
import zxingModuleFactory from "./zxing_writer.js";

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
  writerOptions?: WriterOptions,
) {
  return writeBarcodeToImageFileWithFactory(
    zxingModuleFactory,
    text,
    writerOptions,
  );
}

export * from "../bindings/exposedWriterBindings.js";
export {
  purgeZXingModule,
  type ZXingModuleOverrides,
  type ZXingWriterModule,
} from "../core.js";
