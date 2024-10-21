/**
 * @internal
 */
export interface ZXingWriteResult {
  /**
   * The encoded barcode as a scalable vector graphics (SVG) string.
   */
  svg: string;
  /**
   * The encoded barcode as a utf8 string, using " ", "▀", "▄", "█".
   */
  utf8: string;
  /**
   * @internal
   */
  image?: Uint8Array;
  /**
   * Encoding error.
   * If there's no error, this will be an empty string `""`.
   *
   * @see {@link WriteResult.error | `WriteResult.error`}
   */
  error: string;
}

/**
 * Result of writing a barcode.
 *
 * @experimental The final form of this API is not yet settled and may change.
 */
export interface WriteResult extends Omit<ZXingWriteResult, "image"> {
  /**
   * The encoded barcode as an image blob.
   * If some error happens, this will be `null`.
   *
   * @see {@link WriteResult.error | `WriteResult.error`}
   */
  image: Blob | null;
}

/**
 * Converts a ZXing write result to a standard write result format, handling image data conversion.
 *
 * @param zxingWriteResult - The ZXing write result object to convert
 * @returns A new write result object with the image converted to a Blob if present
 *
 * @remarks
 * The function creates a new object that spreads all properties from the input result,
 * but converts the image data from a Uint8Array to a PNG Blob when present.
 * If no image data exists, the image property will be null.
 */
export function zxingWriteResultToWriteResult(
  zxingWriteResult: ZXingWriteResult,
) {
  return {
    ...zxingWriteResult,
    image:
      (zxingWriteResult.image &&
        new Blob([new Uint8Array(zxingWriteResult.image)], {
          type: "image/png",
        })) ??
      null,
  };
}
