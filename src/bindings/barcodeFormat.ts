export const barcodeFormats = [
  "Aztec",
  "Codabar",
  "Code128",
  "Code39",
  "Code93",
  "DataBar",
  "DataBarExpanded",
  "DataBarLimited",
  "DataMatrix",
  "DXFilmEdge",
  "EAN-13",
  "EAN-8",
  "ITF",
  "Linear-Codes",
  "Matrix-Codes",
  "MaxiCode",
  "MicroQRCode",
  "None",
  "PDF417",
  "QRCode",
  "rMQRCode",
  "UPC-A",
  "UPC-E",
] as const;

/**
 * @internal
 */
export type BarcodeFormat = (typeof barcodeFormats)[number];

/**
 * Barcode formats that can be used in {@link ReaderOptions.formats | `ReaderOptions.formats`} to read barcodes.
 */
export type ReadInputBarcodeFormat = Exclude<BarcodeFormat, "None">;

/**
 * Barcode formats that can be used in {@link WriterOptions.format | `WriterOptions.format`} to write barcodes.
 */
export type WriteInputBarcodeFormat = Exclude<
  BarcodeFormat,
  | "DataBar"
  | "DataBarExpanded"
  | "DataBarLimited"
  | "DXFilmEdge"
  | "MaxiCode"
  | "MicroQRCode"
  | "rMQRCode"
  | "None"
  | "Linear-Codes"
  | "Matrix-Codes"
>;

/**
 * Barcode formats that may be returned in {@link ReadResult.format} in read functions.
 */
export type ReadOutputBarcodeFormat = Exclude<
  BarcodeFormat,
  "Linear-Codes" | "Matrix-Codes"
>;

export function formatsToString(formats: BarcodeFormat[]): string {
  return formats.join("|");
}

export function formatsFromString(formatString: string): BarcodeFormat[] {
  return formatString
    .split(/ |,|\|]/)
    .map((format) => formatFromString(format));
}

export function formatFromString(format: string): BarcodeFormat {
  const normalizedTarget = normalizeFormatString(format);
  let start = 0;
  let end = barcodeFormats.length - 1;
  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const midElement = barcodeFormats[mid];
    const normalizedMidElement = normalizeFormatString(midElement);
    if (normalizedMidElement === normalizedTarget) {
      return midElement;
    }
    if (normalizedMidElement < normalizedTarget) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  return "None";
}

export function normalizeFormatString(format: string): string {
  return format.toLowerCase().replace(/_-\[\]/g, "");
}
