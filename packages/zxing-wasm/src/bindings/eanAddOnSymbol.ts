export const eanAddOnSymbols = ["Ignore", "Read", "Require"] as const;

export type EanAddOnSymbol = (typeof eanAddOnSymbols)[number];

/**
 * Encodes an EAN add-on symbol to its numeric representation.
 *
 * @param eanAddOnSymbol - The EAN add-on symbol to encode
 * @returns The number representing the encoded EAN add-on symbol
 */
export function encodeEanAddOnSymbol(eanAddOnSymbol: EanAddOnSymbol): number {
  return eanAddOnSymbols.indexOf(eanAddOnSymbol);
}

/**
 * Decodes the EAN add-on symbol corresponding to the given number.
 *
 * @param number - The numeric identifier of the EAN add-on symbol to decode
 * @returns The decoded EAN add-on symbol
 */
export function decodeEanAddOnSymbol(number: number): EanAddOnSymbol {
  return eanAddOnSymbols[number];
}
