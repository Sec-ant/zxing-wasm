export const binarizers = [
  "LocalAverage",
  "GlobalHistogram",
  "FixedThreshold",
  "BoolCast",
] as const;

export type Binarizer = (typeof binarizers)[number];

/**
 * Encodes a binarizer to its numeric representation.
 *
 * @param binarizer - The binarizer to encode
 * @returns A number representing the encoded binarizer
 */
export function encodeBinarizer(binarizer: Binarizer): number {
  return binarizers.indexOf(binarizer);
}

/**
 * Decodes a binarizer from a numeric identifier.
 *
 * @param number - The numeric identifier of the binarizer
 * @returns The decoded binarizer
 */
export function decodeBinarizer(number: number): Binarizer {
  return binarizers[number];
}
