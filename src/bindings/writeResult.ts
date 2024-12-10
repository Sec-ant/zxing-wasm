/**
 * @internal
 */
export interface ZXingWriteResult {
  svg: string;
  utf8: string;
  image?: Uint8Array;
  /**
   * Encoding error.
   * If there's no error, this will be an empty string `""`.
   *
   * @see {@link WriteResult.error | `WriteResult.error`}
   */
  error: string;
}

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
