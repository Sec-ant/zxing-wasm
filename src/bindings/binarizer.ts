import type { ZXingModule } from "../core.js";
import type { ZXingEnum } from "./enum.js";

export const binarizers = [
  "LocalAverage",
  "GlobalHistogram",
  "FixedThreshold",
  "BoolCast",
] as const;

export type Binarizer = (typeof binarizers)[number];

/**
 * @internal
 */
export type ZXingBinarizer = Record<Binarizer, ZXingEnum>;

export function binarizerToZXingEnum<T extends "reader" | "full">(
  zxingModule: ZXingModule<T>,
  binarizer: Binarizer,
): ZXingEnum {
  return zxingModule.Binarizer[binarizer];
}

export function zxingEnumToBinarizer(zxingEnum: ZXingEnum): Binarizer {
  return binarizers[zxingEnum.value];
}
