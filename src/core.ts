import { createStore } from "zustand/vanilla";

// #region ZXing Module

export type ZXingModuleType = "reader" | "writer";

export type ZXingModuleFactory<
  T extends ZXingModuleType = "reader" | "writer",
> = EmscriptenModuleFactory<ZXingModule<T>>;

export type ZXingModuleFactoryTypeExtractor<F> = F extends ZXingModuleFactory<
  infer T
>
  ? T
  : never;

type ZXingModuleWeakMap<T extends ZXingModuleType = ZXingModuleType> = WeakMap<
  ZXingModuleFactory<T>,
  Promise<ZXingModule<T>>
>;

export type ZXingModuleOverrides<T extends ZXingModuleType = ZXingModuleType> =
  Partial<ZXingModule<T>>;

interface ZXingState {
  zxingModuleWeakMap: ZXingModuleWeakMap;
  zxingModuleOverrides: ZXingModuleOverrides;
}

const defaultZXingModuleOverrides: ZXingModuleOverrides = import.meta.env.PROD
  ? {
      locateFile: (path, prefix) => {
        if (/\.wasm$/.test(path)) {
          return `https://fastly.jsdelivr.net/npm/@sec-ant/zxing-wasm@${NPM_PACKAGE_VERSION}/dist/wasm/${path}`;
        }
        return prefix + path;
      },
    }
  : {};

const zxingStore = createStore<ZXingState>()(() => ({
  zxingModuleWeakMap: new WeakMap(),
  zxingModuleOverrides: defaultZXingModuleOverrides,
}));

export function setZXingModuleOverrides(
  zxingModuleOverrides: ZXingModuleOverrides,
) {
  zxingStore.setState({
    zxingModuleOverrides,
  });
}

export function getZXingModule<T extends ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  zxingModuleOverrides = zxingStore.getState()
    .zxingModuleOverrides as ZXingModuleOverrides<T>,
): Promise<ZXingModule<T>> {
  const { zxingModuleWeakMap } = zxingStore.getState();
  const registeredZXingModulePromise = zxingModuleWeakMap.get(
    zxingModuleFactory,
  ) as Promise<ZXingModule<T>> | undefined;
  // already registered with the same overrides
  if (
    registeredZXingModulePromise &&
    Object.is(zxingModuleOverrides, zxingStore.getState().zxingModuleOverrides)
  ) {
    return registeredZXingModulePromise;
  }
  // otherwise
  else {
    zxingStore.setState({
      zxingModuleOverrides,
    });
    const zxingModulePromise = zxingModuleFactory(zxingModuleOverrides);
    zxingModuleWeakMap.set(zxingModuleFactory, zxingModulePromise);
    return zxingModulePromise;
  }
}

export function purgeZXingModule() {
  zxingStore.setState({
    zxingModuleWeakMap: new WeakMap(),
  });
}

interface ZXingReaderModule extends EmscriptenModule {
  // encoded image: .png, .jpeg, etc.
  readBarcodesFromImage(
    bufferPtr: number,
    bufferLength: number,
    tryHarder: boolean,
    formats: string,
    maxSymbols: number,
  ): ZXingVector<ZXingReadInnerOutput>;

  // raw image data
  readBarcodesFromPixmap(
    bufferPtr: number,
    imgWidth: number,
    imgHeight: number,
    tryHarder: boolean,
    formats: string,
    maxSymbols: number,
  ): ZXingVector<ZXingReadInnerOutput>;
}

interface ZXingWriterModule extends EmscriptenModule {
  // png
  writeBarcodeToImage(
    text: string,
    format: string,
    encoding: string,
    margin: number,
    width: number,
    height: number,
    eccLevel: number,
  ): ZXingWriteInnerOutput;
}

export type ZXingModule<T extends ZXingModuleType = "reader" | "writer"> =
  T extends "reader"
    ? T extends "writer"
      ? ZXingReaderModule & ZXingWriterModule
      : ZXingReaderModule
    : T extends "writer"
    ? ZXingWriterModule
    : never;

// #endregion

// #region ZXing Barcode Format

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

export type ZXingBarcodeFormat = (typeof ZXING_BARCODE_FORMAT_NAMES)[number];

export type ZXingReadInputBarcodeFormat = Exclude<ZXingBarcodeFormat, "None">;
export type ZXingWriteInputBarcodeFormat = Exclude<
  ZXingBarcodeFormat,
  | "DataBar"
  | "DataBarExpanded"
  | "MaxiCode"
  | "MicroQRCode"
  | "None"
  | "Linear-Codes"
  | "Matrix-Codes"
>;
export type ZXingReadOutputBarcodeFormat = Exclude<
  ZXingBarcodeFormat,
  "Linear-Codes" | "Matrix-Codes"
>;

// #endregion

// #region ZXing Character Set

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

export type ZXingCharacterSet = (typeof ZXING_CHARACTOR_SET_NAMES)[number];

// #endregion

// #region ZXing ECC Level

export type ZXingWriteInputECCLevel = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // default = -1

export type ZXingReadOutputECCLevel = "L" | "M" | "Q" | "H";

// #endregion

// #region ZXing Point and ZXing Position

export interface ZXingPoint {
  x: number;
  y: number;
}

export interface ZXingPosition {
  bottomLeft: ZXingPoint;
  bottomRight: ZXingPoint;
  topLeft: ZXingPoint;
  topRight: ZXingPoint;
}

// #endregion

// #region ZXing Vector

export interface ZXingVector<T> {
  size: () => number;
  get: (i: number) => T | undefined;
}

// #endregion

// #region ZXing Inner Output

