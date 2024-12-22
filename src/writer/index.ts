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
  type ZXingModuleOverrides,
  type ZXingWriterModule,
  prepareZXingModuleWithFactory,
  purgeZXingModuleWithFactory,
  writeBarcodeWithFactory,
} from "../core.js";
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

/**
 * Prepares and initializes the ZXing barcode scanning module with optional configuration.
 *
 * @param options - Optional configuration settings for the ZXing module initialization
 * @returns A promise that resolves with the initialized ZXing module instance
 *
 * @remarks
 * This is a wrapper function that uses the default ZXing module factory.
 * For custom factory implementations, use `prepareZXingModuleWithFactory` directly.
 */
export function prepareZXingModule(options?: PrepareZXingModuleOptions) {
  return prepareZXingModuleWithFactory(zxingModuleFactory, options);
}

/**
 * Purges the ZXing module from memory using the default module factory.
 *
 * @remarks
 * This is a wrapper function that calls purgeZXingModuleWithFactory with the default zxingModuleFactory.
 * Use this function to clean up resources when the ZXing module is no longer needed.
 *
 * @returns A promise that resolves when the module has been successfully purged
 */
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

/**
 * Generates a barcode image from the provided input data.
 *
 * @param input - The data to encode in the barcode. Can be either a string or a Uint8Array
 * @param writerOptions - Optional configuration options for barcode generation
 * @returns A Promise that resolves with the generated barcode
 *
 * @throws Will throw an error if the input data cannot be encoded or if barcode generation fails
 */
export async function writeBarcode(
  input: string | Uint8Array,
  writerOptions?: WriterOptions,
) {
  return writeBarcodeWithFactory(zxingModuleFactory, input, writerOptions);
}

export * from "../bindings/exposedWriterBindings.js";
export {
  ZXING_WASM_VERSION,
  type PrepareZXingModuleOptions,
  type ZXingWriterModule,
  type ZXingModuleOverrides,
} from "../core.js";
export const ZXING_WASM_SHA256 = WRITER_HASH;
