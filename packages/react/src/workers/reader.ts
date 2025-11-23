import { readBarcodes } from "zxing-wasm/reader";
import type { RequestData, ResponseData } from "../types";

type ReadBarcodesResponseData = ResponseData<
  Awaited<ReturnType<typeof readBarcodes>>
>;

self.onmessage = async ({
  data: { parameters },
}: MessageEvent<RequestData<typeof readBarcodes>>) => {
  try {
    self.postMessage({
      return: await readBarcodes(...parameters),
    } satisfies ReadBarcodesResponseData);
  } catch (error) {
    self.postMessage({
      error,
    } satisfies ReadBarcodesResponseData);
  }
};