export interface ZXingReadInnerOutput {
  format: string;
  text: string;
  bytes: Uint8Array;
  error: string;
  position: ZXingPosition;
  symbologyIdentifier: string;
  eccLevel: ZXingReadOutputECCLevel;
  version: string;
  orientation: number;
  isMirrored: boolean;
  isInverted: boolean;
}

export interface ZXingWriteInnerOutput {
  image: Uint8Array | null;
  error: string;
  delete: () => void;
}

// #endregion

// #region ZXing Output

export interface ZXingReadOutput extends Omit<ZXingReadInnerOutput, "format"> {
  format: ZXingReadOutputBarcodeFormat;
}
export interface ZXingWriteOutput
  extends Omit<ZXingWriteInnerOutput, "image" | "delete"> {
  image: Blob | null;
}

// #endregion

// #region ZXing Options

export interface ZXingReadOptions {
  tryHarder?: boolean;
  formats?: ZXingReadInputBarcodeFormat[];
  maxSymbols?: number;
}

export interface ZXingWriteOptions {
  format?: ZXingWriteInputBarcodeFormat;
  charset?: ZXingCharacterSet;
  quietZone?: number;
  width?: number;
  height?: number;
  eccLevel?: ZXingWriteInputECCLevel;
}

export const defaultZXingReadOptions: Required<ZXingReadOptions> = {
  tryHarder: true,
  formats: [],
  maxSymbols: 255,
};

export const defaultZXingWriteOptions: Required<ZXingWriteOptions> = {
  format: "QRCode",
  charset: "UTF-8",
  quietZone: 10,
  width: 200,
  height: 200,
  eccLevel: -1,
};

// #endregion

// #region Barcode Read/Write Functions

export async function readBarcodesFromImageFile<T extends "reader">(
  imageFile: Blob | File,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxSymbols = defaultZXingReadOptions.maxSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions,
  zxingModuleFactory: ZXingModuleFactory<T>,
): Promise<ZXingReadOutput[]> {
  const zxingInstance = await getZXingModule(
    zxingModuleFactory,
    zxingStore.getState().zxingModuleOverrides as ZXingModuleOverrides<T>,
  );
  const { size } = imageFile;
  const imageFileData = new Uint8Array(await imageFile.arrayBuffer());
  const bufferPtr = zxingInstance._malloc(size);
  zxingInstance.HEAPU8.set(imageFileData, bufferPtr);
  const resultVector = zxingInstance.readBarcodesFromImage(
    bufferPtr,
    size,
    tryHarder,
    formatsToString(formats),
    maxSymbols,
  );
  zxingInstance._free(bufferPtr);
  const results: ZXingReadOutput[] = [];
  for (let i = 0; i < resultVector.size(); ++i) {
    const result = resultVector.get(i) as ZXingReadInnerOutput;
    results.push({
      ...result,
      format: formatFromString(result.format) as ZXingReadOutputBarcodeFormat,
    });
  }
  return results;
}

export async function readBarcodesFromImageData<T extends "reader">(
  imageData: ImageData,
  {
    tryHarder = defaultZXingReadOptions.tryHarder,
    formats = defaultZXingReadOptions.formats,
    maxSymbols = defaultZXingReadOptions.maxSymbols,
  }: ZXingReadOptions = defaultZXingReadOptions,
  zxingModuleFactory: ZXingModuleFactory<T>,
): Promise<ZXingReadOutput[]> {
  const zxingInstance = await getZXingModule(
    zxingModuleFactory,
    zxingStore.getState().zxingModuleOverrides as ZXingModuleOverrides<T>,
  );
  const {
    data,
    width,
    height,
    data: { byteLength },
  } = imageData;
  const bufferPtr = zxingInstance._malloc(byteLength);
  zxingInstance.HEAPU8.set(data, bufferPtr);
  const resultVector = zxingInstance.readBarcodesFromPixmap(
    bufferPtr,
    width,
    height,
    tryHarder,
    formatsToString(formats),
    maxSymbols,
  );
  zxingInstance._free(bufferPtr);
  const results: ZXingReadOutput[] = [];
  for (let i = 0; i < resultVector.size(); ++i) {
    const result = resultVector.get(i) as ZXingReadInnerOutput;
    results.push({
      ...result,
      format: formatFromString(result.format) as ZXingReadOutputBarcodeFormat,
    });
  }
  return results;
}

export async function writeBarcodeToImageFile<T extends "writer">(
  text: string,
  {
    format = defaultZXingWriteOptions.format,
    charset = defaultZXingWriteOptions.charset,
    quietZone = defaultZXingWriteOptions.quietZone,
    width = defaultZXingWriteOptions.width,
    height = defaultZXingWriteOptions.height,
    eccLevel = defaultZXingWriteOptions.eccLevel,
  }: ZXingWriteOptions = defaultZXingWriteOptions,
  zxingModuleFactory: ZXingModuleFactory<T>,
): Promise<ZXingWriteOutput> {
  const zxingInstance = await getZXingModule(
    zxingModuleFactory,
    zxingStore.getState().zxingModuleOverrides as ZXingModuleOverrides<T>,
  );
  const result = zxingInstance.writeBarcodeToImage(
    text,
    format,
    charset,
    quietZone,
    width,
    height,
    eccLevel,
  );
  const { image, error } = result;
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

// #endregion

// #region Helper Functions

function formatsToString(formats: ZXingBarcodeFormat[]): string {
  return formats.join("|");
}

// function formatsFromString(formatString: string): ZXingBarcodeFormat[] {
//   return formatString
//     .split(/ |,|\|]/)
//     .map((format) => formatFromString(format));
// }

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

// #endregion
