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
 * Performs a shallow equality comparison between two objects.
 *
 * @param a - First object to compare
 * @param b - Second object to compare
 * @returns `true` if objects are shallowly equal, `false` otherwise
 *
 * @remarks
 * Objects are considered shallowly equal if:
 * - They are the same reference (Object.is)
 * - They have the same number of keys
 * - All keys in `a` exist in `b` with strictly equal values (===)
 *
 * Note: Only performs first-level comparison of properties. Nested objects
 * are compared by reference, not by their contents.
 *
 * @example
 * ```typescript
 * shallow({a: 1}, {a: 1}) // true
 * shallow({a: 1}, {a: 2}) // false
 * shallow({a: {b: 1}}, {a: {b: 1}}) // false (different object references)
 * ```
 */
export function shallow<T extends Record<string, unknown>>(a: T, b: T) {
  return (
    Object.is(a, b) ||
    (Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every(
        (key) =>
          Object.prototype.hasOwnProperty.call(b, key) &&
          a[key as keyof T] === b[key as keyof T],
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

/**
 * Prepares and caches a ZXing module instance with the specified factory and options.
 *
 * @param zxingModuleFactory - Factory function to create the ZXing module
 * @param options - Configuration options for module preparation
 * @param options.overrides - Custom overrides for module initialization
 * @param options.equalityFn - Function to compare override equality (defaults to shallow comparison)
 * @param options.fireImmediately - Whether to instantiate the module immediately (defaults to false)
 * @returns Promise of the ZXing module instance if fireImmediately is true, otherwise void
 *
 * @remarks
 * This function implements a caching mechanism for ZXing module instances. It stores both
 * the module overrides and the instantiated module promise in a global cache.
 * When fireImmediately is true, it either returns a cached module promise if the overrides match,
 * or creates and caches a new module instance.
 */
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

/**
 * Removes a ZXing module instance from the internal cache.
 *
 * @param zxingModuleFactory - The factory function used to create the ZXing module instance
 *
 * @remarks
 * This function is used to clean up cached ZXing module instances when they are no longer needed.
 * It's particularly useful for memory management in long-running applications.
 */
export function purgeZXingModuleWithFactory<T extends ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
) {
  __CACHE__.delete(zxingModuleFactory);
}

/**
 * Reads barcodes from an image source using a ZXing module factory.
 *
 * @param zxingModuleFactory - Factory function to create a ZXing module instance
 * @param input - Source image as either a Blob or ImageData object
 * @param readerOptions - Optional configuration for barcode reading (defaults to defaultReaderOptions)
 * @returns Promise resolving to an array of ReadResult objects containing decoded barcode data
 *
 * @remarks
 * This function handles both Blob and ImageData inputs differently:
 * - For Blob inputs: Processes the entire blob as a single image
 * - For ImageData: Processes pixel data with specified width and height
 *
 * The function manages memory allocation and deallocation for the ZXing module internally.
 *
 * @throws May throw errors during memory allocation, image processing, or barcode reading
 */
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

/**
 * Generates a barcode image using a ZXing module factory with support for text and binary input.
 *
 * @param zxingModuleFactory - Factory function that creates a ZXing module instance
 * @param input - The data to encode in the barcode, either as a string or Uint8Array
 * @param writerOptions - Optional configuration options for barcode generation
 * @returns A promise that resolves to the barcode write result
 *
 * @throws Will throw if the ZXing module initialization fails
 * @throws Will throw if barcode generation fails
 *
 * @remarks
 * The function handles memory management automatically when processing binary input,
 * ensuring proper allocation and deallocation of memory in the ZXing module.
 */
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
