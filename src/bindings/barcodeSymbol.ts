/**
 * Barcode symbol in the shape of a one-channel image.
 */
export interface BarcodeSymbol {
  /**
   * Image data of the barcode symbol.
   */
  data: Uint8ClampedArray;
  /**
   * Width of the barcode symbol.
   */
  width: number;
  /**
   * Height of the barcode symbol.
   */
  height: number;
}
