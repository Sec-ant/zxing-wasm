export const BINARIZERS = [
  "LocalAverage",
  "GlobalHistogram",
  "FixedThreshold",
  "BoolCast",
] as const;

/** @deprecated Use {@link BINARIZERS} instead. */
export const binarizers = BINARIZERS;

export type Binarizer = (typeof BINARIZERS)[number];

/**
 * Encodes a binarizer to its numeric representation.
 *
 * @param binarizer - The binarizer to encode
 * @returns A number representing the encoded binarizer
 */
export function encodeBinarizer(binarizer: Binarizer): number {
  return BINARIZERS.indexOf(binarizer);
}

/**
 * Decodes a binarizer from a numeric identifier.
 *
 * @param number - The numeric identifier of the binarizer
 * @returns The decoded binarizer
 */
export function decodeBinarizer(number: number): Binarizer {
  return BINARIZERS[number];
}
