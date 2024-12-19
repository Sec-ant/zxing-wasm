import type { Merge } from "type-fest";
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

export type ZXingReaderModuleFactory =
  EmscriptenModuleFactory<ZXingReaderModule>;

export type ZXingWriterModuleFactory =
  EmscriptenModuleFactory<ZXingWriterModule>;

export type ZXingFullModuleFactory = EmscriptenModuleFactory<ZXingFullModule>;

interface TypeModuleMap {
  reader: [ZXingReaderModule, ZXingReaderModuleFactory];
  writer: [ZXingWriterModule, ZXingWriterModuleFactory];
  full: [ZXingFullModule, ZXingFullModuleFactory];
}

export type ZXingModule<T extends ZXingModuleType = ZXingModuleType> =
  TypeModuleMap[T][0];

export type ZXingModuleFactory<T extends ZXingModuleType = ZXingModuleType> =
  TypeModuleMap[T][1];

export type ZXingModuleOverrides = Partial<EmscriptenModule>;

export const ZXING_WASM_VERSION = NPM_PACKAGE_VERSION;

const DEFAULT_MODULE_OVERRIDES: ZXingModuleOverrides = import.meta.env.PROD
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

type CachedValue<T extends ZXingModuleType = ZXingModuleType> =
  | [ZXingModuleOverrides]
  | [ZXingModuleOverrides, Promise<ZXingModule<T>>];

const __CACHE__ = new WeakMap<ZXingModuleFactory, CachedValue>();

export interface PrepareZXingModuleOptions {
  /**
   * The Emscripten module overrides to be passed to the factory function.
   * The `locateFile` function is overridden by default to load the WASM file from the jsDelivr CDN.
   */
  overrides?: ZXingModuleOverrides;
  /**
   * A function to compare the cached overrides with the input overrides.
   * So that the module promise can be reused if the overrides are the same.
   * Defaults to a shallow equality function.
   */
  equalityFn?: (
    cachedOverrides: ZXingModuleOverrides,
    overrides: ZXingModuleOverrides,
  ) => boolean;
  /**
   * Whether to instantiate the module immediately.
   * If `true`, the module is eagerly instantiated and a promise of the module is returned.
   * If `false`, only the overrides are updated and module instantiation is deferred
   * to the first read/write operation.
   *
   * @default false
   */
  fireImmediately?: boolean;
}

/**
 * A shallow equality function to compare two objects.
 */
export function shallow(a: ZXingModuleOverrides, b: ZXingModuleOverrides) {
  return (
    Object.is(a, b) ||
    (Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every(
        (key) =>
          Object.prototype.hasOwnProperty.call(b, key) &&
          a[key as keyof ZXingModuleOverrides] ===
            b[key as keyof ZXingModuleOverrides],
      ))
  );
}

export function prepareZXingModuleWithFactory<T extends ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  options?: Merge<PrepareZXingModuleOptions, { fireImmediately?: false }>,
): void;

export function prepareZXingModuleWithFactory<T extends ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  options: Merge<PrepareZXingModuleOptions, { fireImmediately: true }>,
): Promise<ZXingModule<T>>;

export function prepareZXingModuleWithFactory<T extends ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  options?: PrepareZXingModuleOptions,
): void | Promise<ZXingModule<T>>;

export function prepareZXingModuleWithFactory<T extends ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  {
    overrides,
    equalityFn = shallow,
    fireImmediately = false,
  }: PrepareZXingModuleOptions = {},
) {
  // look up the cached overrides and module promise
  const [cachedOverrides, cachedPromise] = (__CACHE__.get(zxingModuleFactory) as
    | CachedValue<T>
    | undefined) ?? [DEFAULT_MODULE_OVERRIDES];

  // resolve the input overrides
  const resolvedOverrides = overrides ?? cachedOverrides;

  let cacheHit: boolean | undefined;

  // if the module is to be instantiated immediately
  if (fireImmediately) {
    // if cache is hit and a cached promise is available,
    // return the cached promise directly
    if (
      cachedPromise &&
      (cacheHit = equalityFn(cachedOverrides, resolvedOverrides))
    ) {
      return cachedPromise;
    }
    // otherwise, instantiate the module
    const modulePromise = zxingModuleFactory({
      ...resolvedOverrides,
    }) as Promise<ZXingModule<T>>;
    // cache the overrides and the promise
    __CACHE__.set(zxingModuleFactory, [resolvedOverrides, modulePromise]);
    // and return the promise
    return modulePromise;
  }

  // otherwise only update the cache if the overrides have changed
  if (!(cacheHit ?? equalityFn(cachedOverrides, resolvedOverrides))) {
    __CACHE__.set(zxingModuleFactory, [resolvedOverrides]);
  }
}

export function purgeZXingModuleWithFactory<T extends ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
) {
  __CACHE__.delete(zxingModuleFactory);
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
  const zxingModule = await prepareZXingModuleWithFactory(zxingModuleFactory, {
    fireImmediately: true,
  });
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
  const zxingModule = await prepareZXingModuleWithFactory(zxingModuleFactory, {
    fireImmediately: true,
  });
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
