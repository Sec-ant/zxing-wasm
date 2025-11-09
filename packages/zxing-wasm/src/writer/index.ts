/**
 * The writer part API of this package is subject to change a lot.
 * Please track the status of [this issue](https://github.com/zxing-cpp/zxing-cpp/issues/332).
 *
 * @packageDocumentation
 */

import type { Merge } from "type-fest";
import type { WriterOptions } from "../bindings/index.js";
import {
  type PrepareZXingModuleOptions,
  prepareZXingModuleWithFactory,
  purgeZXingModuleWithFactory,
  writeBarcodeWithFactory,
  type ZXingModuleOverrides,
  type ZXingWriterModule,
} from "../share.js";
import zxingModuleFactory from "./zxing_writer.js";

export function prepareZXingModule(
  options?: Merge<PrepareZXingModuleOptions, { fireImmediately?: false }>,
): void;

export function prepareZXingModule(
  options: Merge<PrepareZXingModuleOptions, { fireImmediately: true }>,
): Promise<ZXingWriterModule>;

export function prepareZXingModule(
  options?: PrepareZXingModuleOptions,
): void | Promise<ZXingWriterModule>;

export function prepareZXingModule(options?: PrepareZXingModuleOptions) {
  return prepareZXingModuleWithFactory(zxingModuleFactory, options);
}

export function purgeZXingModule() {
  return purgeZXingModuleWithFactory(zxingModuleFactory);
}

/**
 * @deprecated Use {@link prepareZXingModule | `prepareZXingModule`} instead.
 * This function is equivalent to the following:
 *
 * ```ts
 * prepareZXingModule({
 *   overrides: zxingModuleOverrides,
 *   equalityFn: Object.is,
 *   fireImmediately: true,
 * });
 * ```
 */
export function getZXingModule(zxingModuleOverrides?: ZXingModuleOverrides) {
  return prepareZXingModule({
    overrides: zxingModuleOverrides,
    equalityFn: Object.is,
    fireImmediately: true,
  });
}

/**
 * @deprecated Use {@link prepareZXingModule | `prepareZXingModule`} instead.
 * This function is equivalent to the following:
 *
 * ```ts
 * prepareZXingModule({
 *   overrides: zxingModuleOverrides,
 *   equalityFn: Object.is,
 *   fireImmediately: false,
 * });
 * ```
 */
export function setZXingModuleOverrides(
  zxingModuleOverrides: ZXingModuleOverrides,
) {
  prepareZXingModule({
    overrides: zxingModuleOverrides,
    equalityFn: Object.is,
    fireImmediately: false,
  });
}

export async function writeBarcode(
  input: string | Uint8Array,
  writerOptions?: WriterOptions,
) {
  return writeBarcodeWithFactory(zxingModuleFactory, input, writerOptions);
}

export * from "../bindings/exposedWriterBindings.js";
export {
  type PrepareZXingModuleOptions,
  ZXING_CPP_COMMIT,
  ZXING_WASM_VERSION,
  type ZXingModuleOverrides,
  type ZXingWriterModule,
} from "../share.js";
export const ZXING_WASM_SHA256 = WRITER_HASH;
