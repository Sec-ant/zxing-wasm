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
 * Encodes a ContentType enum value into its numeric representation.
 *
 * @param contentType - The ContentType enum value to encode
 * @returns A numeric index representing the content type. Returns -1 if the content type is not found
 */
export function encodeContentType(contentType: ContentType): number {
  return contentTypes.indexOf(contentType);
}

/**
 * Decodes a numeric value into its corresponding ContentType.
 *
 * @param number - The numeric identifier representing a content type
 * @returns The matching ContentType enum value
 * @throws {Error} When the provided number does not map to a valid ContentType
 */
export function decodeContentType(number: number): ContentType {
  return contentTypes[number];
}
