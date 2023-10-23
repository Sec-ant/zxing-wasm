const contentTypes = [
  "Text",
  "Binary",
  "Mixed",
  "GS1",
  "ISO15434",
  "UnknownECI",
] as const;

export type ContentType = (typeof contentTypes)[number];

export function contentTypeToZXingContentType(
  contentType: ContentType,
): ZXingContentType {
  return ZXingContentType[contentType];
}

export function zxingContentTypeToContentType(
  zxingContentType: ZXingContentType,
): ContentType {
  return contentTypes[zxingContentType];
}
