import {
  getAbortReason,
  isHTMLVideoElement,
  type ScannerElement,
} from "./helpers.js";

export interface FrameScheduler {
  request(callback: () => void): number;
  cancel(id: number): void;
}

export function createFrameScheduler(element: ScannerElement): FrameScheduler {
  if (
    isHTMLVideoElement(element) &&
    "requestVideoFrameCallback" in element &&
    "cancelVideoFrameCallback" in element
  ) {
    return {
      request(callback) {
        return element.requestVideoFrameCallback(() => callback());
      },
      cancel(id) {
        element.cancelVideoFrameCallback(id);
      },
    };
  }

  return {
    request(callback) {
      return requestAnimationFrame(() => callback());
    },
    cancel(id) {
      cancelAnimationFrame(id);
    },
  };
}

export function nextFrame(
  scheduler: FrameScheduler,
  signal?: AbortSignal,
): Promise<void> {
  const reason = getAbortReason(signal);
  if (reason !== undefined) {
    return Promise.reject(reason);
  }

  return new Promise<void>((resolve, reject) => {
    let frameId: number | undefined;

    const cleanup = () => {
      if (frameId !== undefined) {
        scheduler.cancel(frameId);
        frameId = undefined;
      }
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(getAbortReason(signal));
    };

    frameId = scheduler.request(() => {
      cleanup();
      resolve();
    });

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
