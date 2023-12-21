import { defaultReaderOptions as ro } from "./index.js";

export const defaultReaderOptions: typeof ro = {
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
export {
  /**
   * @deprecated renamed as `ZXingReaderOptions`
   */
  type ZXingReaderOptions as ZXingDecodeHints,
  /**
   * @deprecated renamed as `ReaderOptions`
   */
  type ReaderOptions as DecodeHints,
} from "./index.js";
