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
  ["DXFilmEdge", "L", "W-"],
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

export function decodeFormat(number: number): ReadOutputBarcodeFormat {
  if (number === 0) {
    return "None";
  }
  const index = 31 - Math.clz32(number);
  return barcodeFormats[index];
}

export function encodeFormats(formats: LooseBarcodeFormat[]): number {
  return formats.reduce((acc, format) => acc | encodeFormat(format), 0);
}

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
