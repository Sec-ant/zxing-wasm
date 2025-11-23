const barcodeFormatsWithMeta = [
  ["Aztec", "M"],
  ["Codabar", "L"],
  ["Code39", "L"],
  ["Code93", "L"],
  ["Code128", "L"],
  ["DataBar", "L"],
  ["DataBarExpanded", "L"],
  ["DataMatrix", "M"],
  ["EAN-8", "L"],
  ["EAN-13", "L"],
  ["ITF", "L"],
  ["MaxiCode", "M"],
  ["PDF417", "M"],
  ["QRCode", "M"],
  ["UPC-A", "L"],
  ["UPC-E", "L"],
  ["MicroQRCode", "M"],
  ["rMQRCode", "M"],
  ["DXFilmEdge", "L"],
  ["DataBarLimited", "L"],
] as const;

export const barcodeFormats = barcodeFormatsWithMeta.map(([format]) => format);

type TakeFirst<T> = T extends readonly [infer U, ...unknown[]] ? U : never;

export type LinearBarcodeFormat = TakeFirst<
  Extract<
    (typeof barcodeFormatsWithMeta)[number],
    readonly [string, "L", ...unknown[]]
  >
>;

export const linearBarcodeFormats = barcodeFormats.filter(
  (_, index): _ is LinearBarcodeFormat =>
    barcodeFormatsWithMeta[index][1] === "L",
);

export type MatrixBarcodeFormat = TakeFirst<
  Extract<
    (typeof barcodeFormatsWithMeta)[number],
    readonly [string, "M", ...unknown[]]
  >
>;

export const matrixBarcodeFormats = barcodeFormats.filter(
  (_, index): _ is MatrixBarcodeFormat =>
    barcodeFormatsWithMeta[index][1] === "M",
);

/**
 * @internal
 */
export type BarcodeFormat = (typeof barcodeFormats)[number];

/**
 * Barcode formats that can be used in {@link ReaderOptions.formats | `ReaderOptions.formats`} to read barcodes.
 */
export type ReadInputBarcodeFormat =
  | BarcodeFormat
  | "Linear-Codes"
  | "Matrix-Codes"
  | "Any";

/**
 * Barcode formats that can be used in {@link WriterOptions.format | `WriterOptions.format`} to write barcodes.
 */
export type WriteInputBarcodeFormat = TakeFirst<
  Exclude<
    (typeof barcodeFormatsWithMeta)[number],
    readonly [string, string, "W-"]
  >
>;

/**
 * Barcode formats that may be returned in {@link ReadResult.format | `ReadResult.format`} in read functions.
 */
export type ReadOutputBarcodeFormat = BarcodeFormat | "None";

export type LooseBarcodeFormat =
  | ReadInputBarcodeFormat
  | WriteInputBarcodeFormat
  | ReadOutputBarcodeFormat;

/**
 * Encodes a barcode format into its numeric representation.
 *
 * @param format - The barcode format to encode. Can be a specific format, "Linear-Codes",
 *                "Matrix-Codes", "Any", or "None"
 * @returns A number representing the encoded format where:
 *          - For specific formats: returns a power of 2 based on format's index
 *          - For "Linear-Codes": returns bitwise OR of all linear format codes
 *          - For "Matrix-Codes": returns bitwise OR of all matrix format codes
 *          - For "Any": returns a number with all format bits set
 *          - For "None": returns 0
 */
export function encodeFormat(format: LooseBarcodeFormat): number {
  switch (format) {
    case "Linear-Codes":
      return linearBarcodeFormats.reduce((acc, f) => acc | encodeFormat(f), 0);
    case "Matrix-Codes":
      return matrixBarcodeFormats.reduce((acc, f) => acc | encodeFormat(f), 0);
    case "Any":
      return (1 << barcodeFormatsWithMeta.length) - 1;
    case "None":
      return 0;
    default: {
      return 1 << barcodeFormats.indexOf(format);
    }
  }
}

/**
 * Decodes a numeric format value into a barcode format string.
 *
 * @param number - A numeric value representing the encoded barcode format
 * @returns The decoded barcode format string
 *
 * @remarks
 * Uses bit position to determine the format, where the position of the highest set bit
 * corresponds to an index in the barcode formats array. Returns "None" for zero value.
 */
export function decodeFormat(number: number): ReadOutputBarcodeFormat {
  if (number === 0) {
    return "None";
  }
  const index = 31 - Math.clz32(number);
  return barcodeFormats[index];
}

/**
 * Encodes an array of barcode formats into a single numeric value using bitwise operations.
 *
 * @param formats - Array of barcode formats to be encoded
 * @returns A number representing the combined encoded formats using bitwise OR operations
 */
export function encodeFormats(formats: LooseBarcodeFormat[]): number {
  return formats.reduce((acc, format) => acc | encodeFormat(format), 0);
}

/**
 * Decodes a numeric value into an array of barcode formats based on bit flags.
 *
 * @param number - A numeric value where each bit represents a different barcode format
 * @returns An array of decoded BarcodeFormat values. Returns empty array if input is 0
 *
 * @remarks
 * This function uses bitwise operations to decode a number into individual barcode formats.
 * Each bit position in the input number corresponds to a specific barcode format.
 * The function iterates through each bit, and if set, adds the corresponding format to the result array.
 */
export function decodeFormats(number: number): BarcodeFormat[] {
  const formats: BarcodeFormat[] = [];
  if (number === 0) {
    return formats;
  }
  let code = 1;
  while (code <= number) {
    if (number & code) {
      formats.push(decodeFormat(code) as BarcodeFormat);
    }
    code <<= 1;
  }
  return formats;
}
