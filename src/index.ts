import {
  DecodeHints,
  decodeHintsToZXingDecodeHints,
  defaultDecodeHints,
} from "./bindings/decodeHints.js";
import {
  EncodeHints,
  defaultEncodeHints,
  encodeHintsToZXingEncodeHints,
} from "./bindings/encodeHints.js";
import {
  ReadResult,
  zxingReadResultToReadResult,
} from "./bindings/readResult.js";
import { zxingWriteResultToWriteResult } from "./bindings/writeResult.js";

const DEFAULT_ZXING_MODULE_OVERRIDES: ZXingModuleOverrides = import.meta.env
  .PROD
  ? {
      locateFile: (path, prefix) => {
        if (/\.wasm$/.test(path)) {
          return `https://fastly.jsdelivr.net/npm/@sec-ant/zxing-wasm@${NPM_PACKAGE_VERSION}/dist/wasm/${path}`;
        }
        return prefix + path;
      },
    }
  : {};

interface ZXingWeakMapValue<T extends ZXingModuleType = ZXingModuleType> {
  moduleOverrides: ZXingModuleOverrides<T>;
  modulePromise: Promise<ZXingModule<T>>;
}

type ZXingWeakMap = WeakMap<ZXingModuleFactory, ZXingWeakMapValue>;

let zxingWeakMap: ZXingWeakMap = new WeakMap();

export function getZXingModule<T extends ZXingModuleType = ZXingModuleType>(
  zxingModuleFactory: ZXingModuleFactory<T>,
  zxingModuleOverrides?: ZXingModuleOverrides<T>,
) {
  const zxingWeakMapValue = zxingWeakMap.get(zxingModuleFactory) as
    | ZXingWeakMapValue<T>
    | undefined;

  if (
    zxingWeakMapValue &&
    (zxingModuleFactory === undefined ||
      Object.is(zxingModuleOverrides, zxingWeakMapValue.moduleOverrides))
  ) {
    return zxingWeakMapValue.modulePromise;
  }

  const resolvedModuleOverrides =
    zxingModuleOverrides ??
    (DEFAULT_ZXING_MODULE_OVERRIDES as ZXingModuleOverrides<T>);

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

// export function setZXingModuleOverrides<
//   T extends ZXingModuleType = ZXingModuleType,
// >(
//   zxingModuleFactory: ZXingModuleFactory<T>,
//   zxingModuleOverrides: ZXingModuleOverrides<T>,
// ) {

// }

export async function readBarcodesFromImageFileWithFactory<
  T extends "reader" | "full",
>(
  imageFile: Blob | File,
  decodeHints: DecodeHints = defaultDecodeHints,
  zxingModuleFactory: ZXingModuleFactory<T>,
) {
  const requiredDecodeHints: Required<DecodeHints> = {
    ...defaultDecodeHints,
    ...decodeHints,
  };
  const zxingModule = await getZXingModule(zxingModuleFactory);
  const { size } = imageFile;
  const buffer = new Uint8Array(await imageFile.arrayBuffer());
  const bufferPtr = zxingModule._malloc(size);
  zxingModule.HEAPU8.set(buffer, bufferPtr);
  const zxingReadResultVector = zxingModule.readBarcodesFromImage(
    bufferPtr,
    size,
    decodeHintsToZXingDecodeHints(requiredDecodeHints),
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

export async function readBarcodesFromImageDataWithFactory<
  T extends "reader" | "full",
>(
  imageData: ImageData,
  decodeHints: DecodeHints = defaultDecodeHints,
  zxingModuleFactory: ZXingModuleFactory<T>,
) {
  const requiredDecodeHints: Required<DecodeHints> = {
    ...defaultDecodeHints,
    ...decodeHints,
  };
  const zxingModule = await getZXingModule(zxingModuleFactory);
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
    decodeHintsToZXingDecodeHints(requiredDecodeHints),
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
  text: string,
  encodeHints: EncodeHints = defaultEncodeHints,
  zxingModuleFactory: ZXingModuleFactory<T>,
) {
  const requiredEncodeHints: Required<EncodeHints> = {
    ...defaultEncodeHints,
    ...encodeHints,
  };
  const zxingModule = await getZXingModule(zxingModuleFactory);
  const zxingWriteResult = zxingModule.writeBarcodeToImage(
    text,
    encodeHintsToZXingEncodeHints(requiredEncodeHints),
  );
  return zxingWriteResultToWriteResult(zxingWriteResult);
}
