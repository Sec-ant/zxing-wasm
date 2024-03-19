import {
  type ResolvedWriterOptions,
  type WriterOptions,
  defaultWriterOptions as wo,
} from "./index.js";

export const defaultWriterOptions: WriterOptions = {
  ...wo,
} satisfies ResolvedWriterOptions;

export {
  barcodeFormats,
  characterSets,
  writeInputEccLevels,
  type BarcodeFormat,
  type CharacterSet,
  type WriteInputBarcodeFormat,
  type WriteInputEccLevel,
  type WriteResult,
  type WriterOptions,
  type ZXingCharacterSet,
  type ZXingEnum,
  type ZXingWriteResult,
  type ZXingWriterOptions,
} from "./index.js";

export {
  /**
   * @deprecated Renamed as `WriterOptions`
   */
  type WriterOptions as EncodeHints,
  /**
   * @deprecated Renamed as `ZXingWriterOptions`
   */
  type ZXingWriterOptions as ZXingEncodeHints,
} from "./index.js";
export {
  /**
   * @deprecated Renamed as `defaultWriterOptions`
   */
  defaultWriterOptions as defaultEncodeHints,
};
