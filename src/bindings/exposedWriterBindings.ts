import { type WriterOptions, defaultWriterOptions as wo } from "./index.js";

export const defaultWriterOptions: Required<WriterOptions> = { ...wo };

export {
  barcodeFormats,
  type BarcodeFormat,
  linearBarcodeFormats,
  type LinearBarcodeFormat,
  matrixBarcodeFormats,
  type MatrixBarcodeFormat,
  type LooseBarcodeFormat,
  type WriteInputBarcodeFormat,
  characterSets,
  type CharacterSet,
  type EcLevel,
  type ZXingWriterOptions,
  type WriterOptions,
  type ZXingWriteResult,
  type WriteResult,
} from "./index.js";
