import { type WriterOptions, defaultWriterOptions as wo } from "./index.js";

export const defaultWriterOptions: Required<WriterOptions> = { ...wo };

export {
  barcodeFormats,
  type BarcodeFormat,
  type WriteInputBarcodeFormat,
  characterSets,
  type ZXingCharacterSet,
  type CharacterSet,
  writeInputEccLevels,
  type WriteInputEccLevel,
  type ZXingWriterOptions,
  type WriterOptions,
  type ZXingEnum,
  type ZXingWriteResult,
  type WriteResult,
} from "./index.js";

export {
  /**
   * @deprecated renamed as `defaultWriterOptions`
   */
  defaultWriterOptions as defaultEncodeHints,
};
export {
  /**
   * @deprecated renamed as `ZXingWriterOptions`
   */
  type ZXingWriterOptions as ZXingEncodeHints,
  /**
   * @deprecated renamed as `WriterOptions`
   */
  type WriterOptions as EncodeHints,
} from "./index.js";
