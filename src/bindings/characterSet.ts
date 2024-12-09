export const characterSets = [
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
  /**
   * UnicodeBig [[deprecated]]
   */
  "UTF16BE",
  "UTF8",
  "UTF16LE",
  "UTF32BE",
  "UTF32LE",
  "BINARY",
] as const;

/**
 * @deprecated Use `"UTF16BE"` instead.
 */
type DeprecatedUnicodeBig = "UnicodeBig";

export type CharacterSet = (typeof characterSets)[number];

export function encodeCharacterSet(
  characterSet: CharacterSet | DeprecatedUnicodeBig,
): number {
  if (characterSet === "UnicodeBig") {
    return characterSets.indexOf("UTF16BE");
  }
  return characterSets.indexOf(characterSet);
}

export function decodeCharacterSet(number: number): CharacterSet {
  return characterSets[number];
}
