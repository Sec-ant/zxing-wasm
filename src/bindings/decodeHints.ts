import { ZXingModule } from "../core.js";
import { ReadInputBarcodeFormat, formatsToString } from "./barcodeFormat.js";
import { Binarizer, binarizerToZXingEnum } from "./binarizer.js";
import { CharacterSet, characterSetToZXingEnum } from "./characterSet.js";
import { EanAddOnSymbol, eanAddOnSymbolToZXingEnum } from "./eanAddOnSymbol.js";
import { TextMode, textModeToZXingEnum } from "./textMode.js";
import { ZXingEnum } from "./enum.js";

/**
 * @internal
 */
export interface ZXingDecodeHints {
  formats: string;
  /**
   * Spend more time to try to find a barcode. Optimize for accuracy, not speed.
   *
   * @defaultValue `true`
   */
  tryHarder: boolean;
  /**
   * Try detecting code in 90, 180 and 270 degree rotated images.
   *
   * @defaultValue `true`
   */
  tryRotate: boolean;
  /**
   * Try detecting inverted (reversed reflectance) codes if the format allows for those.
   *
   * @defaultValue `true`
   */
  tryInvert: boolean;
  /**
   * Try detecting code in downscaled images (depending on image size).
   *
   * @defaultValue `true`
   * @see {@link downscaleFactor | `downscaleFactor`} {@link downscaleThreshold | `downscaleThreshold`}
   */
  tryDownscale: boolean;
  binarizer: ZXingEnum;
  /**
   * Set to `true` if the input contains nothing but a single perfectly aligned barcode (usually generated images).
   *
   * @defaultValue `false`
   */
  isPure: boolean;
  /**
   * Image size ( min(width, height) ) threshold at which to start downscaled scanning
   * **WARNING**: this API is experimental and may change / disappear
   *
   * @experimental
   * @defaultValue `500`
   * @see {@link tryDownscale | `tryDownscale`} {@link downscaleFactor | `downscaleFactor`}
   */
  downscaleThreshold: number;
  /**
   * Scale factor to use during downscaling, meaningful values are `2`, `3` and `4`.
   * **WARNING**: this API is experimental and may change / disappear
   *
   * @experimental
   * @defaultValue `3`
   * @see {@link tryDownscale | `tryDownscale`} {@link downscaleThreshold | `downscaleThreshold`}
   */
  downscaleFactor: number;
  /**
   * The number of scan lines in a linear barcode that have to be equal to accept the result.
   *
   * @defaultValue `2`
   */
  minLineCount: number;
  /**
   * The maximum number of symbols / barcodes to detect / look for in the image.
   * The upper limit of this number is 255.
   *
   * @defaultValue `255`
   */
  maxNumberOfSymbols: number;
  /**
   * If `true`, the Code-39 reader will try to read extended mode.
   *
   * @defaultValue `false`
   */
  tryCode39ExtendedMode: boolean;
  /**
   * Assume Code-39 codes employ a check digit and validate it.
   *
   * @defaultValue `false`
   */
  validateCode39CheckSum: boolean;
  /**
   * Assume ITF codes employ a GS1 check digit and validate it.
   *
   * @defaultValue `false`
   */
  validateITFCheckSum: boolean;
  /**
   * If `true`, return the start and end chars in a Codabar barcode instead of stripping them.
   *
   * @defaultValue `false`
   */
  returnCodabarStartEnd: boolean;
  /**
   * If `true`, return the barcodes with errors as well (e.g. checksum errors).
   *
   * @defaultValue `false`
   */
  returnErrors: boolean;
  eanAddOnSymbol: ZXingEnum;
  textMode: ZXingEnum;
  characterSet: ZXingEnum;
}

/**
 * Decode hints for reading barcodes.
 */
