import { createHash } from "sha1-uint8array";
import type { SetRequired } from "type-fest";
import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { defaultModuleOverrides } from "../core.js";
import {
  type ReadResult,
  type ReaderOptions,
  barcodeFormats,
  contentTypes,
  readBarcodesFromImageData,
  setZXingModuleOverrides,
} from "../reader/index.js";

/**
 * The default minimum interval in milliseconds for scanning operations.
 */
const SCAN_THROTTLE = 40;

/**
 * The default minimum interval in milliseconds to confirm a negative result.
 */
const NEGATIVE_DEBOUNCE = 0;

/**
 * Symbols used as unique keys for internal state properties to avoid overriden.
 */
const scanSymbol = Symbol("scan");
const closeSymbol = Symbol("close");

/**
 * Options for configuring the VideoScanner.
 */
export interface VideoScannerOptions {
  /**
   * Location of the ZXing WebAssembly (WASM) file used for barcode decoding.
   */
  wasmLocation?: string;
  /**
   * Configuration options for the ZXing barcode reader.
   */
  readerOptions?: ReaderOptions;
  /**
   * Minimum interval in milliseconds between scan operations to throttle the scan frequency.
   */
  scanThrottle?: number;
  /**
   * Minimum duration in milliseconds before a negative result is confirmed.
   */
  negativeDebounce?: number;
  /**
   * Callback function that is triggered when a new barcode is detected.
   *
   * @param readResults - Array of detected barcodes.
   */
  onScanDetect?: (readResults: ReadResult[]) => unknown;
  /**
   * Callback function that is triggered on each scan update, regardless of new detections.
   *
   * @param readResults - Array of detected barcodes.
   */
  onScanUpdate?: (readResults: ReadResult[]) => unknown;
  /**
   * Callback function that is triggered when the scanning process starts.
   */
  onScanStart?: () => unknown;
  /**
   * Callback function that is triggered when the scanning process stops.
   */
  onScanStop?: () => unknown;
  /**
   * Callback function that is triggered when the scanning process is closed.
   */
  onScanClose?: () => unknown;
  /**
   * Callback function that is triggered when the browser repaints.
   */
  onRepaint?: () => unknown;
}

/**
 * Internal state and options for VideoScanner.
 */
interface VideoScannerState extends ResolvedVideoScannerOptions {
  /**
   * Indicates whether the scanner is currently scanning.
   */
  [scanSymbol]: boolean;
  /**
   * Indicates whether the scanner has been closed.
   */
  [closeSymbol]: boolean;
}

/**
 * Resolved options for the VideoScanner with default values provided.
 */
type ResolvedVideoScannerOptions = SetRequired<
  VideoScannerOptions,
  "scanThrottle" | "negativeDebounce"
>;

/**
 * Resolves and merges the provided VideoScannerOptions with the default values for unspecified options.
 *
 * @param videoScannerOptions - The user-provided configuration options for the VideoScanner.
 * @returns The resolved configuration options with default values for unspecified options.
 */
function resolveVideoScannerOptions(
  videoScannerOptions: VideoScannerOptions,
): ResolvedVideoScannerOptions {
  return {
    wasmLocation:
      "wasmLocation" in videoScannerOptions
        ? videoScannerOptions.wasmLocation
        : undefined,
    readerOptions:
      "readerOptions" in videoScannerOptions
        ? videoScannerOptions.readerOptions
        : undefined,
    scanThrottle: videoScannerOptions.scanThrottle ?? SCAN_THROTTLE,
    negativeDebounce: videoScannerOptions.negativeDebounce ?? NEGATIVE_DEBOUNCE,
    onScanDetect:
      "onScanDetect" in videoScannerOptions
        ? videoScannerOptions.onScanDetect
        : undefined,
    onScanUpdate:
      "onScanUpdate" in videoScannerOptions
        ? videoScannerOptions.onScanUpdate
        : undefined,
    onScanStart:
      "onScanStart" in videoScannerOptions
        ? videoScannerOptions.onScanStart
        : undefined,
    onScanStop:
      "onScanStop" in videoScannerOptions
        ? videoScannerOptions.onScanStop
        : undefined,
    onScanClose:
      "onScanClose" in videoScannerOptions
        ? videoScannerOptions.onScanClose
        : undefined,
    onRepaint:
      "onRepaint" in videoScannerOptions
        ? videoScannerOptions.onRepaint
        : undefined,
  };
}

/**
 * Represents a video scanner that can start, stop, and close the scanning process, and update its configuration.
 */
