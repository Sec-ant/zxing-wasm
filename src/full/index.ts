import type { ReaderOptions, WriterOptions } from "../bindings/index.js";
import {
  type ZXingFullModule,
  type ZXingModuleOverrides,
  getZXingModuleWithFactory,
  readBarcodesWithFactory,
  setZXingModuleOverridesWithFactory,
  writeBarcodeWithFactory,
} from "../core.js";
import zxingModuleFactory from "./zxing_full.js";

export function getZXingModule(zxingModuleOverrides?: ZXingModuleOverrides) {
  return getZXingModuleWithFactory(
    zxingModuleFactory,
    zxingModuleOverrides,
  ) as Promise<ZXingFullModule>;
}

export function setZXingModuleOverrides(
  zxingModuleOverrides: ZXingModuleOverrides,
) {
  return setZXingModuleOverridesWithFactory(
    zxingModuleFactory,
    zxingModuleOverrides,
  );
}

export async function readBarcodes(
  input: Blob | ImageData,
  readerOptions?: ReaderOptions,
) {
  return readBarcodesWithFactory(zxingModuleFactory, input, readerOptions);
}

/**
 * @deprecated Use {@link readBarcodes} instead.
 */
export async function readBarcodesFromImageFile(
  imageFile: Blob,
  readerOptions?: ReaderOptions,
) {
  return readBarcodes(imageFile, readerOptions);
}

/**
 * @deprecated Use {@link readBarcodes} instead.
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
  purgeZXingModule,
  type ZXingFullModule,
  type ZXingModuleOverrides,
} from "../core.js";
