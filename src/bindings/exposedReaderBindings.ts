import {
  type ReaderOptions,
  type ResolvedReaderOptions,
  defaultReaderOptions as ro,
} from "./index.js";

export const defaultReaderOptions: ReaderOptions = {
  ...ro,
  formats: [...ro.formats],
} satisfies ResolvedReaderOptions;

export {
  barcodeFormats,
  binarizers,
  characterSets,
  contentTypes,
  eanAddOnSymbols,
  readOutputEccLevels,
  textModes,
  type BarcodeFormat,
  type Binarizer,
  type CharacterSet,
  type ContentType,
  type EanAddOnSymbol,
  type Point,
  type Position,
  type ReadInputBarcodeFormat,
  type ReadOutputBarcodeFormat,
  type ReadOutputEccLevel,
  type ReadResult,
  type ReaderOptions,
  type TextMode,
  type ZXingBinarizer,
  type ZXingCharacterSet,
  type ZXingContentType,
  type ZXingEanAddOnSymbol,
  type ZXingEnum,
  type ZXingPoint,
  type ZXingPosition,
  type ZXingReadResult,
  type ZXingReaderOptions,
  type ZXingTextMode,
  type ZXingVector,
} from "./index.js";

export {
  /**
   * @deprecated Renamed as `ReaderOptions`
   */
  type ReaderOptions as DecodeHints,
  /**
   * @deprecated Renamed as `ZXingReaderOptions`
   */
  type ZXingReaderOptions as ZXingDecodeHints,
} from "./index.js";
export {
  /**
   * @deprecated Renamed as `defaultReaderOptions`
   */
  defaultReaderOptions as defaultDecodeHints,
};
