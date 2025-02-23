import type { Merge } from "type-fest";
import type { ReaderOptions, WriterOptions } from "../bindings/index.js";
import {
  type PrepareZXingModuleOptions,
  type ZXingFullModule,
  type ZXingModuleOverrides,
  prepareZXingModuleWithFactory,
  purgeZXingModuleWithFactory,
  readBarcodesWithFactory,
  writeBarcodeWithFactory,
} from "../share.js";
import zxingModuleFactory from "./zxing_full.js";

export function prepareZXingModule(
  options?: Merge<PrepareZXingModuleOptions, { fireImmediately?: false }>,
): void;

export function prepareZXingModule(
  options: Merge<PrepareZXingModuleOptions, { fireImmediately: true }>,
): Promise<ZXingFullModule>;

export function prepareZXingModule(
  options?: PrepareZXingModuleOptions,
): void | Promise<ZXingFullModule>;

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

export async function readBarcodes(
  input: Blob | ArrayBuffer | Uint8Array | ImageData,
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

export async function writeBarcode(
  input: string | Uint8Array,
  writerOptions?: WriterOptions,
) {
  return writeBarcodeWithFactory(zxingModuleFactory, input, writerOptions);
}

export * from "../bindings/exposedReaderBindings.js";
export * from "../bindings/exposedWriterBindings.js";
export {
  ZXING_WASM_VERSION,
  ZXING_CPP_COMMIT,
  type PrepareZXingModuleOptions,
  type ZXingFullModule,
  type ZXingModuleOverrides,
} from "../share.js";
export const ZXING_WASM_SHA256 = FULL_HASH;

if (import.meta.env.MODE === "miniprogram") {
  exports.getOverridesForMiniprogram = (
    wasmFilePath: string,
  ): ZXingModuleOverrides => ({
    instantiateWasm(imports, successCallback) {
      WebAssembly.instantiate(
        wasmFilePath as unknown as BufferSource,
        imports,
      ).then(({ instance }) => successCallback(instance));
      return {};
    },
  });
}
