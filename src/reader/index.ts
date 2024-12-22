import type { Merge } from "type-fest";
import type { ReaderOptions } from "../bindings/index.js";
import {
  type PrepareZXingModuleOptions,
  type ZXingModuleOverrides,
  type ZXingReaderModule,
  prepareZXingModuleWithFactory,
  purgeZXingModuleWithFactory,
  readBarcodesWithFactory,
} from "../core.js";
import zxingModuleFactory from "./zxing_reader.js";

export function prepareZXingModule(
  options?: Merge<PrepareZXingModuleOptions, { fireImmediately?: false }>,
): void;

export function prepareZXingModule(
  options: Merge<PrepareZXingModuleOptions, { fireImmediately: true }>,
): Promise<ZXingReaderModule>;

export function prepareZXingModule(
  options?: PrepareZXingModuleOptions,
): void | Promise<ZXingReaderModule>;

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
 * Reads and decodes barcodes from an image source using ZXing library.
 *
 * @param input - The image source to scan for barcodes, either as a Blob or ImageData
 * @param readerOptions - Optional configuration options for the barcode reader
 * @returns A promise that resolves with the decoded barcode results
 *
 * @throws Will throw an error if the image cannot be processed or if the barcode detection fails
 */
export async function readBarcodes(
  input: Blob | ImageData,
  readerOptions?: ReaderOptions,
) {
  return readBarcodesWithFactory(zxingModuleFactory, input, readerOptions);
}

/**
 * @deprecated Use {@link readBarcodes | `readBarcodes`} instead.
 */
export async function readBarcodesFromImageFile(
  imageFile: Blob,
  readerOptions?: ReaderOptions,
) {
  return readBarcodes(imageFile, readerOptions);
}

/**
 * @deprecated Use {@link readBarcodes | `readBarcodes`} instead.
 */
export async function readBarcodesFromImageData(
  imageData: ImageData,
  readerOptions?: ReaderOptions,
) {
  return readBarcodes(imageData, readerOptions);
}

export * from "../bindings/exposedReaderBindings.js";
export {
  ZXING_WASM_VERSION,
  type PrepareZXingModuleOptions,
  type ZXingReaderModule,
  type ZXingModuleOverrides,
} from "../core.js";
export const ZXING_WASM_SHA256 = READER_HASH;
