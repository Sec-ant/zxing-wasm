export const eanAddOnSymbols = ["Ignore", "Read", "Require"] as const;

export type EanAddOnSymbol = (typeof eanAddOnSymbols)[number];

export function encodeEanAddOnSymbol(eanAddOnSymbol: EanAddOnSymbol): number {
  return eanAddOnSymbols.indexOf(eanAddOnSymbol);
}

export function decodeEanAddOnSymbol(number: number): EanAddOnSymbol {
  return eanAddOnSymbols[number];
}
