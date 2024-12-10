export const contentTypes = [
  "Text",
  "Binary",
  "Mixed",
  "GS1",
  "ISO15434",
  "UnknownECI",
] as const;

export type ContentType = (typeof contentTypes)[number];

export function encodeContentType(contentType: ContentType): number {
  return contentTypes.indexOf(contentType);
}

export function decodeContentType(number: number): ContentType {
  return contentTypes[number];
}
