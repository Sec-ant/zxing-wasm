import type { ZXingModule } from "../core.js";
import type { ZXingEnum } from "./enum.js";

export const contentTypes = [
  "Text",
  "Binary",
  "Mixed",
  "GS1",
  "ISO15434",
  "UnknownECI",
] as const;

export type ContentType = (typeof contentTypes)[number];

/**
 * @internal
 */
export type ZXingContentType = Record<ContentType, ZXingEnum>;

export function contentTypeToZXingEnum<T extends "reader" | "full">(
  zxingModule: ZXingModule<T>,
  contentType: ContentType,
): ZXingEnum {
  return zxingModule.ContentType[contentType];
}

export function zxingEnumToContentType(zxingEnum: ZXingEnum): ContentType {
  return contentTypes[zxingEnum.value]!;
}
