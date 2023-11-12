import { defaultEncodeHints as eh } from "./index.js";
export const defaultEncodeHints = structuredClone(eh);

export {
  barcodeFormats,
  type BarcodeFormat,
  type WriteInputBarcodeFormat,
  characterSets,
  type ZXingCharacterSet,
  type CharacterSet,
  writeInputEccLevels,
  type WriteInputEccLevel,
  type ZXingEncodeHints,
  type EncodeHints,
  type ZXingEnum,
  type ZXingWriteResult,
  type WriteResult,
} from "./index.js";