export interface VideoScanner {
  /**
   * Starts the scanning process.
   */
  start: () => void;
  /**
   * Stops the scanning process.
   */
  stop: () => void;
  /**
   * Closes the scanner and performs cleanup operations.
   */
  close: () => void;
  /**
   * Update the configuration options of the VideoScanner.
   *
   * @param videoScannerOptions - New configuration options.
   */
  setOptions: (videoScannerOptions: VideoScannerOptions) => void;
}

/**
 * Creates and returns a VideoScanner object.
 *
 * Initializes a VideoScanner with the specified HTMLVideoElement and configuration options, providing control methods
 * for starting, stopping, and closing the video scanner, along with updating its options.
 *
 * @param videoElement - The HTMLVideoElement used for scanning.
 * @param videoScannerOptions - Configuration options for the VideoScanner.
 * @returns A VideoScanner object providing control methods for video scanning.
 */
export function createVideoScanner(
  videoElement: HTMLVideoElement,
  videoScannerOptions: VideoScannerOptions,
): VideoScanner {
  const {
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
  } = resolveVideoScannerOptions(videoScannerOptions);

  // request animation frame id
  let requestAnimationFrameId: number;

  // create a state store
  const videoScannerStore = createStore<VideoScannerState>()(
    subscribeWithSelector<VideoScannerState>(() => ({
      [scanSymbol]: false,
      [closeSymbol]: false,

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
    })),
  );

  const start = () => {
    videoScannerStore.setState({
      [scanSymbol]: true,
    });
  };

  const stop = () => {
    videoScannerStore.setState({
      [scanSymbol]: false,
    });
  };

  const close = () => {
    videoScannerStore.setState({
      [closeSymbol]: true,
    });
  };

  // subscribe to scan start and stop actions
  // so we can call the event handlers
  const unsubScan = videoScannerStore.subscribe(
    (options) => options[scanSymbol],
    (scan) => {
      if (scan) {
        videoScannerStore.getState().onScanStart?.();
      } else {
        videoScannerStore.getState().onScanStop?.();
      }
    },
  );

  // subscribe to the close action
  // so we can do some cleanups
  const unsubClose = videoScannerStore.subscribe(
    (options) => options[closeSymbol],
    (close) => {
      if (close) {
        globalThis.cancelAnimationFrame(requestAnimationFrameId);
        stop();
        unsubScan();
        unsubClose();
        unsubWasmLocation();
        videoScannerStore.getState().onScanClose?.();
      }
    },
    {
      fireImmediately: true,
    },
  );

  // subscribe to wasm location change
  const unsubWasmLocation = videoScannerStore.subscribe(
    (options) => options.wasmLocation,
    (wasmLocation) => {
      if (wasmLocation === undefined) {
        setZXingModuleOverrides(defaultModuleOverrides);
        return;
      }
      setZXingModuleOverrides({
        locateFile: (path, prefix) => {
          if (path.endsWith(".wasm")) {
            return wasmLocation;
          }
          return prefix + path;
        },
      });
    },
    {
      fireImmediately: true,
    },
  );

  // define the frame request callback function
  const frameRequestCallback = (() => {
    // keep the context values in the closure
    let detecting = false;
    let prevTimestamp = 0;

    type SignatureMap = Map<
      string,
      { timestamp: number; readResult: ReadResult }
    >;
    let prevSignatureMap: SignatureMap = new Map();

    // return the actual callback function
    return async (currTimestamp: DOMHighResTimeStamp) => {
      // get options snapshot
      const {
        [scanSymbol]: scan,
        [closeSymbol]: close,
        readerOptions,
        scanThrottle,
        onScanDetect,
        onScanUpdate,
        onRepaint,
      } = videoScannerStore.getState();

      // return if closed
      if (close) {
        return;
      }

      // call repaint event handler
      onRepaint?.();

      // skip if the following conditions are met
      if (!scan || detecting || currTimestamp - prevTimestamp < scanThrottle) {
        if (!scan) {
          // clear previous signature map
          prevSignatureMap.clear();
          // clear previouse timestamp
          prevTimestamp = 0;
        }
        // trigger next cycle
        requestAnimationFrameId =
          globalThis.requestAnimationFrame(frameRequestCallback);
        return;
      }

      // set detecting status
      detecting = true;

      // detect
      const imageData = getImageDataFromVideoElement(videoElement);
      let readResults: ReadResult[] = [];
      if (imageData !== null) {
        readResults = await readBarcodesFromImageData(imageData, readerOptions);
      }

      // populate the signature map and set the flag
      let newSymbolDetected = false;
      const currSignatureMap: SignatureMap = new Map();
      for (const readResult of readResults) {
        const signature = getSignature(readResult);
        if (!newSymbolDetected && !prevSignatureMap.has(signature)) {
          newSymbolDetected = true;
        }
        currSignatureMap.set(signature, {
          timestamp: currTimestamp,
          readResult,
        });
      }
      for (const [prevSignature, prevResult] of prevSignatureMap) {
        if (
          !currSignatureMap.has(prevSignature) &&
          currTimestamp - prevResult.timestamp < negativeDebounce
        ) {
          currSignatureMap.set(prevSignature, prevResult);
          readResults.push(prevResult.readResult);
        }
      }
      prevSignatureMap = currSignatureMap;

      // call onScanDetect event handler
      if (newSymbolDetected) {
        onScanDetect?.(readResults);
      }

      // call onScanUpdate event handler
      onScanUpdate?.(readResults);

      // update prevTimestamp
      prevTimestamp = currTimestamp;

      // clear detecting status
      detecting = false;

      // trigger next cycle
      requestAnimationFrameId =
        globalThis.requestAnimationFrame(frameRequestCallback);
    };
  })();

  requestAnimationFrameId =
    globalThis.requestAnimationFrame(frameRequestCallback);

  return {
    start,
    stop,
    close,
    setOptions: (videoScannerOptions) =>
      videoScannerStore.setState(
        resolveVideoScannerOptions(videoScannerOptions),
      ),
  };
}

