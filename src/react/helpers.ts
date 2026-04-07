import type { ReadResult } from "../bindings/index.js";

/**
 * DOM element types that can be scanned for barcodes.
 */
export type ScannerElement =
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement;

// --- Cross-realm type guards (iframe-safe) ---

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

/**
 * Create a canvas + 2d context for pixel extraction.
 * Prefers OffscreenCanvas but verifies the context is a real
 * OffscreenCanvasRenderingContext2D (not a polyfill stub), falling back
 * to a regular HTMLCanvasElement.
 */
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

/**
 * Get natural dimensions of a source element.
 */
export function getDimensions(element: ScannerElement): [number, number] {
  if (isHTMLVideoElement(element)) {
    return [element.videoWidth, element.videoHeight];
  }
  if (isHTMLImageElement(element)) {
    return [element.naturalWidth, element.naturalHeight];
  }
  return [element.width, element.height];
}

export const EMPTY_RESULTS: ReadResult[] = [];

/**
 * Default equality function for onScan gating.
 * Compares results by format + text content, sorted.
 * Ignores position — only detects content changes.
 *
 * Returns true if results are "equal" (suppress onScan).
 * Same convention as zustand's equalityFn.
 */
export function defaultScanEqualityFn(
  prev: ReadResult[],
  next: ReadResult[],
): boolean {
  if (prev.length !== next.length) return false;
  if (prev.length === 0) return true;

  const toKey = (results: ReadResult[]) =>
    results
      .map((r) => `${r.format}\0${r.text}`)
      .sort()
      .join("\n");

  return toKey(prev) === toKey(next);
}
