import { ReadOutputBarcodeFormat, formatFromString } from "./barcodeFormat.js";
import { ReadOutputEccLevel } from "./eccLevel.js";
import { ContentType, zxingEnumToContentType } from "./contentType.js";
import { ZXingPosition, Position } from "./position.js";
import { ZXingEnum } from "./enum.js";

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
   * @see {@link DecodeHints.returnErrors | `DecodeHints.returnErrors`}
   */
  error: string;
  format: string;
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
   * accoring to specified {@link DecodeHints.textMode | `DecodeHints.textMode`}.
   */
  text: string;
  eccLevel: string;
  contentType: ZXingEnum;
  /**
   * Whether or not an ECI tag was found.
   */
  hasECI: boolean;
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
   * @see {@link DecodeHints.tryInvert | `DecodeHints.tryInvert`}
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
   * The 0-based index of this symbol in a structured append sequence.
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
   * Number of lines have been detected with this code (applies only to linear symbologies).
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
}

export interface ReadResult
  extends Omit<
    ZXingReadResult,
    "format" | "eccLevel" | "contentType" | "position"
  > {
  /**
   * Format of the barcode, should be one of {@link ReadOutputBarcodeFormat | `ReadOutputBarcodeFormat`}.
   *
   * Possible values are:
   * `"Aztec"`, `"Codabar"`, `"Code128"`, `"Code39"`, `"Code93"`,
   * `"DataBar"`, `"DataBarExpanded"`, `"DataMatrix"`,
   * `"EAN-13"`, `"EAN-8"`, `"ITF"`,
   * `"MaxiCode"`, `"MicroQRCode"`, `"None"`,
   * `"PDF417"`, `"QRCode"`, `"rMQRCode"`, `"UPC-A"`, `"UPC-E"`
   */
  format: ReadOutputBarcodeFormat;
  /**
   * Error correction level of the symbol (empty string if not applicable).
   *
   * This property may be renamed to `ecLevel` in the future.
   */
  eccLevel: ReadOutputEccLevel;
  /**
   * A hint to the type of the content found.
   */
  contentType: ContentType;
  /**
   * Position of the detected barcode.
   */
  position: Position;
}

export function zxingReadResultToReadResult(
  zxingReadResult: ZXingReadResult,
): ReadResult {
  return {
    ...zxingReadResult,
    format: formatFromString(zxingReadResult.format) as ReadOutputBarcodeFormat,
    eccLevel: zxingReadResult.eccLevel as ReadOutputEccLevel,
    contentType: zxingEnumToContentType(zxingReadResult.contentType),
  };
}