/**
 * Retrieves image data from the provided HTMLVideoElement for processing.
 *
 * Ensures the video element is in a ready state and has non-zero dimensions before extracting the image data.
 *
 * @param videoElement - The HTMLVideoElement to extract image data from.
 * @returns ImageData if successful, or null in case of failure or invalid state.
 */
export const getImageDataFromVideoElement = (() => {
  let context:
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | undefined = undefined;
  return (videoElement: HTMLVideoElement) => {
    if (videoElement.readyState === 0 || videoElement.readyState === 1) {
      return null;
    }
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    if (width === 0 || height === 0) {
      return null;
    }
    if (context === undefined) {
      const canvas = createCanvas(width, height);
      context = canvas.getContext("2d", { willReadFrequently: true }) as
        | CanvasRenderingContext2D
        | OffscreenCanvasRenderingContext2D;
    } else {
      if (context.canvas.width !== width) {
        context.canvas.width = width;
      }
      if (context.canvas.height !== height) {
        context.canvas.height = height;
      }
    }
    context.drawImage(videoElement, 0, 0);
    try {
      const imageData = context.getImageData(0, 0, width, height);
      return imageData;
    } catch (e) {
      return null;
    }
  };
})();

/**
 * Dynamically creates a canvas element suitable for the environment.
 *
 * Prefers OffscreenCanvas but falls back to HTMLCanvasElement where OffscreenCanvas is not supported.
 *
 * @param width - The width of the canvas.
 * @param height - The height of the canvas.
 * @returns A canvas element, either OffscreenCanvas or HTMLCanvasElement based on environment support.
 */
function createCanvas(
  width: number,
  height: number,
): OffscreenCanvas | HTMLCanvasElement {
  try {
    const canvas = new OffscreenCanvas(width, height);
    if (
      canvas.getContext("2d", { willReadFrequently: true }) instanceof
      OffscreenCanvasRenderingContext2D
    ) {
      return canvas;
    }
    throw undefined;
  } catch {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
}

/**
 * Generates a unique signature for a given ReadResult.
 *
 * Creates a signature string for a ReadResult object to uniquely identify a read barcode.
 *
 * @param readResult - The ReadResult object for which to generate the signature.
 * @returns A unique signature string for the given ReadResult.
 */
function getSignature(readResult: ReadResult) {
  return createHash()
    .update(
      new Uint8Array(
        (+readResult.isValid << 0) +
          (+readResult.isMirrored << 1) +
          (+readResult.isInverted << 2) +
          (+readResult.hasECI << 3) +
          (+readResult.readerInit << 4),
      ),
    )
    .update(new Uint8Array(barcodeFormats.indexOf(readResult.format) + 1))
    .update(new Uint8Array(contentTypes.indexOf(readResult.contentType) + 1))
    .update(readResult.symbologyIdentifier + readResult.version)
    .update(readResult.bytes)
    .digest("hex");
}
