export const textModes = ["Plain", "ECI", "HRI", "Hex", "Escaped"] as const;

export type TextMode = (typeof textModes)[number];

/**
 * Encodes a text mode into its corresponding numeric value.
 *
 * @param textMode - The text mode to encode
 * @returns A number representing the encoded text mode.
 */
export function encodeTextMode(textMode: TextMode): number {
  return textModes.indexOf(textMode);
}

/**
 * Decodes a numeric value into its corresponding text mode.
 *
 * @param number - The numeric value to decode into a text mode
 * @returns The decoded text mode.
 */
export function decodeTextMode(number: number): TextMode {
  return textModes[number];
}
