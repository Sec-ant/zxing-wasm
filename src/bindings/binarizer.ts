export const binarizers = [
  "LocalAverage",
  "GlobalHistogram",
  "FixedThreshold",
  "BoolCast",
] as const;

export type Binarizer = (typeof binarizers)[number];

/**
 * Encodes a Binarizer enum value to its corresponding numeric index.
 *
 * @param binarizer - The Binarizer enum value to encode
 * @returns The zero-based index of the binarizer in the binarizers array, or -1 if not found
 */
export function encodeBinarizer(binarizer: Binarizer): number {
  return binarizers.indexOf(binarizer);
}

/**
 * Retrieves a Binarizer instance from a numeric identifier.
 *
 * @param number - The numeric identifier corresponding to a Binarizer
 * @returns The Binarizer instance associated with the given number
 * @throws {Error} When the number does not correspond to a valid Binarizer
 */
export function decodeBinaraizer(number: number): Binarizer {
  return binarizers[number];
}
