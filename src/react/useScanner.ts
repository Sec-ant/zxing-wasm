import {
  type RefCallback,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReaderOptions, ReadResult } from "../bindings/index.js";
import { prepareZXingModule, readBarcodes } from "../reader/index.js";
import {
  defaultScanEqualityFn,
  EMPTY_RESULTS,
  type ScannerElement,
} from "./helpers.js";
import { createScanLoop, type DecodeFn, type ScanLoop } from "./scanLoop.js";
import {
  acquireWorker,
  createWorkerDecode,
  releaseWorker,
} from "./workerDecode.js";

export interface UseScannerOptions {
  /**
   * Barcode reader options (formats, tryHarder, etc.).
   * Changes do NOT restart the scanning loop — applied at next scan via latest-ref.
   *
   * @default defaultReaderOptions
   */
  readerOptions?: ReaderOptions;

  /**
   * Pre-fetched WASM binary to use for module instantiation.
   *
   * - When `worker` is falsy: passed to `prepareZXingModule` (non-destructive).
   * - When `worker` is truthy: transferred to Worker via `postMessage` (buffer is **detached**).
   *
   * Applied once at loop creation time. Not reactive.
   */
  wasmBinary?: ArrayBuffer;

  /**
   * Controls whether decoding runs on the main thread or in a Web Worker.
   *
   * - `undefined` / `false`: decode on main thread
   * - `true`: decode in a shared Worker
   * - `string`: decode in a Worker keyed by this string
   *
   * Structural change — switching recreates the loop with a new decoder.
   *
   * @default undefined
   */
  worker?: boolean | string;

  /**
   * Minimum interval between scans in milliseconds.
   * 0 = scan as fast as possible.
   *
   * @default 0
   */
  interval?: number;

  /**
   * Called when scan results "change" according to `equalityFn`.
   * NOT called on every frame — use `onFrame` for that.
   */
  onScan?: (results: ReadResult[]) => void;

  /**
   * Called on every processed frame with raw scan results (including empty).
   */
  onFrame?: (results: ReadResult[]) => void;

  /**
   * Called when an error occurs during scanning.
   */
  onError?: (error: unknown) => void;

  /**
   * Determines if two consecutive scan results are "equal".
   * When equal (returns true), `onScan` is NOT fired.
   * Same convention as zustand's `equalityFn`.
   *
   * @default defaultScanEqualityFn
   */
  equalityFn?: (prev: ReadResult[], next: ReadResult[]) => boolean;
}

export interface UseScannerReturn {
  /**
   * Callback ref to bind to a scannable DOM element.
   * Call `start()` to begin scanning after the element is attached.
   */
  ref: RefCallback<ScannerElement>;

  /**
   * Start or resume the scanning loop.
   * No-op if already scanning or if no element is attached.
   * Stable identity — never changes between renders.
   */
  start: () => void;

  /**
   * Stop (pause) the scanning loop.
   * Resources are kept for fast resume via `start()`.
   * Stable identity — never changes between renders.
   */
  stop: () => void;

  /**
   * Whether the scanning loop is currently active.
   */
  scanning: boolean;
}

export function useScanner(options: UseScannerOptions = {}): UseScannerReturn {
  // Structural option — only this triggers loop recreation.
  const worker = useMemo(() => {
    const w = options.worker;
    return typeof w === "string" || w === true ? w : undefined;
  }, [options.worker]);

  // Latest-refs — read by stable callbacks without adding deps.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const workerRef = useRef(worker);
  workerRef.current = worker;

  // Mutable refs
  const elementRef = useRef<ScannerElement | null>(null);
  const loopRef = useRef<ScanLoop | null>(null);
  const decoderDestroyRef = useRef<(() => void) | undefined>(undefined);
  const prevResultsRef = useRef<ReadResult[]>(EMPTY_RESULTS);

  // Only React state
  const [scanning, setScanning] = useState(false);

  // --- Internal helpers (stored in refs — no dependency chains) ---

  const handleResults = useCallback((scanResults: ReadResult[]) => {
    optionsRef.current.onFrame?.(scanResults);

    const equalityFn = optionsRef.current.equalityFn ?? defaultScanEqualityFn;
    if (!equalityFn(prevResultsRef.current, scanResults)) {
      prevResultsRef.current = scanResults;
      optionsRef.current.onScan?.(scanResults);
    }
  }, []);
  const handleResultsRef = useRef(handleResults);

  const destroyLoop = useCallback(() => {
    loopRef.current?.destroy();
    loopRef.current = null;
    decoderDestroyRef.current?.();
    decoderDestroyRef.current = undefined;
    prevResultsRef.current = EMPTY_RESULTS;
    setScanning(false);
  }, []);
  const destroyLoopRef = useRef(destroyLoop);

  const createLoop = useCallback((): ScanLoop | null => {
    const element = elementRef.current;
    if (!element) return null;

    const wasmBinary = optionsRef.current.wasmBinary;
    const w = workerRef.current;

    let decode: DecodeFn;
    if (w !== undefined) {
      const workerKey = typeof w === "string" ? w : undefined;
      const wd = createWorkerDecode(workerKey, wasmBinary);
      decode = wd.decode;
      decoderDestroyRef.current = wd.destroy;
    } else {
      if (wasmBinary && wasmBinary.byteLength > 0) {
        prepareZXingModule({
          overrides: { wasmBinary },
          fireImmediately: true,
        });
      } else {
        prepareZXingModule({ fireImmediately: true });
      }
      decode = readBarcodes;
    }

    const loop = createScanLoop({
      element,
      decode,
      getInterval: () => optionsRef.current.interval ?? 0,
      getReaderOptions: () => optionsRef.current.readerOptions ?? {},
      onResults: (results) => handleResultsRef.current(results),
      onError: (error) => optionsRef.current.onError?.(error),
    });

    loopRef.current = loop;
    return loop;
  }, []);
  const createLoopRef = useRef(createLoop);

  // --- Public API (all stable — [] deps, read everything via refs) ---

  const start = useCallback(() => {
    if (loopRef.current?.isRunning) return;
    if (!elementRef.current) return;

    if (!loopRef.current) {
      createLoopRef.current();
    }
    loopRef.current?.start();
    setScanning(true);
  }, []);

  const stop = useCallback(() => {
    loopRef.current?.stop();
    setScanning(false);
  }, []);

  const ref: RefCallback<ScannerElement> = useCallback(
    (node: ScannerElement | null) => {
      if (node === elementRef.current) return;

      if (elementRef.current) {
        destroyLoopRef.current();
      }

      elementRef.current = node;
    },
    [],
  );

  // --- Worker lifecycle + structural option change ---

  useEffect(() => {
    const wasmBinary = optionsRef.current.wasmBinary;
    const workerKey = typeof worker === "string" ? worker : undefined;

    if (worker !== undefined) {
      acquireWorker(workerKey, wasmBinary);
    } else if (wasmBinary && wasmBinary.byteLength > 0) {
      prepareZXingModule({ overrides: { wasmBinary }, fireImmediately: true });
    } else {
      prepareZXingModule({ fireImmediately: true });
    }

    if (loopRef.current) {
      const wasRunning = loopRef.current.isRunning;
      destroyLoopRef.current();

      if (wasRunning) {
        createLoopRef.current()?.start();
        setScanning(true);
      }
    }

    return () => {
      if (worker !== undefined) {
        releaseWorker(workerKey);
      }
    };
  }, [worker]);

  // --- Cleanup on unmount ---

  useEffect(() => {
    return () => {
      destroyLoopRef.current();
      elementRef.current = null;
    };
  }, []);

  return { ref, start, stop, scanning };
}
