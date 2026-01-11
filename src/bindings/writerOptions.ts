import { encodeFormat, type WriteInputBarcodeFormat } from "./barcodeFormat.js";
import type { EcLevel } from "./ecLevel.js";

/**
 * @internal
 * Internal interface matching the C++ JsWriterOptions struct (new API only)
 */
export interface ZXingWriterOptions {
  /**
   * @internal
   */
  format: number;

  /**
   * Comma separated list of symbology specific options and flags.
   *
   * This string is parsed by the underlying C++ library to extract named parameters.
   * For boolean flags, include the name (e.g., `"gs1"`).
   * For options with values, use a `key=value` format (e.g., `"version=5"`).
   * Multiple options can be combined, separated by commas (e.g., `"gs1,version=2"`).
   *
   * Known keys:
   * - `ecLevel`: (string) Error correction level, e.g., `"30%"`. See also libzint doc.
   * - `eci`: (string) Specify ECI designator to use.
   * - `gs1`: (boolean) Enables GS1 encoding.
   * - `readerInit`: (boolean) Set the "reader init" flag.
   * - `stacked`: (boolean) Generates a stacked version for DataBar / DataBarExpanded.
   * - `forceSquare`: (boolean) Only consider square symbol versions (DataMatrix only).
   * - `columns`: (integer) Specify number of columns (e.g., for DataBarExpanded, PDF417).
   * - `rows`: (integer) Specify number of rows (e.g., for DataBarExpanded, PDF417).
   * - `version`: (integer) Specifies the version / size of most 2D symbols.
   * - `dataMask`: (integer) Specifies the data mask pattern for QRCode / MicroQRCode.
   *
   * @defaultValue `""`
   */
  options: string;

  /**
   * The scale of the barcode. `0` means unset.
   *
   * Positive values specify the module size directly.
   * Negative values specify a size hint to auto-fit the barcode to approximately `abs(scale)` pixels.
   *
   * @defaultValue `0`
   */
  scale: number;

  /**
   * The rotation of the barcode in degrees.
   * Valid values are `0`, `90`, `180` and `270`.
   *
   * @defaultValue `0`
   */
  rotate: number;

  /**
   * Include human readable text (HRT) in the barcode.
   *
   * @defaultValue `false`
   */
  addHRT: boolean;

  /**
   * Add compliant quiet zones to the barcode.
   *
   * `EAN-13`, `ITF`, `UPC-A` and `UPC-E` have compliant quiet zones added by default.
   *
   * @defaultValue `true`
   */
  addQuietZones: boolean;

  /**
   * Invert the colors of the barcode (swap black and white).
   *
   * @defaultValue `false`
   */
  invert: boolean;
}

/**
 * Writer options for writing barcodes.
 */
export interface WriterOptions
  extends Partial<Omit<ZXingWriterOptions, "format">> {
  /**
   * The format of the barcode to write.
   *
   * Supported values are:
   * `"Aztec"`, `"Codabar"`, `"Code39"`, `"Code93"`, `"Code128"`,
   * `"DataBar"`, `"DataBarExpanded"`, `"DataBarLimited"`, `"DataMatrix"`, `"DXFilmEdge"`,
   * `"EAN-8"`, `"EAN-13"`, `"ITF"`, `"MaxiCode"`, `"MicroQRCode"`, `"PDF417"`,
   * `"QRCode"`, `"rMQRCode"`, `"UPC-A"`, `"UPC-E"`
   *
   * @defaultValue `"QRCode"`
   */
  format?: WriteInputBarcodeFormat;

  /**
   * Set if this is the reader initialisation / programming symbol.
   *
   * @see {@link ReadResult.readerInit | `ReadResult.readerInit`}
   * @defaultValue `false`
   * @deprecated Use `options` with `readerInit` key instead.
   */
  readerInit?: boolean;

  /**
   * Force the Data Matrix to be square.
   * @defaultValue `false`
   * @deprecated Use `options` with `forceSquare` key instead.
   */
  forceSquareDataMatrix?: boolean;

  /**
   * The error correction level of the symbol (empty string if not applicable)
   *
   * @see {@link ReadResult.ecLevel | `ReadResult.ecLevel`}
   * @defaultValue `""`
   * @deprecated Use `options` with `ecLevel` key instead.
   */
  ecLevel?: EcLevel;

  /**
   * A size hint to determine the scale of the barcode. `0` means unset.
   *
   * This only takes effect if `scale` is unset or `0`.
   *
   * @defaultValue `0`
   * @deprecated Use negative `scale` value instead. For example, `sizeHint: 200` is equivalent to `scale: -200`.
   */
  sizeHint?: number;

  /**
   * Include human readable text (HRT) in the barcode.
   *
   * @defaultValue `false`
   * @deprecated Use {@link WriterOptions.addHRT | `addHRT`} instead.
   */
  withHRT?: boolean;

  /**
   * Add compliant quiet zones to the barcode.
   *
   * `EAN-13`, `ITF`, `UPC-A` and `UPC-E` have compliant quiet zones added by default.
   *
   * @defaultValue `true`
   * @deprecated Use {@link WriterOptions.addQuietZones | `addQuietZones`} instead.
   */
  withQuietZones?: boolean;
}

