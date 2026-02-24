import { encodeFormats, type ReadInputBarcodeFormat } from "./barcodeFormat.js";
import { type Binarizer, encodeBinarizer } from "./binarizer.js";
import { type CharacterSet, encodeCharacterSet } from "./characterSet.js";
import { type EanAddOnSymbol, encodeEanAddOnSymbol } from "./eanAddOnSymbol.js";
import { encodeTextMode, type TextMode } from "./textMode.js";

/**
 * @internal
 */
export interface ZXingReaderOptions {
  /**
   * @internal
   */
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
   * @defaultValue `500`
   * @remarks Internally represented as an unsigned 16-bit integer (`0..65535`).
   * @see {@link tryDownscale | `tryDownscale`} {@link downscaleFactor | `downscaleFactor`}
   */
  downscaleThreshold: number;
  /**
   * Scale factor to use during downscaling, meaningful values are `2`, `3` and `4`.
   *
   * @defaultValue `3`
   * @remarks Internally represented as an unsigned 8-bit integer (`0..255`).
   * @see {@link tryDownscale | `tryDownscale`} {@link downscaleThreshold | `downscaleThreshold`}
   */
  downscaleFactor: number;
  /**
   * The number of scan lines in a linear barcode that have to be equal to accept the result.
   *
   * @defaultValue `2`
   * @remarks Internally represented as an unsigned 8-bit integer (`0..255`).
   */
  minLineCount: number;
  /**
   * The maximum number of symbols / barcodes to detect / look for in the image.
   *
   * Use `0` to remove the limit. Otherwise the effective range is `1..255`.
   *
   * @defaultValue `255`
   * @remarks Internally represented as an unsigned 8-bit integer (`0..255`).
   */
  maxNumberOfSymbols: number;
  /**
   * Validate optional checksums where applicable (e.g. Code39, ITF).
   *
   * @defaultValue `false`
   */
  validateOptionalChecksum: boolean;
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

  // ---- deprecated fields ----

  /**
   * Enable the heuristic to detect and decode "full ASCII" / extended Code39 symbols.
   *
   * @defaultValue `true`
   *
   * @deprecated This option no longer has any effect and is kept only for backward compatibility.
   * Use `Code39Ext` or `Code39Std` to select full ASCII or standard Code39 mode.
   */
  tryCode39ExtendedMode: boolean;
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
   * Accepted values are derived from `barcodeFormat.ts` (`BCF`) and include:
   * - canonical format names (e.g. `"QRCode"`, `"Code128"`),
   * - meta format names (e.g. `"All"`, `"AllLinear"`),
   * - human-readable labels from the table (e.g. `"QR Code"`, `"Code 128"`),
   * - backward-compatible aliases (e.g. `"Linear-Codes"`, `"Matrix-Codes"`, `"Any"`, `"DataBarExpanded"`, `"DataBarLimited"`, `"rMQRCode"`).
   *
   * @remarks Values are normalized by {@link encodeFormats | `encodeFormats`} before being sent to C++.
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
   * - `"HexECI"`
   *
   *   {@link ReadResult.bytesECI | `ReadResult.bytesECI`} transcoded to ASCII string of HEX values
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

export const defaultReaderOptions: Required<ReaderOptions> & ReaderOptions = {
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
  validateOptionalChecksum: false,
  returnErrors: false,
  eanAddOnSymbol: "Ignore",
  textMode: "HRI",
  characterSet: "Unknown",
  tryCode39ExtendedMode: true,
};

/**
 * Converts ReaderOptions to ZXingReaderOptions format.
 *
 * @param readerOptions - The complete set of reader options to be converted
 * @returns A ZXingReaderOptions object with encoded values for formats, binarizer,
 *          EAN add-on symbol, text mode, and character set
 */
export function readerOptionsToZXingReaderOptions(
  readerOptions: Required<Omit<ReaderOptions, "tryCode39ExtendedMode">> &
    ReaderOptions,
): ZXingReaderOptions {
  return {
    ...readerOptions,
    formats: encodeFormats(readerOptions.formats),
    binarizer: encodeBinarizer(readerOptions.binarizer),
    eanAddOnSymbol: encodeEanAddOnSymbol(readerOptions.eanAddOnSymbol),
    textMode: encodeTextMode(readerOptions.textMode),
    characterSet: encodeCharacterSet(readerOptions.characterSet),
    tryCode39ExtendedMode: readerOptions.tryCode39ExtendedMode ?? true,
  };
}
