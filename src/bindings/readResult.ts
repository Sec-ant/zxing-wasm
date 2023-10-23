import { ReadOutputBarcodeFormat, formatFromString } from "./barcodeFormat.js";
import { ReadOutputEccLevel } from "./eccLevel.js";

export interface ReadResult
  extends Omit<ZXingReadResult, "format" | "eccLevel"> {
  format: ReadOutputBarcodeFormat;
  eccLevel: ReadOutputEccLevel;
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
