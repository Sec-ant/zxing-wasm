import { type ReadOutputBarcodeFormat, decodeFormat } from "./barcodeFormat.js";
import type { BarcodeSymbol } from "./barcodeSymbol.js";
import { type ContentType, decodeContentType } from "./contentType.js";
import type { EcLevel } from "./ecLevel.js";
import type { Position, ZXingPosition } from "./position.js";

/**
 * @internal
 */
export interface ZXingReadResult {
  /**
   * Whether the barcode is valid.
   */
  isValid: boolean;
  /**
   * Error message (if any).
   *
   * @see {@link ReaderOptions.returnErrors | `ReaderOptions.returnErrors`}
   */
  error: string;
  /**
   * @internal
   */
  format: number;
  /**
   * Raw / Standard content without any modifications like character set conversions.
   */
  bytes: Uint8Array;
  /**
   * Raw / Standard content following the ECI protocol.
   */
  bytesECI: Uint8Array;
  /**
   * The {@link ReadResult.bytes | `ReadResult.bytes`} content rendered to unicode / utf8 text
   * accoring to specified {@link ReaderOptions.textMode | `ReaderOptions.textMode`}.
   */
  text: string;
  /**
   * Error correction level of the symbol (empty string if not applicable).
   */
  ecLevel: EcLevel;
  /**
   * @internal
   */
  contentType: number;
  /**
   * Whether or not an ECI tag was found.
   */
  hasECI: boolean;
  /**
   * @internal
   */
  position: ZXingPosition;
  /**
   * Orientation of the barcode in degree.
   */
  orientation: number;
  /**
   * Whether the symbol is mirrored (currently only supported by QRCode and DataMatrix).
   */
  isMirrored: boolean;
  /**
   * Whether the symbol is inverted / has reveresed reflectance.
   *
   * @see {@link ReaderOptions.tryInvert | `ReaderOptions.tryInvert`}
   */
  isInverted: boolean;
  /**
   * Symbology identifier `"]cm"` where `"c"` is the symbology code character, `"m"` the modifier.
   */
  symbologyIdentifier: string;
  /**
   * Number of symbols in a structured append sequence.
   *
   * If this is not part of a structured append sequence, the returned value is `-1`.
   * If it is a structured append symbol but the total number of symbols is unknown, the
   * returned value is `0` (see PDF417 if optional "Segment Count" not given).
   */
  sequenceSize: number;
  /**
   * The `0`-based index of this symbol in a structured append sequence.
   */
  sequenceIndex: number;
  /**
   * ID to check if a set of symbols belongs to the same structured append sequence.
   *
   * If the symbology does not support this feature, the returned value is empty (see MaxiCode).
   * For QR Code, this is the parity integer converted to a string.
   * For PDF417 and DataMatrix, this is the `"fileId"`.
   */
  sequenceId: string;
  /**
   * Set if this is the reader initialisation / programming symbol.
   */
  readerInit: boolean;
  /**
   * Number of lines that have been detected with this code (applies only to linear symbologies).
   */
  lineCount: number;
  /**
   * QRCode / DataMatrix / Aztec version or size.
   *
   * This property will be removed in the future.
   *
   * @deprecated
   */
  version: string;
  /**
   * Barcode symbol in the shape of a one-channel image.
   */
  symbol: BarcodeSymbol;
}

/**
 * Result of reading a barcode.
 */
export interface ReadResult
  extends Omit<ZXingReadResult, "format" | "contentType" | "position"> {
  /**
   * Format of the barcode, should be one of {@link ReadOutputBarcodeFormat | `ReadOutputBarcodeFormat`}.
   *
   * Possible values are:
   * `"Aztec"`, `"Codabar"`, `"Code39"`, `"Code93"`, `"Code128"`,
   * `"DataBar"`, `"DataBarExpanded"`, `"DataBarLimited"`, `"DataMatrix"`, `"DXFilmEdge"`,
   * `"EAN-8"`, `"EAN-13"`, `"ITF"`, `"MaxiCode"`, `"MicroQRCode"`, `"PDF417"`,
   * `"QRCode"`, `"rMQRCode"`, `"UPC-A"`, `"UPC-E"`,
   * `"None"`
   */
  format: ReadOutputBarcodeFormat;
  /**
   * A hint to the type of the content found.
   */
  contentType: ContentType;
  /**
   * Position of the detected barcode.
   */
  position: Position;
  /**
   * @deprecated Use {@link ReadResult.ecLevel | `ReadResult.ecLevel`} instead.
   */
  eccLevel: EcLevel;
}

/**
 * Converts a ZXing read result to a standardized read result format.
 *
 * @param zxingReadResult - The raw result from ZXing barcode reader
 * @returns A normalized read result with decoded format and content type
 */
export function zxingReadResultToReadResult(
  zxingReadResult: ZXingReadResult,
): ReadResult {
  return {
    ...zxingReadResult,
    format: decodeFormat(zxingReadResult.format),
    contentType: decodeContentType(zxingReadResult.contentType),
    eccLevel: zxingReadResult.ecLevel,
  };
}
