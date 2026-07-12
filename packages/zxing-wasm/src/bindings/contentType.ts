export const CONTENT_TYPES = [
  "Text",
  "Binary",
  "Mixed",
  "GS1",
  "ISO15434",
  "UnknownECI",
] as const;

/** @deprecated Use {@link CONTENT_TYPES} instead. */
export const contentTypes = CONTENT_TYPES;

export type ContentType = (typeof CONTENT_TYPES)[number];

/**
 * Encodes a content type into its numeric representation.
 *
 * @param contentType - The content type to encode
 * @returns A number representing the encoded content type
 */
export function encodeContentType(contentType: ContentType): number {
  return CONTENT_TYPES.indexOf(contentType);
}

/**
 * Decodes a content type from its numeric representation.
 *
 * @param number - The numeric identifier representing a content type
 * @returns The decoded content type
 */
export function decodeContentType(number: number): ContentType {
  return CONTENT_TYPES[number];
}
