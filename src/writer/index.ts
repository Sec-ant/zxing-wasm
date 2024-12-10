/**
 * The writer part API of this package is subject to change a lot.
 * Please track the status of [this issue](https://github.com/zxing-cpp/zxing-cpp/issues/332).
 *
 * @packageDocumentation
 */

import type { WriterOptions } from "../bindings/index.js";
import {
  type ZXingModuleOverrides,
  type ZXingWriterModule,
  getZXingModuleWithFactory,
  setZXingModuleOverridesWithFactory,
  writeBarcodeWithFactory,
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

export async function writeBarcode(
  input: string | Uint8Array,
  writerOptions?: WriterOptions,
) {
  return writeBarcodeWithFactory(zxingModuleFactory, input, writerOptions);
}

export * from "../bindings/exposedWriterBindings.js";
export {
  purgeZXingModule,
  type ZXingWriterModule,
  type ZXingModuleOverrides,
} from "../core.js";
