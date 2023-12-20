/**
 * The writer part API of this package is subject to change a lot.
 * Please track the status of [this issue](https://github.com/zxing-cpp/zxing-cpp/issues/332).
 *
 * @packageDocumentation
 */

import zxingModuleFactory from "./zxing_writer.js";
import {
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  writeBarcodeToImageFileWithFactory,
  type ZXingWriterModule,
  type ZXingModuleOverrides,
} from "../core.js";
import type { WriterOptions } from "../bindings/index.js";

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
  type ZXingWriterModule,
  type ZXingModuleOverrides,
} from "../core.js";
