import type { ReaderOptions, ReadResult } from "../bindings/index.js";

declare const __filename: string | undefined;

const scannerWorkerURL = import.meta.env.DEV
  ? new URL("./scanner-worker.ts", import.meta.url)
  : typeof __filename === "string"
    ? new URL("../../es/internal/scanner-worker.js", `file://${__filename}`)
    : new URL("../internal/scanner-worker.js", import.meta.url);

const DEFAULT_WORKER_KEY = "";

interface WorkerPoolEntry {
  worker: Worker;
  refCount: number;
  wasmBinary?: ArrayBuffer;
}

interface PendingRequest {
  resolve: (results: ReadResult[]) => void;
  reject: (error: unknown) => void;
}

type WorkerInitMessage = {
  type: "init";
  wasmBinary?: ArrayBuffer;
};

type WorkerAttachClientMessage = {
  type: "attach-client";
  port: MessagePort;
};

type ClientScanRequest = {
  type: "scan";
  buffer: ArrayBuffer;
  width: number;
  height: number;
  readerOptions: ReaderOptions;
};

type ClientDisconnectRequest = {
  type: "disconnect";
};

type ClientResponse =
  | {
      type: "result";
      results: ReadResult[];
    }
  | {
      type: "error";
      error: string;
    };

const workerPool = new Map<string, WorkerPoolEntry>();

function getWorkerKey(workerKey?: string) {
  return workerKey ?? DEFAULT_WORKER_KEY;
}

function assertCompatibleWasmBinary(
  entry: WorkerPoolEntry,
  workerKey: string,
  wasmBinary?: ArrayBuffer,
) {
  if (wasmBinary === undefined) return;
  if (entry.wasmBinary === undefined) {
    throw new Error(
      `Worker "${workerKey}" is already initialized without a custom wasmBinary.`,
    );
  }
  if (entry.wasmBinary !== wasmBinary) {
    throw new Error(
      `Worker "${workerKey}" cannot be reused with a different wasmBinary.`,
    );
  }
}

function acquireWorker(workerKey?: string, wasmBinary?: ArrayBuffer): Worker {
  const key = getWorkerKey(workerKey);
  const existingEntry = workerPool.get(key);
  if (existingEntry) {
    assertCompatibleWasmBinary(existingEntry, key, wasmBinary);
    existingEntry.refCount++;
    return existingEntry.worker;
  }

  if (wasmBinary && wasmBinary.byteLength === 0) {
    throw new Error(
      `Worker "${key}" received a detached wasmBinary and cannot initialize.`,
    );
  }

  const worker = new Worker(scannerWorkerURL, { type: "module" });
  const initMessage: WorkerInitMessage = wasmBinary
    ? { type: "init", wasmBinary }
    : { type: "init" };
  if (wasmBinary) {
    worker.postMessage(initMessage, [wasmBinary]);
  } else {
    worker.postMessage(initMessage);
  }

  workerPool.set(key, {
    worker,
    refCount: 1,
    wasmBinary,
  });
  return worker;
}

function releaseWorker(workerKey?: string) {
  const key = getWorkerKey(workerKey);
  const entry = workerPool.get(key);
  if (!entry) return;

  entry.refCount--;
  if (entry.refCount === 0) {
    entry.worker.terminate();
    workerPool.delete(key);
  }
}

export interface WorkerDecode {
  decode(
    imageData: ImageData,
    readerOptions: ReaderOptions,
  ): Promise<ReadResult[]>;
  destroy(): void;
}

export function createWorkerDecode(
  workerKey?: string,
  wasmBinary?: ArrayBuffer,
): WorkerDecode {
  const worker = acquireWorker(workerKey, wasmBinary);
  const channel = new MessageChannel();
  const port = channel.port1;
  const attachMessage: WorkerAttachClientMessage = {
    type: "attach-client",
    port: channel.port2,
  };
  worker.postMessage(attachMessage, [channel.port2]);
  port.start();

  let destroyed = false;
  let pending: PendingRequest | undefined;
  let queue = Promise.resolve<unknown>(undefined);

  const onMessage = (event: MessageEvent<ClientResponse>) => {
    if (!pending) return;

    const currentPending = pending;
    pending = undefined;

    if (event.data.type === "result") {
      currentPending.resolve(event.data.results);
      return;
    }

    currentPending.reject(new Error(event.data.error));
  };

  port.addEventListener("message", onMessage);

  const sendRequest = (imageData: ImageData, readerOptions: ReaderOptions) => {
    if (destroyed) {
      return Promise.reject(new Error("Worker decoder has been destroyed."));
    }
    if (pending) {
      return Promise.reject(
        new Error(
          "Worker decoder invariant violated: request overlap detected.",
        ),
      );
    }

    return new Promise<ReadResult[]>((resolve, reject) => {
      pending = { resolve, reject };
      const message: ClientScanRequest = {
        type: "scan",
        buffer: imageData.data.buffer as ArrayBuffer,
        width: imageData.width,
        height: imageData.height,
        readerOptions,
      };
      port.postMessage(message, [message.buffer]);
    });
  };

  return {
    decode(imageData, readerOptions) {
      const task = queue.then(() => sendRequest(imageData, readerOptions));
      queue = task.then(
        () => undefined,
        () => undefined,
      );
      return task;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;

      pending?.reject(
        new DOMException("Worker decoder has been destroyed.", "AbortError"),
      );
      pending = undefined;

      const disconnectMessage: ClientDisconnectRequest = { type: "disconnect" };
      port.postMessage(disconnectMessage);
      port.removeEventListener("message", onMessage);
      port.close();
      releaseWorker(workerKey);
    },
  };
}
