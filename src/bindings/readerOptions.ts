import { type ReadInputBarcodeFormat, encodeFormats } from "./barcodeFormat.js";
import { type Binarizer, encodeBinarizer } from "./binarizer.js";
import { type CharacterSet, encodeCharacterSet } from "./characterSet.js";
import { type EanAddOnSymbol, encodeEanAddOnSymbol } from "./eanAddOnSymbol.js";
import { type TextMode, encodeTextMode } from "./textMode.js";

/**
 * @internal
 */
export interface ZXingReaderOptions {
  /**
   * @internal
   */
  formats: number;
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
  /**
   * Try detecting code after denoising (currently morphological closing filter for 2D symbologies only).
   *
   * @experimental
   * @defaultValue `false`
   */
  tryDenoise: boolean;
  /**
   * @internal
   */
  binarizer: number;
  /**
   * Set to `true` if the input contains nothing but a single perfectly aligned barcode (usually generated images).
   *
   * @defaultValue `false`
   */
  isPure: boolean;
  /**
   * Image size `min(width, height)` threshold at which to start downscaled scanning.
   *
   * **WARNING**: this API is experimental and may change / disappear
   *
   * @experimental
   * @defaultValue `500`
   * @see {@link tryDownscale | `tryDownscale`} {@link downscaleFactor | `downscaleFactor`}
   */
  downscaleThreshold: number;
  /**
   * Scale factor to use during downscaling, meaningful values are `2`, `3` and `4`.
   *
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
   * Enable the heuristic to detect and decode "full ASCII" / extended Code39 symbols.
   *
   * @defaultValue `true`
   */
  tryCode39ExtendedMode: boolean;
  /**
   * If `true`, return the barcodes with errors as well (e.g. checksum errors).
   *
   * @defaultValue `false`
   * @see {@link ReadResult.error | `ReadResult.error`}
   */
  returnErrors: boolean;
  /**
   * @internal
   */
  eanAddOnSymbol: number;
  /**
   * @internal
   */
  textMode: number;
  /**
   * @internal
   */
  characterSet: number;
}

/**
 * Reader options for reading barcodes.
 */
export interface ReaderOptions
  extends Partial<
    Omit<
      ZXingReaderOptions,
      "formats" | "binarizer" | "eanAddOnSymbol" | "textMode" | "characterSet"
    >
  > {
  /**
   * A set of {@link ReadInputBarcodeFormat | `ReadInputBarcodeFormat`}s that should be searched for.
   * An empty list `[]` indicates all supported formats.
   *
   * Supported values in this list are:
   * `"Aztec"`, `"Codabar"`, `"Code39"`, `"Code93"`, `"Code128"`,
   * `"DataBar"`, `"DataBarExpanded"`, `"DataBarLimited"`, `"DataMatrix"`, `"DXFilmEdge"`,
   * `"EAN-8"`, `"EAN-13"`, `"ITF"`, `"MaxiCode"`, `"MicroQRCode"`, `"PDF417"`,
   * `"QRCode"`, `"rMQRCode"`, `"UPC-A"`, `"UPC-E"`,
   * `"Linear-Codes"`, `"Matrix-Codes"`, `Any`
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
   *   T = average of neighboring pixels for matrix and GlobalHistogram for linear (HybridBinarizer)
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
   * @defaultValue `"Ignore"`
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
   * @defaultValue `"HRI"`
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

export const defaultReaderOptions: Required<ReaderOptions> = {
  formats: [],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  tryDenoise: false,
  binarizer: "LocalAverage",
  isPure: false,
  downscaleFactor: 3,
  downscaleThreshold: 500,
  minLineCount: 2,
  maxNumberOfSymbols: 255,
  tryCode39ExtendedMode: true,
  returnErrors: false,
  eanAddOnSymbol: "Ignore",
  textMode: "HRI",
  characterSet: "Unknown",
};

/**
 * Converts ReaderOptions to ZXingReaderOptions format.
 *
 * @param readerOptions - The complete set of reader options to be converted
 * @returns A ZXingReaderOptions object with encoded values for formats, binarizer,
 *          EAN add-on symbol, text mode, and character set
 */
export function readerOptionsToZXingReaderOptions(
  readerOptions: Required<ReaderOptions>,
): ZXingReaderOptions {
  return {
    ...readerOptions,
    formats: encodeFormats(readerOptions.formats),
    binarizer: encodeBinarizer(readerOptions.binarizer),
    eanAddOnSymbol: encodeEanAddOnSymbol(readerOptions.eanAddOnSymbol),
    textMode: encodeTextMode(readerOptions.textMode),
    characterSet: encodeCharacterSet(readerOptions.characterSet),
  };
}
