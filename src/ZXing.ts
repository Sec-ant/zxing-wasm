export type ZXingWasm = () => Promise<ZXingInstance>;

const ZXingWeakMap: WeakMap<ZXingWasm, Promise<ZXingInstance>> = new WeakMap();
export function getZXingInstance(ZXing: ZXingWasm): Promise<ZXingInstance> {
  if (!ZXingWeakMap.has(ZXing)) {
    const zxingInstancePromise = ZXing();
    ZXingWeakMap.set(ZXing, zxingInstancePromise);
    return zxingInstancePromise;
  } else {
    return ZXingWeakMap.get(ZXing) as Promise<ZXingInstance>;
  }
}

export const ZXING_BARCODE_FORMAT_NAMES = [
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

export type ZXingBarcodeFormat = typeof ZXING_BARCODE_FORMAT_NAMES[number];

export type ZXingReadResultBarcodeFormat = Exclude<
  ZXingBarcodeFormat,
  "Linear-Codes" | "Matrix-Codes"
>;

export type ZXingReadInputBarcodeFormat = Exclude<ZXingBarcodeFormat, "None">;

export type ZXingWriteInputBarcodeFormat = Exclude<
  ZXingBarcodeFormat,
  "None" | "DataBar" | "DataBarExpanded" | "MaxiCode" | "MicroQRCode"
>;

export const ZXING_CHARACTOR_SET_NAMES = [
  "Cp437",
  "ISO-8859-1",
  "ISO-8859-2",
  "ISO-8859-3",
  "ISO-8859-4",
  "ISO-8859-5",
  "ISO-8859-6",
  "ISO-8859-7",
  "ISO-8859-8",
  "ISO-8859-9",
  "ISO-8859-10",
  "ISO-8859-11",
  "ISO-8859-13",
  "ISO-8859-14",
  "ISO-8859-15",
  "ISO-8859-16",
  "SJIS",
  "Shift_JIS",
  "Cp1250",
  "windows-1250",
  "Cp1251",
  "windows-1251",
  "Cp1252",
  "windows-1252",
  "Cp1256",
  "windows-1256",
  "UTF-16BE",
  "UTF-16LE",
  "UTF-32BE",
  "UTF-32LE",
  "UnicodeBigUnmarked",
  "UnicodeBig",
  "UTF-8",
  "ASCII",
  "US-ASCII",
  "Big5",
  "GB2312",
  "GB18030",
  "EUC-CN",
  "GBK",
  "EUC-KR",
  "BINARY",
] as const;

export type ZXingCharacterSet = typeof ZXING_CHARACTOR_SET_NAMES[number];

// -1 is default
export type ZXingEccLevel = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface ZXingPointI {
  x: number;
  y: number;
}

export interface ZXingPosition {
  bottomLeft: ZXingPointI;
  bottomRight: ZXingPointI;
  topLeft: ZXingPointI;
  topRight: ZXingPointI;
}

export interface ZXingInnerReadResult {
  format: string;
  text: string;
  error: string;
  position: ZXingPosition;
}

export interface ZXingInnerReadResultVector {
  size: () => number;
  get: (i: number) => ZXingInnerReadResult | undefined;
}

export interface ZXingInnerWriteResult {
  image: Uint8Array | null;
  error: string;
  delete: () => void;
}

export interface ZXingInstance extends WebAssembly.Instance {
  _malloc(size: number): number;
  _free(prt: number): void;

  HEAP8: Int8Array;
  HEAP16: Int16Array;
  HEAP32: Int32Array;
  HRAPF32: Float32Array;
  HEAPF64: Float64Array;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAPU32: Uint32Array;

  // encoded image: .png, .jpeg, etc.
  readBarcodeFromImage(
    bufferPtr: number,
    bufferLength: number,
    tryHarder: boolean,
    formats: string,
    maxNumberOfSymbols: number
  ): ZXingInnerReadResultVector;

  // raw image data
  readBarcodeFromPixmap(
    bufferPtr: number,
    imgWidth: number,
    imgHeight: number,
    tryHarder: boolean,
    formats: string,
    maxNumberOfSymbols: number
  ): ZXingInnerReadResultVector;

  // png
  writeBarcodeToImage(
    text: string,
    format: string,
    encoding: string,
    margin: number,
    width: number,
    height: number,
    eccLevel: number
  ): ZXingInnerWriteResult;
}

export interface ZXingReadResult extends Omit<ZXingInnerReadResult, "format"> {
  format: ZXingReadResultBarcodeFormat;
}

export interface ZXingReadOptions {
  tryHarder?: boolean;
  formats?: readonly ZXingReadInputBarcodeFormat[];
  maxNumberOfSymbols?: number;
}

export const defaultZXingReadOptions: Required<ZXingReadOptions> = {
  tryHarder: true,
  formats: [],
  maxNumberOfSymbols: Infinity,
};

export interface ZXingWriteResult
  extends Omit<ZXingInnerWriteResult, "image" | "delete"> {
  image: Blob | null;
}

export interface ZXingWriteOptions {
  format?: ZXingWriteInputBarcodeFormat;
  charset?: ZXingCharacterSet;
  quietZone?: number;
  width?: number;
  height?: number;
  eccLevel?: ZXingEccLevel;
}

export const defaultZXingWriteOptions: Required<ZXingWriteOptions> = {
  format: "QRCode",
  charset: "UTF-8",
  quietZone: 10,
  width: 200,
  height: 200,
  eccLevel: -1,
};

export async function readBarcodeFromImageFile(
  imageFile: Blob | File,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxNumberOfSymbols = defaultZXingReadOptions.maxNumberOfSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions,
  ZXing: ZXingWasm
): Promise<ZXingReadResult[]> {
  const zxingInstance = await getZXingInstance(ZXing);
  const { size } = imageFile;
  const imageFileData = new Uint8Array(await imageFile.arrayBuffer());
  const bufferPtr = zxingInstance._malloc(size);
  zxingInstance.HEAP8.set(imageFileData, bufferPtr);
  const resultVector = zxingInstance.readBarcodeFromImage(
    bufferPtr,
    size,
    tryHarder,
    formatsToString(formats),
    maxNumberOfSymbols
  );
  zxingInstance._free(bufferPtr);
  const results: ZXingReadResult[] = [];
  for (let i = 0; i < resultVector.size(); ++i) {
    const result = resultVector.get(i) as ZXingInnerReadResult;
    results.push({
      ...result,
      format: formatFromString(result.format) as ZXingReadResultBarcodeFormat,
    });
  }
  return results;
}

export async function readBarcodeFromImageData(
  imageData: ImageData,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxNumberOfSymbols = defaultZXingReadOptions.maxNumberOfSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions,
  ZXing: ZXingWasm
): Promise<ZXingReadResult[]> {
  const zxingInstance = await getZXingInstance(ZXing);
  const {
    data,
    width,
    height,
    data: { byteLength },
  } = imageData;
  const bufferPtr = zxingInstance._malloc(byteLength);
  zxingInstance.HEAP8.set(data, bufferPtr);
  const resultVector = zxingInstance.readBarcodeFromPixmap(
    bufferPtr,
    width,
    height,
    tryHarder,
    formatsToString(formats),
    maxNumberOfSymbols
  );
  zxingInstance._free(bufferPtr);
  const results: ZXingReadResult[] = [];
  for (let i = 0; i < resultVector.size(); ++i) {
    const result = resultVector.get(i) as ZXingInnerReadResult;
    results.push({
      ...result,
      format: formatFromString(result.format) as ZXingReadResultBarcodeFormat,
    });
  }
  return results;
}

export async function writeBarcodeToImageFile(
  text: string,
  {
    format = defaultZXingWriteOptions.format,
    charset = defaultZXingWriteOptions.charset,
    quietZone = defaultZXingWriteOptions.quietZone,
    width = defaultZXingWriteOptions.width,
    height = defaultZXingWriteOptions.height,
    eccLevel = defaultZXingWriteOptions.eccLevel,
  }: ZXingWriteOptions = defaultZXingWriteOptions,
  ZXing: ZXingWasm
): Promise<ZXingWriteResult> {
  const zxingInstance = await getZXingInstance(ZXing);
  const result = zxingInstance.writeBarcodeToImage(
    text,
    format,
    charset,
    quietZone,
    width,
    height,
    eccLevel
  );
  const { image, error } = result;
  result.delete();
  if (image) {
    return {
      image: new Blob([new Uint8Array(image)], {
        type: "image/png",
      }),
      error: "",
    };
  } else {
    return {
      image: null,
      error: error,
    };
  }
}

function formatsToString(formats: readonly ZXingBarcodeFormat[]): string {
  return formats.join("|");
}

// @ts-ignore
function formatsFromString(
  formatString: string
): readonly ZXingBarcodeFormat[] {
  return formatString
    .split(/ |,|\|]/)
    .map((format) => formatFromString(format));
}

function formatFromString(format: string): ZXingBarcodeFormat {
  const normalizedTarget = normalizeFormatString(format);
  let start = 0;
  let end = ZXING_BARCODE_FORMAT_NAMES.length - 1;
  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const midElement = ZXING_BARCODE_FORMAT_NAMES[mid];
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

function normalizeFormatString(format: string): string {
  return format.toLowerCase().replace(/_-\[\]/g, "");
}
