import type { ReaderOptions, ReadResult } from "../bindings/index.js";
import type { DecodeFn } from "./scanLoop.js";

/**
 * Compute the scanner-worker module URL.
 * In dev mode (.ts source served by Vite), use the .ts extension so the
 * dev-server transforms and serves it correctly.
 * In production builds, reference the .js entry-point output.
 *
 * The conditional prevents Rolldown from detecting the
 * `new URL(string_literal, import.meta.url)` asset pattern and incorrectly
 * inlining the worker source as a data-URL in library mode.
 */
const scannerWorkerURL = new URL(
  import.meta.env.DEV ? "./scanner-worker.ts" : "./scanner-worker.js",
  import.meta.url,
);

// --- Keyed Worker pool with reference counting ---

const DEFAULT_WORKER_KEY = "";
const workerPool = new Map<string, { worker: Worker; refCount: number }>();

export function acquireWorker(
  workerKey?: string,
  wasmBinary?: ArrayBuffer,
): Worker {
  const key = workerKey ?? DEFAULT_WORKER_KEY;
  let entry = workerPool.get(key);

  if (!entry) {
    const worker = new Worker(scannerWorkerURL, { type: "module" });

    // Send init message with optional wasmBinary.
    // Only the first acquirer's wasmBinary is used (subsequent acquirers
    // share the already-initialized Worker).
    if (wasmBinary && wasmBinary.byteLength > 0) {
      worker.postMessage({ type: "init", wasmBinary }, [wasmBinary]);
    } else {
      worker.postMessage({ type: "init" });
    }

    entry = { worker, refCount: 0 };
    workerPool.set(key, entry);
  }

  entry.refCount++;
  return entry.worker;
}

export function releaseWorker(workerKey?: string): void {
  const key = workerKey ?? DEFAULT_WORKER_KEY;
  const entry = workerPool.get(key);
  if (!entry) return;

  entry.refCount--;
  if (entry.refCount === 0) {
    entry.worker.terminate();
    workerPool.delete(key);
  }
}

// --- Worker decode wrapper ---

export interface WorkerDecode {
  decode: DecodeFn;
  destroy: () => void;
}

export function createWorkerDecode(
  workerKey?: string,
  wasmBinary?: ArrayBuffer,
): WorkerDecode {
  const worker = acquireWorker(workerKey, wasmBinary);
  let nextId = 0;
  const pending = new Map<
    number,
    {
      resolve: (results: ReadResult[]) => void;
      reject: (error: unknown) => void;
    }
  >();

  function onMessage(e: MessageEvent) {
    const { id, type } = e.data;
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    if (type === "result") p.resolve(e.data.results);
    else if (type === "error") p.reject(new Error(e.data.error));
  }

  worker.addEventListener("message", onMessage);

  return {
    decode(imageData: ImageData, readerOptions: ReaderOptions) {
      return new Promise<ReadResult[]>((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        const buffer = imageData.data.buffer as ArrayBuffer;
        worker.postMessage(
          {
            id,
            type: "scan",
            buffer,
            width: imageData.width,
            height: imageData.height,
            readerOptions,
          },
          [buffer],
        );
      });
    },
    destroy() {
      worker.removeEventListener("message", onMessage);
      pending.clear();
      releaseWorker(workerKey);
    },
  };
}
