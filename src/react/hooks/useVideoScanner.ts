import { type RefCallback, useCallback, useRef } from "react";
import type { ReadResult } from "../../reader/index.js";
import {
  type UseHeadlessVideoScannerOptions,
  useHeadlessVideoScanner,
} from "./useHeadlessVideoScanner.js";

export interface UseVideoScannerOptions
  extends UseHeadlessVideoScannerOptions {}

export function useVideoScanner({
  onScanUpdate,
  onRepaint,
  ...restUseVideoScannerOptions
}: UseVideoScannerOptions) {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const scannerVideoRefCallback = useCallback<RefCallback<HTMLVideoElement>>(
    (videoElement) => {
      videoElementRef.current = videoElement;
    },
    [],
  );

  const overlayCanvasElementRef = useRef<HTMLCanvasElement | null>(null);

  const handleOverlayUpdate = useCallback(
    (() => {
      let context: CanvasRenderingContext2D | undefined = undefined;
      return (readResults: ReadResult[]) => {
        // check canvas ready state
        if (
          overlayCanvasElementRef.current === null ||
          videoElementRef.current === null
        ) {
          return;
        }
        // update canvas dimension
        const { videoWidth, videoHeight } = videoElementRef.current;
        if (context === undefined) {
          context = overlayCanvasElementRef.current.getContext("2d")!;
        }
        if (context.canvas.width !== videoWidth) {
          context.canvas.width = videoWidth;
        }
        if (context.canvas.height !== videoHeight) {
          context.canvas.height = videoHeight;
        }
        // draw overlay
        context.clearRect(0, 0, videoWidth, videoHeight);
        context.beginPath();

        context.moveTo(0, 0);
        context.lineTo(videoWidth, 0);
        context.lineTo(videoWidth, videoHeight);
        context.lineTo(0, videoHeight);
        context.closePath();

        for (const readResult of readResults) {
          if (readResult.isValid) {
            context.moveTo(
              readResult.position.topLeft.x,
              readResult.position.topLeft.y,
            );
            context.lineTo(
              readResult.position.bottomLeft.x,
              readResult.position.bottomLeft.y,
            );
            context.lineTo(
              readResult.position.bottomRight.x,
              readResult.position.bottomRight.y,
            );
            context.lineTo(
              readResult.position.topRight.x,
              readResult.position.topRight.y,
            );
            context.closePath();
          }
        }

        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fill();
        // context.clearRect(0, 0, videoWidth, videoHeight);
        // for (const readResult of readResults) {
        //   if (readResult.isValid) {
        //     context.strokeStyle = "#f00";
        //     context.lineWidth = 1;
        //     context.beginPath();
        //     context.moveTo(
        //       readResult.position.topLeft.x,
        //       readResult.position.topLeft.y,
        //     );
        //     context.lineTo(
        //       readResult.position.topRight.x,
        //       readResult.position.topRight.y,
        //     );
        //     context.lineTo(
        //       readResult.position.bottomRight.x,
        //       readResult.position.bottomRight.y,
        //     );
        //     context.lineTo(
        //       readResult.position.bottomLeft.x,
        //       readResult.position.bottomLeft.y,
        //     );
        //     context.closePath();
        //     context.stroke();
        //   }
        // }
      };
    })(),
    [],
  );

  const handleScanUpdate = useCallback(
    (readResults: ReadResult[]) => {
      handleOverlayUpdate(readResults);
      onScanUpdate?.(readResults);
    },
    [handleOverlayUpdate, onScanUpdate],
  );

  const frameCanvasElementRef = useRef<HTMLCanvasElement | null>(null);

  const handleFrameUpdate = useCallback(
    (() => {
      let context: CanvasRenderingContext2D | undefined = undefined;
      return () => {
        if (
          frameCanvasElementRef.current === null ||
          videoElementRef.current === null
        ) {
          return;
        }
        const { videoWidth, videoHeight } = videoElementRef.current;
        if (context === undefined) {
          context = frameCanvasElementRef.current.getContext("2d")!;
        }
        if (context.canvas.width !== videoWidth) {
          context.canvas.width = videoWidth;
        }
        if (context.canvas.height !== videoHeight) {
          context.canvas.height = videoHeight;
        }
        context.drawImage(videoElementRef.current, 0, 0);
      };
    })(),
    [],
  );

  const handleRepaint = useCallback(() => {
    handleFrameUpdate();
    onRepaint?.();
  }, [handleFrameUpdate, onRepaint]);

  const headlessScannerVideoRefCallback = useHeadlessVideoScanner({
    onScanUpdate: handleScanUpdate,
    onRepaint: handleRepaint,
    ...restUseVideoScannerOptions,
  });

  const videoRefCallback = useCallback<RefCallback<HTMLVideoElement>>(
    (videoElement) => {
      scannerVideoRefCallback(videoElement);
      headlessScannerVideoRefCallback(videoElement);
    },
    [scannerVideoRefCallback, headlessScannerVideoRefCallback],
  );

  return { videoRefCallback, overlayCanvasElementRef, frameCanvasElementRef };
}
