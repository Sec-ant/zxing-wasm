import { ZXingModule } from "../core.js";
import { ReadInputBarcodeFormat, formatsToString } from "./barcodeFormat.js";
import { Binarizer, binarizerToZXingEnum } from "./binarizer.js";
import { CharacterSet, characterSetToZXingEnum } from "./characterSet.js";
import { EanAddOnSymbol, eanAddOnSymbolToZXingEnum } from "./eanAddOnSymbol.js";
import { TextMode, textModeToZXingEnum } from "./textMode.js";
import { ZXingEnum } from "./enum.js";

export interface ZXingDecodeHints {
  formats: string;
  tryHarder: boolean;
  tryRotate: boolean;
  tryInvert: boolean;
  tryDownscale: boolean;
  binarizer: ZXingEnum;
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
  eanAddOnSymbol: ZXingEnum;
  textMode: ZXingEnum;
  characterSet: ZXingEnum;
}

export interface DecodeHints
  extends Partial<
    Omit<
      ZXingDecodeHints,
      "formats" | "binarizer" | "eanAddOnSymbol" | "textMode" | "characterSet"
    >
  > {
  formats?: ReadInputBarcodeFormat[];
  binarizer?: Binarizer;
  eanAddOnSymbol?: EanAddOnSymbol;
  textMode?: TextMode;
  characterSet?: CharacterSet;
}

export const defaultDecodeHints: Required<DecodeHints> = {
  formats: [],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  binarizer: "LocalAverage",
  isPure: false,
  downscaleFactor: 3,
  downscaleThreshold: 500,
  minLineCount: 2,
  maxNumberOfSymbols: 255,
  tryCode39ExtendedMode: false,
  validateCode39CheckSum: false,
  validateITFCheckSum: false,
  returnCodabarStartEnd: false,
  returnErrors: false,
  eanAddOnSymbol: "Read",
  textMode: "Plain",
  characterSet: "Unknown",
};

export function decodeHintsToZXingDecodeHints<T extends "reader" | "full">(
  zxingModule: ZXingModule<T>,
  decodeHints: Required<DecodeHints>,
): ZXingDecodeHints {
  return {
    ...decodeHints,
    formats: formatsToString(decodeHints.formats),
    binarizer: binarizerToZXingEnum(zxingModule, decodeHints.binarizer),
    eanAddOnSymbol: eanAddOnSymbolToZXingEnum(
      zxingModule,
      decodeHints.eanAddOnSymbol,
    ),
    textMode: textModeToZXingEnum(zxingModule, decodeHints.textMode),
    characterSet: characterSetToZXingEnum(
      zxingModule,
      decodeHints.characterSet,
    ),
  };
}
