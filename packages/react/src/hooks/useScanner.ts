import { isEqual } from "es-toolkit";
import { type RefCallback, useCallback, useEffect, useRef } from "react";
import { useCustomCompareEffect } from "use-custom-compare";
import type { ReaderOptions, ReadResult, readBarcodes } from "zxing-wasm";
import type { RequestData, ResponseData } from "../types";
import { createCanvas } from "../utils/createCanvas";
import { isHTMLCanvasElement } from "../utils/isHTMLCanvasElement";
import { isHTMLImageElement } from "../utils/isHTMLImageElement";
import { isHTMLVideoElement } from "../utils/isHTMLVideoElement";
import ReaderWorker from "../workers/reader.js?worker";

export type ReadBarcodesRequestData = RequestData<typeof readBarcodes>;

export type ReadBarcodesResponseData = ResponseData<
  Awaited<ReturnType<typeof readBarcodes>>
>;

export interface UseScannerOptions {
  readerOptions?: ReaderOptions;
  onScanResponse?: (readResults: ReadResult[]) => void;
  onScanError?: <T>(error: T) => void;
}

export function useScanner({
  readerOptions,
  onScanResponse,
  onScanError,
}: UseScannerOptions) {
  const readerWorkerRef = useRef(new ReaderWorker());

  useEffect(() => {
    return () => {
      readerWorkerRef.current.terminate();
    };
  }, []);

  const readerOptionsRef = useRef(readerOptions);

  /**
   * Update reader options reference when they change (using deep comparison to avoid
   * unnecessary updates)
   *
   * This ensures that the latest reader options are used during the scanning process
   * without causing unnecessary re-renders or effect executions.
   */
  useCustomCompareEffect(
    () => {
      readerOptionsRef.current = readerOptions;
    },
    [readerOptions],
    isEqual,
  );

  const getImageElementFrameRequestCallback = useCallback<
    (
      imageEl: HTMLImageElement,
      byoc: HTMLCanvasElement | OffscreenCanvas,
    ) => FrameRequestCallback
  >(
    (imageEl, byoc) => (_timestamp) => {
      byoc.width = imageEl.naturalWidth;
      byoc.height = imageEl.naturalHeight;

      if (byoc.width === 0 || byoc.height === 0) {
        // Image not loaded yet, try again on the next frame
        requestAnimationFrame(
          getImageElementFrameRequestCallback(imageEl, byoc),
        );
        return;
      }

      const ctx = byoc.getContext("2d", {
        willReadFrequently: true,
      });

      if (!ctx) {
        onScanError?.(
          new DOMException(
            "Failed to get the context from the canvas element.",
            "InvalidStateError",
          ),
        );
        return;
      }

      ctx.drawImage(imageEl, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, byoc.width, byoc.height);

        readerWorkerRef.current.postMessage(
          {
            // id: idRef.current,
            parameters: [imageData, readerOptionsRef.current],
          } satisfies ReadBarcodesRequestData,
          {
            transfer: [imageData.data.buffer],
          },
        );

        requestAnimationFrame(
          getImageElementFrameRequestCallback(imageEl, byoc),
        );
      } catch (e) {
        onScanError?.(e);
        return;
      }
    },
    [],
  );

  const getVideoElementFrameRequestCallback = useCallback<
    (
      videoEl: HTMLVideoElement,
      byoc: HTMLCanvasElement | OffscreenCanvas,
    ) => FrameRequestCallback
  >(
    (videoEl, byoc) => (_timestamp) => {
      byoc.width = videoEl.videoWidth;
      byoc.height = videoEl.videoHeight;

      if (byoc.width === 0 || byoc.height === 0) {
        // Video not ready yet, try again on the next frame
        requestAnimationFrame(
          getVideoElementFrameRequestCallback(videoEl, byoc),
        );
        return;
      }

      const ctx = byoc.getContext("2d", {
        willReadFrequently: true,
      });

      if (!ctx) {
        onScanError?.(
          new DOMException(
            "Failed to get the context from the canvas element.",
            "InvalidStateError",
          ),
        );
        return;
      }

      ctx.drawImage(videoEl, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, byoc.width, byoc.height);

        readerWorkerRef.current.postMessage(
          {
            // id: idRef.current,
            parameters: [imageData, readerOptionsRef.current],
          } satisfies ReadBarcodesRequestData,
          {
            transfer: [imageData.data.buffer],
          },
        );

        requestAnimationFrame(
          getVideoElementFrameRequestCallback(videoEl, byoc),
        );
      } catch (e) {
        onScanError?.(e);
        return;
      }
    },
    [],
  );

  /**
   * Scans the provided HTML element (image, video, or canvas) and sends the image data
   * to the reader worker for barcode reading.
   */
  const getCanvasElementFrameRequestCallback = useCallback<
    (canvasEl: HTMLCanvasElement) => FrameRequestCallback
  >(
    (canvasEl) => (_timestamp) => {
      const ctx = canvasEl.getContext("2d", {
        willReadFrequently: true,
      });

      if (!ctx) {
        onScanError?.(
          new DOMException(
            "Failed to get the context from the canvas element.",
            "InvalidStateError",
          ),
        );
        return;
      }

      try {
        const imageData = ctx.getImageData(
          0,
          0,
          canvasEl.width,
          canvasEl.height,
        );

        readerWorkerRef.current.postMessage(
          {
            // id: idRef.current,
            parameters: [imageData, readerOptionsRef.current],
          } satisfies ReadBarcodesRequestData,
          {
            transfer: [imageData.data.buffer],
          },
        );

        requestAnimationFrame(getCanvasElementFrameRequestCallback(canvasEl));
      } catch (e) {
        onScanError?.(e);
      }
    },
    [],
  );

  const frameRequestCallbackIdRef = useRef<number>(0);

  const ref = useCallback<
    RefCallback<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement>
  >((el) => {
    cancelAnimationFrame(frameRequestCallbackIdRef.current);
    if (el === null) {
      return;
    }
    if (isHTMLImageElement(el)) {
      const { naturalWidth, naturalHeight } = el;
      const byoc = createCanvas(naturalWidth, naturalHeight);
      frameRequestCallbackIdRef.current = requestAnimationFrame(
        getImageElementFrameRequestCallback(el, byoc),
      );
    } else if (isHTMLVideoElement(el)) {
      const { videoWidth, videoHeight } = el;
      const byoc = createCanvas(videoWidth, videoHeight);
      frameRequestCallbackIdRef.current = requestAnimationFrame(
        getVideoElementFrameRequestCallback(el, byoc),
      );
    } else if (isHTMLCanvasElement(el)) {
      frameRequestCallbackIdRef.current = requestAnimationFrame(
        getCanvasElementFrameRequestCallback(el),
      );
    } else {
      return;
    }
  }, []);

  useEffect(() => {
    readerWorkerRef.current.onmessage = ({
      data,
    }: MessageEvent<ReadBarcodesResponseData>) => {
      // // Ignore messages that are not from the current hook
      // if (data.id !== idRef.current) {
      //   return;
      // }
      if ("error" in data) {
        onScanError?.(data.error);
        return;
      }
      onScanResponse?.(data.return);
    };
  }, []);

  return ref;
}
