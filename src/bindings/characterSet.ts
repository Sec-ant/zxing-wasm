export const CHARACTER_SETS = [
  "Unknown",
  "ASCII",
  "ISO8859_1",
  "ISO8859_2",
  "ISO8859_3",
  "ISO8859_4",
  "ISO8859_5",
  "ISO8859_6",
  "ISO8859_7",
  "ISO8859_8",
  "ISO8859_9",
  "ISO8859_10",
  "ISO8859_11",
  "ISO8859_13",
  "ISO8859_14",
  "ISO8859_15",
  "ISO8859_16",
  "Cp437",
  "Cp1250",
  "Cp1251",
  "Cp1252",
  "Cp1256",
  "Shift_JIS",
  "Big5",
  "GB2312",
  "GB18030",
  "EUC_JP",
  "EUC_KR",
  "UTF16BE",
  "UTF8",
  "UTF16LE",
  "UTF32BE",
  "UTF32LE",
  "BINARY",
] as const;

/** @deprecated Use {@link CHARACTER_SETS} instead. */
export const characterSets = CHARACTER_SETS;

/**
 * @deprecated Use `"UTF16BE"` instead.
 */
type DeprecatedUnicodeBig = "UnicodeBig";

export type CharacterSet = (typeof CHARACTER_SETS)[number];

/**
 * Encodes a character set identifier into its numeric representation.
 *
 * @param characterSet - The character set to encode, either a standard CharacterSet or legacy 'UnicodeBig'
 * @returns A number representing the encoded character set
 *
 * @remarks
 * Special handling is provided for the deprecated 'UnicodeBig' value, which is mapped to 'UTF16BE'
 */
export function encodeCharacterSet(
  characterSet: CharacterSet | DeprecatedUnicodeBig,
): number {
  if (characterSet === "UnicodeBig") {
    return CHARACTER_SETS.indexOf("UTF16BE");
  }
  return CHARACTER_SETS.indexOf(characterSet);
}

/**
 * Decodes a character set based on its numeric identifier.
 *
 * @param number - The numeric identifier of the character set to decode
 * @returns The decoded character set
 */
export function decodeCharacterSet(number: number): CharacterSet {
  return CHARACTER_SETS[number];
}
