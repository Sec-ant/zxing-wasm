import { ZXingModule } from "../core.js";
import { ZXingEnum } from "./enum.js";

const textModes = ["Plain", "ECI", "HRI", "Hex", "Escaped"] as const;

export type TextMode = (typeof textModes)[number];

export type ZXingTextMode = Record<TextMode, ZXingEnum>;

export function textModeToZXingEnum<T extends "reader" | "full">(
  zxingModule: ZXingModule<T>,
  textMode: TextMode,
): ZXingEnum {
  return zxingModule.TextMode[textMode];
}

export function zxingEnumToTextMode(zxingEnum: ZXingEnum): TextMode {
  return textModes[zxingEnum.value];
}
