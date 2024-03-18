import type { ZXingModule } from "../core.js";
import type { WriteInputBarcodeFormat } from "./barcodeFormat.js";
import { type CharacterSet, characterSetToZXingEnum } from "./characterSet.js";
import type { WriteInputEccLevel } from "./eccLevel.js";
import type { ZXingEnum } from "./enum.js";

/**
 * @internal
 */
export interface ZXingWriterOptions {
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
 * Writer options for writing barcodes.
 */
export interface WriterOptions
  extends Partial<
    Omit<ZXingWriterOptions, "format" | "characterSet" | "eccLevel">
  > {
  /**
   * The format of the barcode to write.
   *
   * Supported values are: `"Aztec"`, `"Codabar"`, `"Code128"`, `"Code39"`, `"Code93"`,
   * `"DataMatrix"`, `"EAN-13"`, `"EAN-8"`, `"ITF"`, `"PDF417"`, `"QRCode"`, `"UPC-A"`, `"UPC-E"`
   *
   * @defaultValue `"QRCode"`
   */
  format?: WriteInputBarcodeFormat;
  /**
   * Character set to use for encoding the text. Used for Aztec, PDF417, and QRCode only.
   *
   * @defaultValue `"UTF8"`
   */
  characterSet?: CharacterSet;
  /**
   * Error correction level of the symbol. Used for Aztec, PDF417, and QRCode only. `-1` means auto.
   *
   * @defaultValue `-1`
   */
  eccLevel?: WriteInputEccLevel;
}

export type ResolvedWriterOptions = Required<WriterOptions>;

export const defaultWriterOptions: ResolvedWriterOptions = {
  width: 200,
  height: 200,
  format: "QRCode",
  characterSet: "UTF8",
  eccLevel: -1,
  margin: 10,
};

export function resolveWriterOptions(
  writerOptions?: WriterOptions,
): ResolvedWriterOptions {
  return {
    width: writerOptions?.width ?? defaultWriterOptions.width,
    height: writerOptions?.height ?? defaultWriterOptions.height,
    format: writerOptions?.format ?? defaultWriterOptions.format,
    characterSet:
      writerOptions?.characterSet ?? defaultWriterOptions.characterSet,
    eccLevel: writerOptions?.eccLevel ?? defaultWriterOptions.eccLevel,
    margin: writerOptions?.margin ?? defaultWriterOptions.margin,
  };
}

export function writerOptionsToZXingWriterOptions<T extends "writer" | "full">(
  zxingModule: ZXingModule<T>,
  writerOptions: ResolvedWriterOptions,
): ZXingWriterOptions {
  return Object.assign(writerOptions, {
    characterSet: characterSetToZXingEnum(
      zxingModule,
      writerOptions.characterSet,
    ),
  });
}
