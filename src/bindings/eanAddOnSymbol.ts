import { ZXingModule } from "../core.js";
import { ZXingEnum } from "./enum.js";

export const eanAddOnSymbols = ["Ignore", "Read", "Require"] as const;

export type EanAddOnSymbol = (typeof eanAddOnSymbols)[number];

/**
 * @internal
 */
export type ZXingEanAddOnSymbol = Record<EanAddOnSymbol, ZXingEnum>;

export function eanAddOnSymbolToZXingEnum<T extends "reader" | "full">(
  zxingModule: ZXingModule<T>,
  eanAddOnSymbol: EanAddOnSymbol,
): ZXingEnum {
  return zxingModule.EanAddOnSymbol[eanAddOnSymbol];
}

export function zxingEnumToEanAddOnSymbol(
  zxingEnum: ZXingEnum,
): EanAddOnSymbol {
  return eanAddOnSymbols[zxingEnum.value];
}
