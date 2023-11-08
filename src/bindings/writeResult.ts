/**
 * @internal
 */
export interface ZXingWriteResult {
  image: Uint8Array;
  error: string;
  delete: () => void;
}

export interface WriteResult
  extends Omit<ZXingWriteResult, "image" | "delete"> {
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
  } else {
    return {
      image: null,
      error: error,
    };
  }
}