export const defaultWriterOptions: Omit<
  Required<WriterOptions>,
  "addHRT" | "addQuietZones"
> = {
  format: "QRCode",
  readerInit: false,
  forceSquareDataMatrix: false,
  ecLevel: "",
  scale: 0,
  sizeHint: 0,
  rotate: 0,
  withHRT: false,
  withQuietZones: true,
  invert: false,
  options: "",
};

/**
 * Builds the options string for CreatorOptions from WriterOptions.
 * Handles backward compatibility for readerInit, ecLevel, and forceSquareDataMatrix.
 */
function buildOptionsString(
  writerOptions: Pick<
    WriterOptions,
    "options" | "readerInit" | "ecLevel" | "forceSquareDataMatrix"
  > & { options: string },
): string {
  const parts: string[] = [];

  // Start with user-provided options string
  if (writerOptions.options) {
    parts.push(writerOptions.options);
  }

  // Append readerInit if true and not already in options
  if (
    writerOptions.readerInit &&
    !writerOptions.options.toLowerCase().includes("readerinit")
  ) {
    parts.push("readerInit");
  }

  // Append ecLevel if not empty and not already in options
  if (
    writerOptions.ecLevel &&
    !writerOptions.options.toLowerCase().includes("eclevel")
  ) {
    parts.push(`ecLevel=${writerOptions.ecLevel}`);
  }

  // Handle deprecated forceSquareDataMatrix
  if (
    writerOptions.forceSquareDataMatrix &&
    !writerOptions.options.toLowerCase().includes("forcesquare")
  ) {
    parts.push("forceSquare");
  }

  return parts.join(",");
}

/**
 * Converts WriterOptions to ZXingWriterOptions format.
 * Handles backward compatibility for deprecated options.
 *
 * @param writerOptions - The writer options to be converted (merged with defaults)
 * @returns A ZXingWriterOptions object for the C++ layer
 */
export function writerOptionsToZXingWriterOptions(
  writerOptions: Omit<Required<WriterOptions>, "addHRT" | "addQuietZones"> &
    Pick<Partial<WriterOptions>, "addHRT" | "addQuietZones">,
): ZXingWriterOptions {
  // Handle scale: if sizeHint is set and scale is 0, use negative sizeHint for auto-fit
  let effectiveScale = writerOptions.scale;
  if (effectiveScale === 0 && writerOptions.sizeHint > 0) {
    effectiveScale = -writerOptions.sizeHint;
  }

  // Prefer new API (addHRT/addQuietZones) if explicitly set, otherwise fall back to deprecated
  // Use ?? to check if new API was provided, only fall back to old API if undefined
  const addHRT = writerOptions.addHRT ?? writerOptions.withHRT;
  const addQuietZones =
    writerOptions.addQuietZones ?? writerOptions.withQuietZones;

  return {
    format: encodeFormat(writerOptions.format),
    options: buildOptionsString(writerOptions),
    scale: effectiveScale,
    rotate: writerOptions.rotate,
    addHRT,
    addQuietZones,
    invert: writerOptions.invert,
  };
}
