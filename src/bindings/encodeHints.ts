import { ZXingModule } from "../core.js";
import { WriteInputBarcodeFormat } from "./barcodeFormat.js";
import { CharacterSet, characterSetToZXingEnum } from "./characterSet.js";
import { WriteInputEccLevel } from "./eccLevel.js";
import { ZXingEnum } from "./enum.js";

/**
 * @internal
 */
export interface ZXingEncodeHints {
  /**
   * Width of the barcode.
   *
   * @defaultValue `200`
   */
  width: number;
  /**
   * Height of the barcode.
   *
   * @defaultValue `200`
   */
  height: number;
  format: string;
  characterSet: ZXingEnum;
  eccLevel: number;
  /**
   * The minimum number of quiet zone pixels.
   *
   * @defaultValue `10`
   */
  margin: number;
}

/**
 * Encode hints for writing barcodes.
 */
export interface EncodeHints
  extends Partial<
    Omit<ZXingEncodeHints, "format" | "characterSet" | "eccLevel">
  > {
  /**
   * The format of the barcode to write.
   *
   * Supported values are:
   * `"Aztec"`, `"Codabar"`, `"Code128"`, `"Code39"`, `"Code93"`,
   * `"DataMatrix"`, `"EAN-13"`, `"EAN-8"`, `"ITF"`,
   * `"PDF417"`, `"QRCode"`, `"UPC-A"`, `"UPC-E"`
   *
   * @defaultValue `"QRCode"`
   */
  format?: WriteInputBarcodeFormat;
  /**
   * Character set to use for encoding the text.
   * Used for Aztec, PDF417, and QRCode only.
   *
   * @defaultValue `"UTF8"`
   */
  characterSet?: CharacterSet;
  /**
   * Error correction level of the symbol.
   * Used for Aztec, PDF417, and QRCode only.
   * `-1` means auto.
   *
   * @defaultValue `-1`
   */
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
