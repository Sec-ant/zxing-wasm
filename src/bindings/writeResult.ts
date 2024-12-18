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
