export enum ZXingEanAddOnSymbol {
  Ignore,
  Read,
  Require,
}

const eanAddOnSymbols = ["Ignore", "Read", "Require"] as const;

export type EanAddOnSymbol = (typeof eanAddOnSymbols)[number];

export function eanAddOnSymbolToZXingEanAddOnSymbol(
  eanAddOnSymbol: EanAddOnSymbol,
): ZXingEanAddOnSymbol {
  return ZXingEanAddOnSymbol[eanAddOnSymbol];
}

export function zxingEanAddOnSymbolToEanAddOnSymbol(
  zxingEanAddOnSymbol: ZXingEanAddOnSymbol,
): EanAddOnSymbol {
  return eanAddOnSymbols[zxingEanAddOnSymbol];
}
