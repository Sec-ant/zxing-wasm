export const TEXT_MODES = [
  "Plain",
  "ECI",
  "HRI",
  "Escaped",
  "Hex",
  "HexECI",
] as const;

/** @deprecated Use {@link TEXT_MODES} instead. */
export const textModes = TEXT_MODES;

export type TextMode = (typeof TEXT_MODES)[number];

/**
 * Encodes a text mode into its corresponding numeric value.
 *
 * @param textMode - The text mode to encode
 * @returns A number representing the encoded text mode.
 */
export function encodeTextMode(textMode: TextMode): number {
  return TEXT_MODES.indexOf(textMode);
}

/**
 * Decodes a numeric value into its corresponding text mode.
 *
 * @param number - The numeric value to decode into a text mode
 * @returns The decoded text mode.
 */
export function decodeTextMode(number: number): TextMode {
  return TEXT_MODES[number];
}
