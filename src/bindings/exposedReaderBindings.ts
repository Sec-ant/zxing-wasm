import { type ReaderOptions, defaultReaderOptions as ro } from "./index.js";

export const defaultReaderOptions: Required<ReaderOptions> = {
  ...ro,
  formats: [...ro.formats],
};

export {
  type BarcodeFormat,
  type Binarizer,
  barcodeFormats,
  binarizers,
  type CharacterSet,
  type ContentType,
  characterSets,
  contentTypes,
  type EanAddOnSymbol,
  type EcLevel,
  eanAddOnSymbols,
  type LinearBarcodeFormat,
  type LooseBarcodeFormat,
  linearBarcodeFormats,
  type MatrixBarcodeFormat,
  matrixBarcodeFormats,
  type Point,
  type Position,
  type ReaderOptions,
  type ReadInputBarcodeFormat,
  type ReadOutputBarcodeFormat,
  type ReadResult,
  type TextMode,
  textModes,
  type ZXingPoint,
  type ZXingPosition,
  type ZXingReaderOptions,
  type ZXingReadResult,
  type ZXingVector,
} from "./index.js";
