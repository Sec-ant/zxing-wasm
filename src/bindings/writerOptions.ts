import { type WriteInputBarcodeFormat, encodeFormat } from "./barcodeFormat.js";
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
   * TODO: TBD
   *
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
   * TODO: TBD
   *
   * @defaultValue `0`
   */
  scale: number;
  /**
   * TODO: TBD
   *
   * @defaultValue `0`
   */
  sizeHint: number;
  /**
   * TODO: TBD
   *
   * @defaultValue `0`
   */
  rotate: number;
  /**
   * TODO: TBD
   *
   * @defaultValue `false`
   */
  withHRT: boolean;
  /**
   * TODO: TBD
   *
   * @defaultValue `true`
   */
  withQuietZones: boolean;
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
   * `"DataBarExpanded"`, `"DataMatrix"`, `"EAN8"`, `"EAN13"`, `"ITF"`,
   * `"PDF417"`, `"QRCode"`, `"UPCA"`, `"UPCE"`, `"DataBarLimited"`
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
};

export function writerOptionsToZXingWriterOptions(
  writerOptions: Required<WriterOptions>,
): ZXingWriterOptions {
  return {
    ...writerOptions,
    format: encodeFormat(writerOptions.format),
  };
}
