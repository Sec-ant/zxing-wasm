declare enum ZXingBinarizer {
  LocalAverage,
  GlobalHistogram,
  FixedThreshold,
  BoolCast,
}

declare enum ZXingEanAddOnSymbol {
  Ignore,
  Read,
  Require,
}

declare enum ZXingTextMode {
  Plain,
  ECI,
  HRI,
  Hex,
  Escaped,
}

declare enum ZXingCharacterSet {
  Unknown,
  ASCII,
  ISO8859_1,
  ISO8859_2,
  ISO8859_3,
  ISO8859_4,
  ISO8859_5,
  ISO8859_6,
  ISO8859_7,
  ISO8859_8,
  ISO8859_9,
  ISO8859_10,
  ISO8859_11,
  ISO8859_13,
  ISO8859_14,
  ISO8859_15,
  ISO8859_16,
  Cp437,
  Cp1250,
  Cp1251,
  Cp1252,
  Cp1256,
  Shift_JIS,
  Big5,
  GB2312,
  GB18030,
  EUC_JP,
  EUC_KR,
  UTF16BE,
  UTF8,
  UTF16LE,
  UTF32BE,
  UTF32LE,
  BINARY,
}

declare enum ZXingContentType {
  Text,
  Binary,
  Mixed,
  GS1,
  ISO15434,
  UnknownECI,
}

declare interface ZXingPointI {
  x: number;
  y: number;
}

declare interface ZXingPosition {
  topLeft: ZXingPointI;
  topRight: ZXingPointI;
  bottomLeft: ZXingPointI;
  bottomRight: ZXingPointI;
}

declare interface ZXingDecodeHints {
  formats: string;
  tryHarder: boolean;
  tryRotate: boolean;
  tryInvert: boolean;
  tryDownscale: boolean;
  binarizer: ZXingBinarizer;
  isPure: boolean;
  downscaleThreshold: number;
  downscaleFactor: number;
  minLineCount: number;
  maxNumberOfSymbols: number;
  tryCode39ExtendedMode: boolean;
  validateCode39CheckSum: boolean;
  validateITFCheckSum: boolean;
  returnCodabarStartEnd: boolean;
  returnErrors: boolean;
  eanAddOnSymbol: ZXingEanAddOnSymbol;
  textMode: ZXingTextMode;
  characterSet: ZXingCharacterSet;
}

declare interface ZXingReadResult {
  isValid: boolean;
  error: string;
  format: string;
  bytes: Uint8Array;
  bytesECI: Uint8Array;
  text: string;
  eccLevel: string;
  contentType: ZXingContentType;
  hasECI: boolean;
  position: ZXingPosition;
  orientation: number;
  isMirrored: boolean;
  isInverted: boolean;
  symbologyIdentifier: string;
  sequenceSize: number;
  sequenceIndex: number;
  sequenceId: string;
  readerInit: boolean;
  lineCount: number;
  version: string;
}

declare interface ZXingEncodeHints {
  width: number;
  height: number;
  format: string;
  characterSet: ZXingCharacterSet;
  eccLevel: number;
  margin: number;
}

declare interface ZXingWriteResult {
  image: Uint8Array;
  error: string;
  delete: () => void;
}

declare interface ZXingVector<T> {
  size: () => number;
  get: (i: number) => T | undefined;
}

declare type ZXingModuleType = "reader" | "writer" | "full";

declare interface ZXingReaderModule extends EmscriptenModule {
  readBarcodesFromImage(
    bufferPtr: number,
    bufferLength: number,
    jsDecodeHints: ZXingDecodeHints,
  ): ZXingVector<ZXingReadResult>;

  readBarcodesFromPixmap(
    bufferPtr: number,
    imgWidth: number,
    imgHeight: number,
    jsDecodeHints: ZXingDecodeHints,
  ): ZXingVector<ZXingReadResult>;
}

declare interface ZXingWriterModule extends EmscriptenModule {
  writeBarcodeToImage(
    text: string,
    jsEncodeHints: ZXingEncodeHints,
  ): ZXingWriteResult;
}

declare interface ZXingFullModule
  extends ZXingReaderModule,
    ZXingWriterModule {}

declare type ZXingModule<T extends ZXingModuleType = ZXingModuleType> =
  T extends "reader"
    ? ZXingReaderModule
    : T extends "writer"
    ? ZXingWriterModule
    : T extends "full"
    ? ZXingFullModule
    : ZXingReaderModule | ZXingWriterModule | ZXingFullModule;

declare type ZXingModuleFactory<T extends ZXingModuleType = ZXingModuleType> =
  EmscriptenModuleFactory<ZXingModule<T>>;

declare type ZXingModuleOverrides<T extends ZXingModuleType = ZXingModuleType> =
  Partial<ZXingModule<T>>;
