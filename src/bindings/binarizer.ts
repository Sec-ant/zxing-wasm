const binarizers = [
  "LocalAverage",
  "GlobalHistogram",
  "FixedThreshold",
  "BoolCast",
] as const;

export type Binarizer = (typeof binarizers)[number];

export function binarizerToZXingBinarizer(
  binarizer: Binarizer,
): ZXingBinarizer {
  return ZXingBinarizer[binarizer];
}

export function zxingBinarizerToBinarizer(
  zxingBinarizer: ZXingBinarizer,
): Binarizer {
  return binarizers[zxingBinarizer];
}
