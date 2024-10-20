import { type ReaderOptions, defaultReaderOptions as ro } from "./index.js";

export const defaultReaderOptions: Required<ReaderOptions> = {
  ...ro,
  formats: [...ro.formats],
};

export {
  barcodeFormats,
  type BarcodeFormat,
  type ReadInputBarcodeFormat,
  type ReadOutputBarcodeFormat,
  binarizers,
  type ZXingBinarizer,
  type Binarizer,
  characterSets,
  type ZXingCharacterSet,
  type CharacterSet,
  contentTypes,
  type ZXingContentType,
  type ContentType,
  type ZXingReaderOptions,
  type ReaderOptions,
  eanAddOnSymbols,
  type ZXingEanAddOnSymbol,
  type EanAddOnSymbol,
  readOutputEccLevels,
  type ReadOutputEccLevel,
  type ZXingEnum,
  type ZXingPoint,
  type ZXingPosition,
  type Point,
  type Position,
  type ZXingReadResult,
  type ReadResult,
  textModes,
  type ZXingTextMode,
  type TextMode,
  type ZXingVector,
} from "./index.js";

export {
  /**
   * @deprecated renamed as `defaultReaderOptions`
   */
  defaultReaderOptions as defaultDecodeHints,
};
export type {
  /**
   * @deprecated renamed as `ZXingReaderOptions`
   */
  ZXingReaderOptions as ZXingDecodeHints,
  /**
   * @deprecated renamed as `ReaderOptions`
   */
  ReaderOptions as DecodeHints,
} from "./index.js";
