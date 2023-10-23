const textModes = ["Plain", "ECI", "HRI", "Hex", "Escaped"] as const;

export type TextMode = (typeof textModes)[number];

export function textModeToZXingTextMode(textMode: TextMode): ZXingTextMode {
  return ZXingTextMode[textMode];
}

export function zxingTextModeToTextMode(
  zxingTextMode: ZXingTextMode,
): TextMode {
  return textModes[zxingTextMode];
}