export interface DecodeHints
  extends Partial<
    Omit<
      ZXingDecodeHints,
      "formats" | "binarizer" | "eanAddOnSymbol" | "textMode" | "characterSet"
    >
  > {
  /**
   * A set of {@link ReadInputBarcodeFormat | `ReadInputBarcodeFormat`}s that should be searched for.
   * An empty list `[]` indicates all supported formats.
   *
   * Supported values in this list are:
   * `"Aztec"`, `"Codabar"`, `"Code128"`, `"Code39"`, `"Code93"`,
   * `"DataBar"`, `"DataBarExpanded"`, `"DataMatrix"`,
   * `"EAN-13"`, `"EAN-8"`, `"ITF"`, `"Linear-Codes"`, `"Matrix-Codes"`,
   * `"MaxiCode"`, `"MicroQRCode"`, `"PDF417"`, `"QRCode"`, `"rMQRCode"`, `"UPC-A"`, `"UPC-E"`
   *
   * @defaultValue `[]`
   */
  formats?: ReadInputBarcodeFormat[];
  /**
   * Algorithm to use for the grayscale to binary transformation.
   * The difference is how to get to a threshold value T
   * which results in a bit value R = L <= T.
   *
   * - `"LocalAverage"`
   *
   *   T = average of neighboring pixels for matrix and GlobalHistogram for linear
   *
   * - `"GlobalHistogram"`
   *
   *   T = valley between the 2 largest peaks in the histogram (per line in linear case)
   *
   * - `"FixedThreshold"`
   *
   *   T = 127
   *
   * - `"BoolCast"`
   *
   *   T = 0, fastest possible
   *
   * @defaultValue `"LocalAverage"`
   */
  binarizer?: Binarizer;
  /**
   * Specify whether to ignore, read or require EAN-2 / 5 add-on symbols while scanning EAN / UPC codes.
   *
   * - `"Ignore"`
   *
   *   Ignore any Add-On symbol during read / scan
   *
   * - `"Read"`
   *
   *   Read EAN-2 / EAN-5 Add-On symbol if found
   *
   * - `"Require"`
   *
   *   Require EAN-2 / EAN-5 Add-On symbol to be present
   *
   * @defaultValue `"Read"`
   */
  eanAddOnSymbol?: EanAddOnSymbol;
  /**
   * Specifies the `TextMode` that controls the result of {@link ReadResult.text | `ReadResult.text`}.
   *
   * - `"Plain"`
   *
   *   {@link ReadResult.bytes | `ReadResult.bytes`} transcoded to unicode based on ECI info or guessed character set
   *
   * - `"ECI"`
   *
   *   Standard content following the ECI protocol with every character set ECI segment transcoded to unicode
   *
   * - `"HRI"`
   *
   *   Human Readable Interpretation (dependent on the ContentType)
   *
   * - `"Hex"`
   *
   *   {@link ReadResult.bytes | `ReadResult.bytes`} transcoded to ASCII string of HEX values
   *
   * - `"Escaped"`
   *
   *   Escape non-graphical characters in angle brackets (e.g. ASCII `29` will be transcoded to `"<GS>"`)
   *
   * @defaultValue `"Plain"`
   */
  textMode?: TextMode;
  /**
   * Character set to use (when applicable).
   * If this is set to `"Unknown"`, auto-detecting will be used.
   *
   * @defaultValue `"Unknown"`
   */
  characterSet?: CharacterSet;
}

export const defaultDecodeHints: Required<DecodeHints> = {
  formats: [],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  binarizer: "LocalAverage",
  isPure: false,
  downscaleFactor: 3,
  downscaleThreshold: 500,
  minLineCount: 2,
  maxNumberOfSymbols: 255,
  tryCode39ExtendedMode: false,
  validateCode39CheckSum: false,
  validateITFCheckSum: false,
  returnCodabarStartEnd: false,
  returnErrors: false,
  eanAddOnSymbol: "Read",
  textMode: "Plain",
  characterSet: "Unknown",
};

export function decodeHintsToZXingDecodeHints<T extends "reader" | "full">(
  zxingModule: ZXingModule<T>,
  decodeHints: Required<DecodeHints>,
): ZXingDecodeHints {
  return {
    ...decodeHints,
    formats: formatsToString(decodeHints.formats),
    binarizer: binarizerToZXingEnum(zxingModule, decodeHints.binarizer),
    eanAddOnSymbol: eanAddOnSymbolToZXingEnum(
      zxingModule,
      decodeHints.eanAddOnSymbol,
    ),
    textMode: textModeToZXingEnum(zxingModule, decodeHints.textMode),
    characterSet: characterSetToZXingEnum(
      zxingModule,
      decodeHints.characterSet,
    ),
  };
}
