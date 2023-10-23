import { WriteInputBarcodeFormat } from "./barcodeFormat.js";
import {
  CharacterSet,
  characterSetToZXingCharacterSet,
} from "./characterSet.js";
import { WriteInputEccLevel } from "./eccLevel.js";

export interface EncodeHints
  extends Partial<
    Omit<ZXingEncodeHints, "format" | "characterSet" | "eccLevel">
  > {
  format?: WriteInputBarcodeFormat;
  characterSet?: CharacterSet;
  eccLevel?: WriteInputEccLevel;
}

export const defaultEncodeHints: Required<EncodeHints> = {
  width: 200,
  height: 200,
  format: "QRCode",
  characterSet: "UTF8",
  eccLevel: -1,
  margin: 10,
};

export function encodeHintsToZXingEncodeHints(
  encodeHints: Required<EncodeHints>,
): ZXingEncodeHints {
  return {
    ...encodeHints,
    characterSet: characterSetToZXingCharacterSet(encodeHints.characterSet),
  };
}
