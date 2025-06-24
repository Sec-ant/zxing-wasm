import { encodeFormat, type WriteInputBarcodeFormat } from "./barcodeFormat.js";
import type { EcLevel } from "./ecLevel.js";

/**
 * @internal
 */
export interface ZXingWriterOptions {
  /**
   * @internal
   */
  format: number;
  /**
   * Set if this is the reader initialisation / programming symbol.
   *
   * @see {@link ReadResult.readerInit | `ReadResult.readerInit`}
   * @defaultValue `false`
   */
  readerInit: boolean;
  /**
   * Force the Data Matrix to be square.
   * @defaultValue `false`
   */
  forceSquareDataMatrix: boolean;
  /**
   * The error correction level of the symbol (empty string if not applicable)
   *
   * @see {@link ReadResult.ecLevel | `ReadResult.ecLevel`}
   * @defaultValue `""`
   */
  ecLevel: EcLevel;
  /**
   * The scale of the barcode. `0` means unset.
   *
   * @defaultValue `0`
   */
  scale: number;
  /**
   * A size hint to determine the scale of the barcode. `0` means unset.
   *
   * This only takes effect if `scale` is unset.
   *
   * @defaultValue `0`
   */
  sizeHint: number;
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
  withHRT: boolean;
  /**
   * Add compliant quiet zones to the barcode.
   *
   * `EAN-13`, `ITF`, `UPC-A` and `UPC-E` have compliant quiet zones added by default.
   *
   * @defaultValue `true`
   */
  withQuietZones: boolean;
  /**
   * Comma separated list of symbology specific options and flags.
   *
   * This string is parsed by the underlying C++ library to extract named parameters.
   * For boolean flags, include the name (e.g., `"gs1"`).
   * For options with values, use a `key=value` format (e.g., `"version=5"`).
   * Multiple options can be combined, separated by commas (e.g., `"gs1,version=2"`).
   *
   * Known keys used by `CreatorOptions` in the C++ backend:
   * - `gs1`: (boolean) Enables GS1 encoding.
   * - `stacked`: (boolean) Specifies if the barcode is a stacked type.
   * - `version`: (integer) Sets the symbol version (e.g., for QR Code).
   * - `dataMask`: (integer) Sets the data mask pattern (e.g., for QR Code).
   *
   * @experimental The final form of this property is not yet settled and may change without a major version bump.
   * @defaultValue `""`
   */
  options: string;
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
}

export const defaultWriterOptions: Required<WriterOptions> = {
  format: "QRCode",
  readerInit: false,
  forceSquareDataMatrix: false,
  ecLevel: "",
  scale: 0,
  sizeHint: 0,
  rotate: 0,
  withHRT: false,
  withQuietZones: true,
  options: "",
};

/**
 * Converts WriterOptions to ZXingWriterOptions format.
 *
 * @param writerOptions - The required writer options to be converted
 * @returns A ZXingWriterOptions object with the encoded format
 */
export function writerOptionsToZXingWriterOptions(
  writerOptions: Required<WriterOptions>,
): ZXingWriterOptions {
  return {
    ...writerOptions,
    format: encodeFormat(writerOptions.format),
  };
}
