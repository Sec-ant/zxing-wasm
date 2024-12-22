export const eanAddOnSymbols = ["Ignore", "Read", "Require"] as const;

export type EanAddOnSymbol = (typeof eanAddOnSymbols)[number];

/**
 * Encodes an EAN add-on symbol to its numeric representation.
 *
 * @param eanAddOnSymbol - The EAN add-on symbol to encode
 * @returns The numeric index of the symbol in the EAN add-on symbol table
 * @throws {Error} When the symbol is not found in the EAN add-on symbol table
 */
export function encodeEanAddOnSymbol(eanAddOnSymbol: EanAddOnSymbol): number {
  return eanAddOnSymbols.indexOf(eanAddOnSymbol);
}

/**
 * Retrieves the EAN add-on symbol corresponding to the given number.
 *
 * @param number - The numeric index to look up in the EAN add-on symbols table
 * @returns The corresponding EAN add-on symbol
 * @throws {Error} When the number is out of range of valid EAN add-on symbols
 */
export function decodeEanAddOnSymbol(number: number): EanAddOnSymbol {
  return eanAddOnSymbols[number];
}
