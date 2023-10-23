import { ZXingModule } from "../core.js";
import { WriteInputBarcodeFormat } from "./barcodeFormat.js";
import { CharacterSet, characterSetToZXingEnum } from "./characterSet.js";
import { WriteInputEccLevel } from "./eccLevel.js";
import { ZXingEnum } from "./enum.js";

export interface ZXingEncodeHints {
  width: number;
  height: number;
  format: string;
  characterSet: ZXingEnum;
  eccLevel: number;
  margin: number;
}

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

export function encodeHintsToZXingEncodeHints<T extends "writer" | "full">(
  zxingModule: ZXingModule<T>,
  encodeHints: Required<EncodeHints>,
): ZXingEncodeHints {
  return {
    ...encodeHints,
    characterSet: characterSetToZXingEnum(
      zxingModule,
      encodeHints.characterSet,
    ),
  };
}
