import { ReadInputBarcodeFormat, formatsToString } from "./barcodeFormat.js";
import { Binarizer, binarizerToZXingBinarizer } from "./binarizer.js";
import {
  CharacterSet,
  characterSetToZXingCharacterSet,
} from "./characterSet.js";
import {
  EanAddOnSymbol,
  eanAddOnSymbolToZXingEanAddOnSymbol,
} from "./eanAddOnSymbol.js";
import { TextMode, textModeToZXingTextMode } from "./textMode.js";

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

export function decodeHintsToZXingDecodeHints(
  decodeHints: Required<DecodeHints>,
): ZXingDecodeHints {
  return {
    ...decodeHints,
    formats: formatsToString(decodeHints.formats),
    binarizer: binarizerToZXingBinarizer(decodeHints.binarizer),
    eanAddOnSymbol: eanAddOnSymbolToZXingEanAddOnSymbol(
      decodeHints.eanAddOnSymbol,
    ),
    textMode: textModeToZXingTextMode(decodeHints.textMode),
    characterSet: characterSetToZXingCharacterSet(decodeHints.characterSet),
  };
}
