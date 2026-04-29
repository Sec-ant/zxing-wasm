import type { ReaderOptions, ReadResult } from "../bindings/index.js";
import { prepareZXingModule, readBarcodes } from "../reader/index.js";

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

let modulePromise: Promise<unknown> | undefined;
let decodeQueue = Promise.resolve<unknown>(undefined);

function ensureModule(wasmBinary?: ArrayBuffer) {
  if (!modulePromise) {
    modulePromise = wasmBinary
      ? prepareZXingModule({
          overrides: { wasmBinary },
          fireImmediately: true,
        })
      : prepareZXingModule({ fireImmediately: true });
  }
  return modulePromise;
}

function enqueueDecode(job: () => Promise<void>) {
  const task = decodeQueue.then(job, job);
  decodeQueue = task.then(
    () => undefined,
    () => undefined,
  );
}

function attachClient(port: MessagePort) {
  const onMessage = (
    event: MessageEvent<ClientScanRequest | ClientDisconnectRequest>,
  ) => {
    const request = event.data;

    if (request.type === "disconnect") {
      port.removeEventListener("message", onMessage);
      port.close();
      return;
    }

    enqueueDecode(async () => {
      const response: ClientResponse = await (async () => {
        try {
          await ensureModule();
          const imageData = new ImageData(
            new Uint8ClampedArray(request.buffer),
            request.width,
            request.height,
          );
          const results = await readBarcodes(imageData, request.readerOptions);
          return { type: "result", results };
        } catch (error) {
          return {
            type: "error",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })();

      port.postMessage(response);
    });
  };

  port.addEventListener("message", onMessage);
  port.start();
}

self.addEventListener(
  "message",
  (event: MessageEvent<WorkerInitMessage | WorkerAttachClientMessage>) => {
    if (event.data.type === "init") {
      void ensureModule(event.data.wasmBinary);
      return;
    }

    attachClient(event.data.port);
  },
);
