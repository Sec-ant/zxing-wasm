/**
 * @internal
 */
export interface ZXingWriteResult {
  image: Uint8Array;
  /**
   * Encoding error.
   * If there's no error, this will be an empty string `""`.
   *
   * @see {@link WriteResult.error | `WriteResult.error`}
   */
  error: string;
  delete: () => void;
}

export interface WriteResult
  extends Omit<ZXingWriteResult, "image" | "delete"> {
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
): WriteResult {
  const { image, error } = zxingWriteResult;
  if (image) {
    return {
      image: new Blob([new Uint8Array(image)], {
        type: "image/png",
      }),
      error: "",
    };
  }
  return {
    image: null,
    error: error,
  };
}
