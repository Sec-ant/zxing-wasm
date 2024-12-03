import type { WriteInputBarcodeFormat } from "./barcodeFormat.js";

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
  ecLevel: string;
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
  widthHRT: boolean;
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
   * TODO: TBD
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
}

export const defaultWriterOptions: Required<WriterOptions> = {
  format: "QRCode",
  readerInit: false,
  forceSquareDataMatrix: false,
  ecLevel: "",
  scale: 0,
  sizeHint: 0,
  rotate: 0,
  widthHRT: false,
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
