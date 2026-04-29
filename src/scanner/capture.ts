import {
  createCanvas,
  getDimensions,
  isHTMLImageElement,
  isHTMLVideoElement,
  type ScannerElement,
  throwIfAborted,
} from "./helpers.js";
import { createFrameScheduler, nextFrame } from "./nextFrame.js";

export interface CaptureOptions {
  signal?: AbortSignal;
}

export async function* capture(
  element: ScannerElement,
  { signal }: CaptureOptions = {},
): AsyncGenerator<ImageData, void, undefined> {
  const scheduler = createFrameScheduler(element);
  const { canvas, ctx } = createCanvas(1, 1);
  const isVideo = isHTMLVideoElement(element);
  const sourceCtx =
    !isVideo && !isHTMLImageElement(element)
      ? element.getContext("2d", { willReadFrequently: true })
      : null;
  let lastCurrentTime = -1;

  const captureFrame = () => {
    if (isVideo) {
      const video = element as HTMLVideoElement;
      const usesVideoFrameCallback =
        typeof video.requestVideoFrameCallback === "function";
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return null;
      }
      if (!usesVideoFrameCallback && video.currentTime === lastCurrentTime) {
        return null;
      }
      lastCurrentTime = video.currentTime;
    }

    const [width, height] = getDimensions(element);
    if (width === 0 || height === 0) return null;

    if (sourceCtx) {
      return sourceCtx.getImageData(0, 0, width, height);
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.drawImage(element, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  };

  try {
    while (true) {
      throwIfAborted(signal);
      const imageData = captureFrame();
      if (imageData) {
        yield imageData;
      }
      await nextFrame(scheduler, signal);
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
