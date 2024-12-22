export const textModes = ["Plain", "ECI", "HRI", "Hex", "Escaped"] as const;

export type TextMode = (typeof textModes)[number];

/**
 * Encodes a TextMode value into its corresponding numeric index.
 *
 * @param textMode - The TextMode value to encode
 * @returns The numeric index of the TextMode in the textModes array, or -1 if not found
 */
export function encodeTextMode(textMode: TextMode): number {
  return textModes.indexOf(textMode);
}

/**
 * Decodes a numeric value into its corresponding TextMode.
 *
 * @param number - The numeric value to decode into a TextMode
 * @returns The TextMode corresponding to the input number
 * @throws {Error} When the provided number does not map to a valid TextMode
 */
export function decodeTextMode(number: number): TextMode {
  return textModes[number];
}
