import {
  type ReadResult,
  type ReaderOptions,
  type WriterOptions,
  type ZXingReadResult,
  type ZXingReaderOptions,
  type ZXingVector,
  type ZXingWriteResult,
  type ZXingWriterOptions,
  defaultReaderOptions,
  defaultWriterOptions,
  readerOptionsToZXingReaderOptions,
  writerOptionsToZXingWriterOptions,
  zxingReadResultToReadResult,
  zxingWriteResultToWriteResult,
} from "./bindings/index.js";

export type ZXingModuleType = "reader" | "writer" | "full";

/**
 * @internal
 */
export interface ZXingReaderModule extends EmscriptenModule {
  readBarcodesFromImage(
    bufferPtr: number,
    bufferLength: number,
    zxingReaderOptions: ZXingReaderOptions,
  ): ZXingVector<ZXingReadResult>;

  readBarcodesFromPixmap(
    bufferPtr: number,
    imgWidth: number,
    imgHeight: number,
    zxingReaderOptions: ZXingReaderOptions,
  ): ZXingVector<ZXingReadResult>;
}

/**
 * @internal
 */
export interface ZXingWriterModule extends EmscriptenModule {
  writeBarcodeFromText(
    text: string,
    zxingWriterOptions: ZXingWriterOptions,
  ): ZXingWriteResult;

  writeBarcodeFromBytes(
    bufferPtr: number,
    bufferLength: number,
    zxingWriterOptions: ZXingWriterOptions,
  ): ZXingWriteResult;
}

/**
 * @internal
 */
export interface ZXingFullModule extends ZXingReaderModule, ZXingWriterModule {}

export type ZXingModule<T extends ZXingModuleType = ZXingModuleType> =
  T extends "reader"
    ? ZXingReaderModule
    : T extends "writer"
      ? ZXingWriterModule
      : T extends "full"
        ? ZXingFullModule
        : ZXingReaderModule | ZXingWriterModule | ZXingFullModule;

export type ZXingReaderModuleFactory =
  EmscriptenModuleFactory<ZXingReaderModule>;
export type ZXingWriterModuleFactory =
  EmscriptenModuleFactory<ZXingWriterModule>;
export type ZXingFullModuleFactory = EmscriptenModuleFactory<ZXingFullModule>;

export type ZXingModuleFactory<T extends ZXingModuleType = ZXingModuleType> =
  T extends "reader"
    ? ZXingReaderModuleFactory
    : T extends "writer"
      ? ZXingWriterModuleFactory
      : T extends "full"
        ? ZXingFullModuleFactory
        :
            | ZXingReaderModuleFactory
            | ZXingWriterModuleFactory
            | ZXingFullModuleFactory;

export type ZXingModuleOverrides = Partial<EmscriptenModule>;

const defaultModuleOverrides: ZXingModuleOverrides = import.meta.env.PROD
  ? {
      locateFile: (path, prefix) => {
        const match = path.match(/_(.+?)\.wasm$/);
        if (match) {
          return `https://fastly.jsdelivr.net/npm/zxing-wasm@${NPM_PACKAGE_VERSION}/dist/${match[1]}/${path}`;
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
  moduleOverrides: ZXingModuleOverrides;
  modulePromise?: Promise<ZXingModule<T>>;
}

type ZXingWeakMap = WeakMap<ZXingModuleFactory, ZXingWeakMapValue>;

let zxingWeakMap: ZXingWeakMap = new WeakMap();

export function getZXingModuleWithFactory<T extends ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  zxingModuleOverrides?: ZXingModuleOverrides,
): Promise<ZXingModule<T>> {
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
    defaultModuleOverrides;

  const modulePromise = zxingModuleFactory({
    ...resolvedModuleOverrides,
  }) as Promise<ZXingModule<T>>;

  zxingWeakMap.set(zxingModuleFactory, {
    moduleOverrides: resolvedModuleOverrides,
    modulePromise,
  });

  return modulePromise;
}

export function purgeZXingModule() {
  zxingWeakMap = new WeakMap();
}

export function setZXingModuleOverridesWithFactory<T extends ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  zxingModuleOverrides: ZXingModuleOverrides,
) {
  zxingWeakMap.set(zxingModuleFactory, {
    moduleOverrides: zxingModuleOverrides,
  });
}

export async function readBarcodesWithFactory<T extends "reader" | "full">(
  zxingModuleFactory: ZXingModuleFactory<T>,
  input: Blob | ImageData,
  readerOptions: ReaderOptions = defaultReaderOptions,
) {
  const requiredReaderOptions: Required<ReaderOptions> = {
    ...defaultReaderOptions,
    ...readerOptions,
  };
  const zxingModule = await getZXingModuleWithFactory(zxingModuleFactory);
  let zxingReadResultVector: ZXingVector<ZXingReadResult>;
  let bufferPtr: number;
  if ("size" in input) {
    /* Blob */
    const { size } = input;
    const buffer = new Uint8Array(await input.arrayBuffer());
    bufferPtr = zxingModule._malloc(size);
    zxingModule.HEAPU8.set(buffer, bufferPtr);
    zxingReadResultVector = zxingModule.readBarcodesFromImage(
      bufferPtr,
      size,
      readerOptionsToZXingReaderOptions(requiredReaderOptions),
    );
  } else {
    /* ImageData */
    const { data: buffer, width, height } = input;
    bufferPtr = zxingModule._malloc(buffer.byteLength);
    zxingModule.HEAPU8.set(buffer, bufferPtr);
    zxingReadResultVector = zxingModule.readBarcodesFromPixmap(
      bufferPtr,
      width,
      height,
      readerOptionsToZXingReaderOptions(requiredReaderOptions),
    );
  }
  zxingModule._free(bufferPtr);
  const readResults: ReadResult[] = [];
  for (let i = 0; i < zxingReadResultVector.size(); ++i) {
    readResults.push(
      zxingReadResultToReadResult(zxingReadResultVector.get(i)!),
    );
  }
  return readResults;
}

export async function writeBarcodeWithFactory<T extends "writer" | "full">(
  zxingModuleFactory: ZXingModuleFactory<T>,
  input: string | Uint8Array,
  writerOptions: WriterOptions = defaultWriterOptions,
) {
  const requiredWriterOptions: Required<WriterOptions> = {
    ...defaultWriterOptions,
    ...writerOptions,
  };
  const zxingWriterOptions = writerOptionsToZXingWriterOptions(
    requiredWriterOptions,
  );
  const zxingModule = await getZXingModuleWithFactory(zxingModuleFactory);
  if (typeof input === "string") {
    return zxingWriteResultToWriteResult(
      zxingModule.writeBarcodeFromText(input, zxingWriterOptions),
    );
  }
  const { byteLength } = input;
  const bufferPtr = zxingModule._malloc(byteLength);
  zxingModule.HEAPU8.set(input, bufferPtr);
  const zxingWriteResult = zxingModule.writeBarcodeFromBytes(
    bufferPtr,
    byteLength,
    zxingWriterOptions,
  );
  zxingModule._free(bufferPtr);
  return zxingWriteResultToWriteResult(zxingWriteResult);
}
