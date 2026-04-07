import type { ReaderOptions, ReadResult } from "../bindings/index.js";
import {
  createCanvas,
  getDimensions,
  isHTMLImageElement,
  isHTMLVideoElement,
  type ScannerElement,
} from "./helpers.js";

/** A function that decodes ImageData into barcode results. */
export type DecodeFn = (
  imageData: ImageData,
  options: ReaderOptions,
) => Promise<ReadResult[]>;

export interface ScanLoopOptions {
  /** The DOM element to scan. */
  element: ScannerElement;
  /** Decode function — readBarcodes for main thread, or a Worker wrapper. */
  decode: DecodeFn;
  /** Minimum interval between scans (ms). Getter for latest-ref pattern. */
  getInterval: () => number;
  /** Reader options. Getter for latest-ref pattern. */
  getReaderOptions: () => ReaderOptions;
  /** Called with results after each scan (always on main thread). */
  onResults: (results: ReadResult[]) => void;
  /** Called on error (always on main thread). */
  onError: (error: unknown) => void;
}

export interface ScanLoop {
  readonly isRunning: boolean;
  start(): void;
  stop(): void;
  destroy(): void;
}

export function createScanLoop(options: ScanLoopOptions): ScanLoop {
  const { element, decode, getInterval, getReaderOptions, onResults, onError } =
    options;

  // --- Pixel extraction canvas (OffscreenCanvas with HTMLCanvasElement fallback) ---

  const { canvas, ctx } = createCanvas(1, 1);

  // --- Scheduling state ---
  // Check the element's own prototype for rVFC (cross-realm safe).
  const isVideo = isHTMLVideoElement(element);
  const useRVFC = isVideo && "requestVideoFrameCallback" in element;

  // For HTMLCanvasElement sources with a 2d context, read pixels directly
  // (skips intermediate canvas + drawImage). Returns null for WebGL/transferred canvases.
  const sourceCtx =
    !isVideo && !isHTMLImageElement(element)
      ? ((element as HTMLCanvasElement).getContext(
          "2d",
        ) as CanvasRenderingContext2D | null)
      : null;

  let running = false;
  let scheduledId: number | undefined;
  let lastScanTime = 0;
  let lastCurrentTime = -1;

  // --- Pixel extraction ---

  function extractPixels(): ImageData | null {
    // Skip when video has no current frame data (HAVE_NOTHING or HAVE_METADATA)
    if (isVideo && (element as HTMLVideoElement).readyState < 2) return null;

    const [w, h] = getDimensions(element);
    if (w === 0 || h === 0) return null;

    // Direct read from 2d canvas source (no intermediate canvas needed)
    if (sourceCtx) return sourceCtx.getImageData(0, 0, w, h);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.drawImage(element, 0, 0);
    return ctx.getImageData(0, 0, w, h);
  }

  // --- Scan frame handler ---

  function onFrame() {
    if (!running) return;

    // 1. Interval throttling
    const now = performance.now();
    if (now - lastScanTime < getInterval()) {
      scheduleNext();
      return;
    }

    // 2. Video rAF fallback: cheap currentTime check before pixel extraction
    if (isVideo && !useRVFC) {
      const video = element as HTMLVideoElement;
      if (video.currentTime === lastCurrentTime) {
        scheduleNext();
        return;
      }
      lastCurrentTime = video.currentTime;
    }

    // 3. Pixel extraction (may throw SecurityError on tainted canvas)
    lastScanTime = now;
    let imageData: ImageData | null;
    try {
      imageData = extractPixels();
    } catch (error) {
      onError(error);
      if (running) scheduleNext();
      return;
    }
    if (!imageData) {
      scheduleNext();
      return;
    }

    // 4. Decode (async — completion-based scheduling)
    decode(imageData, getReaderOptions())
      .then((results) => {
        onResults(results);
        if (running) scheduleNext();
      })
      .catch((error) => {
        onError(error);
        if (running) scheduleNext();
      });
  }

  // --- Scheduling ---

  function scheduleNext() {
    if (!running) return;
    if (useRVFC) {
      scheduledId = element.requestVideoFrameCallback(() => onFrame());
    } else {
      scheduledId = requestAnimationFrame(() => onFrame());
    }
  }

  function cancelScheduled() {
    if (scheduledId === undefined) return;
    if (useRVFC) {
      element.cancelVideoFrameCallback(scheduledId);
    } else {
      cancelAnimationFrame(scheduledId);
    }
    scheduledId = undefined;
  }

  // --- Public interface ---

  return {
    get isRunning() {
      return running;
    },

    start() {
      if (running) return;
      running = true;
      scheduleNext();
    },

    stop() {
      running = false;
      cancelScheduled();
    },

    destroy() {
      running = false;
      cancelScheduled();
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
