import { ReadOutputBarcodeFormat, formatFromString } from "./barcodeFormat.js";
import { ReadOutputEccLevel } from "./eccLevel.js";
import { ZXingContentType } from "./contentType.js";
import { ZXingPosition, Position } from "./position.js";

export interface ZXingReadResult {
  isValid: boolean;
  error: string;
  format: string;
  bytes: Uint8Array;
  bytesECI: Uint8Array;
  text: string;
  eccLevel: string;
  contentType: ZXingContentType;
  hasECI: boolean;
  position: ZXingPosition;
  orientation: number;
  isMirrored: boolean;
  isInverted: boolean;
  symbologyIdentifier: string;
  sequenceSize: number;
  sequenceIndex: number;
  sequenceId: string;
  readerInit: boolean;
  lineCount: number;
  version: string;
}

export interface ReadResult
  extends Omit<ZXingReadResult, "format" | "eccLevel" | "position"> {
  format: ReadOutputBarcodeFormat;
  eccLevel: ReadOutputEccLevel;
  position: Position;
}

export function zxingReadResultToReadResult(
  zxingReadResult: ZXingReadResult,
): ReadResult {
  return {
    ...zxingReadResult,
    format: formatFromString(zxingReadResult.format) as ReadOutputBarcodeFormat,
    eccLevel: zxingReadResult.eccLevel as ReadOutputEccLevel,
  };
}
