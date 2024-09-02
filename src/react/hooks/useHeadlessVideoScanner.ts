import { type RefCallback, useCallback, useEffect, useRef } from "react";
import {
  type VideoScanner,
  type VideoScannerOptions,
  createVideoScanner,
} from "../../scanner/index.js";

export interface UseHeadlessVideoScannerOptions extends VideoScannerOptions {
  /**
   * control the activation of scanning
   */
  scanning?: boolean;
}

export function useHeadlessVideoScanner({
  /**
   * scanner options
   */
  scanning = true,
  wasmLocation,
  readerOptions,
  scanThrottle,
  negativeDebounce,
  onScanDetect,
  onScanUpdate,
  onScanStart,
  onScanStop,
  onScanClose,
  onRepaint,
}: UseHeadlessVideoScannerOptions) {
  const videoScannerRef = useRef<VideoScanner | null>(null);

  useEffect(() => {
    if (scanning) {
      videoScannerRef.current?.start();
    } else {
      videoScannerRef.current?.stop();
    }
  }, [scanning]);

  const createVideoScannerRef = useRef((videoElement: HTMLVideoElement) =>
    createVideoScanner(videoElement, {
      wasmLocation,
      readerOptions,
      scanThrottle,
      negativeDebounce,
      onScanDetect,
      onScanUpdate,
      onScanStart,
      onScanStop,
      onScanClose,
      onRepaint,
    }),
  );

  const videoRefCallback = useCallback<RefCallback<HTMLVideoElement>>(
    (videoElement) => {
      if (videoElement !== null) {
        videoScannerRef.current = createVideoScannerRef.current(videoElement);
      } else {
        videoScannerRef.current?.close();
        videoScannerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    videoScannerRef.current?.setOptions({
      wasmLocation,
      readerOptions,
      scanThrottle,
      negativeDebounce,
      onScanDetect,
      onScanUpdate,
      onScanStart,
      onScanStop,
      onScanClose,
      onRepaint,
    });
  }, [
    wasmLocation,
    readerOptions,
    scanThrottle,
    negativeDebounce,
    onScanDetect,
    onScanUpdate,
    onScanStart,
    onScanStop,
    onScanClose,
    onRepaint,
  ]);

  return videoRefCallback;
}
