export const EAN_ADD_ON_SYMBOLS = ["Ignore", "Read", "Require"] as const;

/** @deprecated Use {@link EAN_ADD_ON_SYMBOLS} instead. */
export const eanAddOnSymbols = EAN_ADD_ON_SYMBOLS;

export type EanAddOnSymbol = (typeof EAN_ADD_ON_SYMBOLS)[number];

/**
 * Encodes an EAN add-on symbol to its numeric representation.
 *
 * @param eanAddOnSymbol - The EAN add-on symbol to encode
 * @returns The number representing the encoded EAN add-on symbol
 */
export function encodeEanAddOnSymbol(eanAddOnSymbol: EanAddOnSymbol): number {
  return EAN_ADD_ON_SYMBOLS.indexOf(eanAddOnSymbol);
}

/**
 * Decodes the EAN add-on symbol corresponding to the given number.
 *
 * @param number - The numeric identifier of the EAN add-on symbol to decode
 * @returns The decoded EAN add-on symbol
 */
export function decodeEanAddOnSymbol(number: number): EanAddOnSymbol {
  return EAN_ADD_ON_SYMBOLS[number];
}
