export const barcodeFormats = [
  "Aztec",
  "Codabar",
  "Code128",
  "Code39",
  "Code93",
  "DataBar",
  "DataBarExpanded",
  "DataMatrix",
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
  "UPC-A",
  "UPC-E",
] as const;

export type BarcodeFormat = (typeof barcodeFormats)[number];

/**
 * Barcode formats that can be used in {@link DecodeHints.formats | `DecodeHints.formats`} to read barcodes.
 */
export type ReadInputBarcodeFormat = Exclude<BarcodeFormat, "None">;

/**
 * Barcode formats that can be used in {@link EncodeHints.format | `DecodeHints.format`} to write barcodes.
 */
export type WriteInputBarcodeFormat = Exclude<
  BarcodeFormat,
  | "DataBar"
  | "DataBarExpanded"
  | "MaxiCode"
  | "MicroQRCode"
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
    } else if (normalizedMidElement < normalizedTarget) {
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
