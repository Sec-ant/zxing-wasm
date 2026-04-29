export type ScannerElement =
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement;

export function isHTMLVideoElement(
  element: ScannerElement,
): element is HTMLVideoElement {
  try {
    return (
      element instanceof
      (element.ownerDocument.defaultView!.HTMLVideoElement as never)
    );
  } catch {
    return false;
  }
}

export function isHTMLImageElement(
  element: ScannerElement,
): element is HTMLImageElement {
  try {
    return (
      element instanceof
      (element.ownerDocument.defaultView!.HTMLImageElement as never)
    );
  } catch {
    return false;
  }
}

export function createCanvas(width: number, height: number) {
  try {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx instanceof OffscreenCanvasRenderingContext2D) {
      return { canvas, ctx };
    }
    throw undefined;
  } catch {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return {
      canvas,
      ctx: canvas.getContext("2d", { willReadFrequently: true })!,
    };
  }
}

export function getDimensions(element: ScannerElement): [number, number] {
  if (isHTMLVideoElement(element)) {
    return [element.videoWidth, element.videoHeight];
  }
  if (isHTMLImageElement(element)) {
    return [element.naturalWidth, element.naturalHeight];
  }
  return [element.width, element.height];
}

function createAbortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

export function getAbortReason(signal?: AbortSignal) {
  if (!signal?.aborted) return undefined;
  return signal.reason ?? createAbortError();
}

export function throwIfAborted(signal?: AbortSignal) {
  const reason = getAbortReason(signal);
  if (reason !== undefined) {
    throw reason;
  }
}
