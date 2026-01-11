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

/**
 * @internal
 *
 * Flips the bits of the barcode symbol data.
 *
 * @param symbol - The barcode symbol to flip bits for
 * @returns The barcode symbol with flipped bits
 *
 * @remarks
 * This is a compatibility layer for the breaking change in zxing-cpp where the
 * bit representation of the symbol was flipped (0 now means black).
 * This function flips the bits back to the old behavior where 1 means black.
 */
export function flipSymbolBits(symbol: BarcodeSymbol): BarcodeSymbol {
  for (let i = 0; i < symbol.data.length; ++i) {
    symbol.data[i] = 255 - symbol.data[i];
  }
  return symbol;
}
