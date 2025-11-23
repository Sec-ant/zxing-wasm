import { type WriterOptions, defaultWriterOptions as wo } from "./index.js";

export const defaultWriterOptions: Required<WriterOptions> = { ...wo };

export {
  type BarcodeFormat,
  barcodeFormats,
  type CharacterSet,
  characterSets,
  type EcLevel,
  type LinearBarcodeFormat,
  type LooseBarcodeFormat,
  linearBarcodeFormats,
  type MatrixBarcodeFormat,
  matrixBarcodeFormats,
  type WriteInputBarcodeFormat,
  type WriteResult,
  type WriterOptions,
  type ZXingWriteResult,
  type ZXingWriterOptions,
} from "./index.js";
