export const binarizers = [
  "LocalAverage",
  "GlobalHistogram",
  "FixedThreshold",
  "BoolCast",
] as const;

export type Binarizer = (typeof binarizers)[number];

export function encodeBinarizer(binarizer: Binarizer): number {
  return binarizers.indexOf(binarizer);
}

export function decodeBinaraizer(number: number): Binarizer {
  return binarizers[number];
}
