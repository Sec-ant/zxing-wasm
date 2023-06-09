export {
  setZXingModuleOverrides,
  purgeZXingModule,
  ZXING_BARCODE_FORMAT_NAMES,
  ZXING_CHARACTOR_SET_NAMES,
  defaultZXingReadOptions,
  defaultZXingWriteOptions,
} from "./core.js";

export type {
  // module
  ZXingModuleType,
  ZXingModuleFactory,
  ZXingModuleFactoryTypeExtractor,
  ZXingModuleOverrides,
  ZXingModule,
  // barcode format
  ZXingBarcodeFormat,
  ZXingReadInputBarcodeFormat,
  ZXingWriteInputBarcodeFormat,
  ZXingReadOutputBarcodeFormat,
  // charset
  ZXingCharacterSet,
  // ecc level
  ZXingReadOutputECCLevel,
  ZXingWriteInputECCLevel,
  // point and position
  ZXingPoint,
  ZXingPosition,
  // vector
  ZXingVector,
  // inner output
  ZXingReadInnerOutput,
  ZXingWriteInnerOutput,
  // output
  ZXingReadOutput,
  ZXingWriteOutput,
  // options
  ZXingReadOptions,
  ZXingWriteOptions,
} from "./core.js";
