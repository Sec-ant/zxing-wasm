import {
  ZXingDecodeHints,
  DecodeHints,
  decodeHintsToZXingDecodeHints,
  defaultDecodeHints,
  ZXingEncodeHints,
  EncodeHints,
  defaultEncodeHints,
  encodeHintsToZXingEncodeHints,
  ZXingReadResult,
  ReadResult,
  zxingReadResultToReadResult,
  ZXingWriteResult,
  zxingWriteResultToWriteResult,
  ZXingBinarizer,
  ZXingCharacterSet,
  ZXingContentType,
  ZXingEanAddOnSymbol,
  ZXingTextMode,
} from "./bindings/index.js";

export interface ZXingVector<T> {
  size: () => number;
  get: (i: number) => T | undefined;
}

export type ZXingModuleType = "reader" | "writer" | "full";

export interface ZXingBaseModule extends EmscriptenModule {
  CharacterSet: ZXingCharacterSet;
}

export interface ZXingReaderModule extends ZXingBaseModule {
  Binarizer: ZXingBinarizer;
  ContentType: ZXingContentType;
  EanAddOnSymbol: ZXingEanAddOnSymbol;
  TextMode: ZXingTextMode;

  readBarcodesFromImage(
    bufferPtr: number,
    bufferLength: number,
    zxingDecodeHints: ZXingDecodeHints,
  ): ZXingVector<ZXingReadResult>;

  readBarcodesFromPixmap(
    bufferPtr: number,
    imgWidth: number,
    imgHeight: number,
    zxingDecodeHints: ZXingDecodeHints,
  ): ZXingVector<ZXingReadResult>;
}

export interface ZXingWriterModule extends ZXingBaseModule {
  writeBarcodeToImage(
    text: string,
    zxingEncodeHints: ZXingEncodeHints,
  ): ZXingWriteResult;
}

export interface ZXingFullModule extends ZXingReaderModule, ZXingWriterModule {}

export type ZXingModule<T extends ZXingModuleType = ZXingModuleType> =
  T extends "reader"
    ? ZXingReaderModule
    : T extends "writer"
    ? ZXingWriterModule
    : T extends "full"
    ? ZXingFullModule
    : ZXingReaderModule | ZXingWriterModule | ZXingFullModule;

export type ZXingModuleFactory<T extends ZXingModuleType = ZXingModuleType> =
  EmscriptenModuleFactory<ZXingModule<T>>;

export type ZXingModuleOverrides<T extends ZXingModuleType = ZXingModuleType> =
  Partial<ZXingModule<T>>;

const defaultZXingModuleOverrides: ZXingModuleOverrides = import.meta.env.PROD
  ? {
      locateFile: (path, prefix) => {
        if (/\.wasm$/.test(path)) {
          return `https://fastly.jsdelivr.net/npm/@sec-ant/zxing-wasm@${NPM_PACKAGE_VERSION}/dist/wasm/${path}`;
        }
        return prefix + path;
      },
    }
  : {
      locateFile: (path, prefix) => {
        const match = path.match(/_(.+?)\.wasm$/);
        if (match) {
          return `/src/${match[1]}/${path}`;
        }
        return prefix + path;
      },
    };

interface ZXingWeakMapValue<T extends ZXingModuleType = ZXingModuleType> {
  moduleOverrides: ZXingModuleOverrides<T>;
  modulePromise?: Promise<ZXingModule<T>>;
}

type ZXingWeakMap = WeakMap<ZXingModuleFactory, ZXingWeakMapValue>;

let zxingWeakMap: ZXingWeakMap = new WeakMap();

export function getZXingModuleWithFactory<
  T extends ZXingModuleType = ZXingModuleType,
