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
 * Encodes a content type into its numeric representation.
 *
 * @param contentType - The content type to encode
 * @returns A number representing the encoded content type
 */
export function encodeContentType(contentType: ContentType): number {
  return contentTypes.indexOf(contentType);
}

/**
 * Decodes a content type from its numeric representation.
 *
 * @param number - The numeric identifier representing a content type
 * @returns The decoded content type
 */
export function decodeContentType(number: number): ContentType {
  return contentTypes[number];
}
