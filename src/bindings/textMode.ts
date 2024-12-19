export const textModes = ["Plain", "ECI", "HRI", "Hex", "Escaped"] as const;

export type TextMode = (typeof textModes)[number];

export function encodeTextMode(textMode: TextMode): number {
  return textModes.indexOf(textMode);
}

export function decodeTextMode(number: number): TextMode {
  return textModes[number];
}
