/**
 * Creates and returns a canvas element (OffscreenCanvas if supported, otherwise HTMLCanvasElement)
 * with the specified width and height.
 */
export function createCanvas(
  width: number,
  height: number,
): OffscreenCanvas | HTMLCanvasElement {
  try {
    const canvas = new OffscreenCanvas(width, height);
    if (
      canvas.getContext("2d", {
        willReadFrequently: true,
      }) instanceof OffscreenCanvasRenderingContext2D
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