>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  zxingModuleOverrides?: ZXingModuleOverrides<T>,
) {
  const zxingWeakMapValue = zxingWeakMap.get(zxingModuleFactory) as
    | ZXingWeakMapValue<T>
    | undefined;

  if (
    zxingWeakMapValue?.modulePromise &&
    (zxingModuleOverrides === undefined ||
      Object.is(zxingModuleOverrides, zxingWeakMapValue.moduleOverrides))
  ) {
    return zxingWeakMapValue.modulePromise;
  }

  const resolvedModuleOverrides =
    zxingModuleOverrides ??
    zxingWeakMapValue?.moduleOverrides ??
    (defaultZXingModuleOverrides as ZXingModuleOverrides<T>);

  const modulePromise = zxingModuleFactory(resolvedModuleOverrides);
  zxingWeakMap.set(zxingModuleFactory, {
    moduleOverrides: resolvedModuleOverrides,
    modulePromise,
  });
  return modulePromise;
}

export function purgeZXingModule() {
  zxingWeakMap = new WeakMap();
}

export function setZXingModuleOverridesWithFactory<
  T extends ZXingModuleType = ZXingModuleType,
>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  zxingModuleOverrides: ZXingModuleOverrides<T>,
) {
  zxingWeakMap.set(zxingModuleFactory, {
    moduleOverrides: zxingModuleOverrides,
  });
}

export async function readBarcodesFromImageFileWithFactory<
  T extends "reader" | "full",
>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  imageFile: Blob | File,
  decodeHints: DecodeHints = defaultDecodeHints,
) {
  const requiredDecodeHints: Required<DecodeHints> = {
    ...defaultDecodeHints,
    ...decodeHints,
  };
  const zxingModule = await getZXingModuleWithFactory(zxingModuleFactory);
  const { size } = imageFile;
  const buffer = new Uint8Array(await imageFile.arrayBuffer());
  const bufferPtr = zxingModule._malloc(size);
  zxingModule.HEAPU8.set(buffer, bufferPtr);
  const zxingReadResultVector = zxingModule.readBarcodesFromImage(
    bufferPtr,
    size,
    decodeHintsToZXingDecodeHints(zxingModule, requiredDecodeHints),
  );
  zxingModule._free(bufferPtr);
  console.log(zxingReadResultVector);
  const readResults: ReadResult[] = [];
  for (let i = 0; i < zxingReadResultVector.size(); ++i) {
    readResults.push(
      zxingReadResultToReadResult(zxingReadResultVector.get(i)!),
    );
  }
  return readResults;
}

export async function readBarcodesFromImageDataWithFactory<
  T extends "reader" | "full",
>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  imageData: ImageData,
  decodeHints: DecodeHints = defaultDecodeHints,
) {
  const requiredDecodeHints: Required<DecodeHints> = {
    ...defaultDecodeHints,
    ...decodeHints,
  };
  const zxingModule = await getZXingModuleWithFactory(zxingModuleFactory);
  const {
    data: buffer,
    width,
    height,
    data: { byteLength: size },
  } = imageData;
  const bufferPtr = zxingModule._malloc(size);
  zxingModule.HEAPU8.set(buffer, bufferPtr);
  const zxingReadResultVector = zxingModule.readBarcodesFromPixmap(
    bufferPtr,
    width,
    height,
    decodeHintsToZXingDecodeHints(zxingModule, requiredDecodeHints),
  );
  zxingModule._free(bufferPtr);
  const readResults: ReadResult[] = [];
  for (let i = 0; i < zxingReadResultVector.size(); ++i) {
    readResults.push(
      zxingReadResultToReadResult(zxingReadResultVector.get(i)!),
    );
  }
  return readResults;
}

export async function writeBarcodeToImageFileWithFactory<
  T extends "writer" | "full",
>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  text: string,
  encodeHints: EncodeHints = defaultEncodeHints,
) {
  const requiredEncodeHints: Required<EncodeHints> = {
    ...defaultEncodeHints,
    ...encodeHints,
  };
  const zxingModule = await getZXingModuleWithFactory(zxingModuleFactory);
  const zxingWriteResult = zxingModule.writeBarcodeToImage(
    text,
    encodeHintsToZXingEncodeHints(zxingModule, requiredEncodeHints),
  );
  return zxingWriteResultToWriteResult(zxingWriteResult);
}
