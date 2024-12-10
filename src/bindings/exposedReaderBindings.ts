import { type ReaderOptions, defaultReaderOptions as ro } from "./index.js";

export const defaultReaderOptions: Required<ReaderOptions> = {
  ...ro,
  formats: [...ro.formats],
};

export {
  barcodeFormats,
  type BarcodeFormat,
  linearBarcodeFormats,
  type LinearBarcodeFormat,
  matrixBarcodeFormats,
  type MatrixBarcodeFormat,
  type LooseBarcodeFormat,
  type ReadInputBarcodeFormat,
  type ReadOutputBarcodeFormat,
  binarizers,
  type Binarizer,
  characterSets,
  type CharacterSet,
  contentTypes,
  type ContentType,
  type EcLevel,
  type ZXingReaderOptions,
  type ReaderOptions,
  eanAddOnSymbols,
  type EanAddOnSymbol,
  type ZXingPoint,
  type ZXingPosition,
  type Point,
  type Position,
  type ZXingReadResult,
  type ReadResult,
  textModes,
  type TextMode,
  type ZXingVector,
} from "./index.js";
