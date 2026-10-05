import { readFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { formatToLabel } from "../src/bindings/barcodeFormat.js";
import type {
  ReadOutputBarcodeFormat,
  ReadResult,
} from "../src/reader/index.js";
import { escapeNonGraphical, isLinearBarcodeFormat } from "./utils.js";

export type FixtureMode = "slow" | "fast" | "pure";
export type FixtureProperties = Record<string, string>;

async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

/** Mirrors the deliberately limited TOML dialect in BlackboxTestRunner.cpp. */
export function parseFixtureToml(
  source: string,
  folderDefaults: FixtureProperties = {},
): FixtureProperties[] {
  let defaults = { ...folderDefaults };
  let current = { ...defaults };
  let atTopLevel = true;
  const records: FixtureProperties[] = [];
  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line === "[[symbol]]") {
      if (atTopLevel) {
        defaults = { ...current };
        atTopLevel = false;
      } else {
        records.push(current);
        current = { ...defaults };
      }
      continue;
    }
    const equals = line.indexOf("=");
    if (line.startsWith("[") || equals < 1)
      throw new Error(`Invalid fixture TOML: ${line}`);
    const key = line.slice(0, equals).trim();
    const value = line.slice(equals + 1).trim();
    current[key] = value.startsWith('"')
      ? (JSON.parse(
          value.replace(/\\U([0-9a-fA-F]{8})/g, (_, hex: string) => {
            const codepoint = String.fromCodePoint(Number.parseInt(hex, 16));
            return JSON.stringify(codepoint).slice(1, -1);
          }),
        ) as string)
      : value;
  }
  records.push(current);
  return records;
}

export function fixtureApplies(
  filter: string,
  mode: FixtureMode,
  rotation: number,
): boolean {
  let selectedMode: FixtureMode | undefined;
  let matches = false;
  for (const character of filter) {
    if (character === " ") continue;
    if (character === "s" || character === "f" || character === "p") {
      selectedMode =
        character === "s" ? "slow" : character === "f" ? "fast" : "pure";
      continue;
    }
    if (!selectedMode || !"0123hva".includes(character))
      throw new Error(`Invalid fixture filter: ${filter}`);
    const rotations =
      character === "a"
        ? [0, 90, 180, 270]
        : character === "h"
          ? [0, 180]
          : character === "v"
            ? [90, 270]
            : [Number(character) * 90];
    matches ||= selectedMode === mode && rotations.includes(rotation);
  }
  return matches;
}

export async function loadFixtureProperties(
  imagePath: string,
  format: ReadOutputBarcodeFormat,
): Promise<FixtureProperties[]> {
  const defaults = parseFixtureToml(
    (await readOptional(join(dirname(imagePath), "!defaults.toml"))) ?? "",
    {
      Format: formatToLabel(format) ?? format,
      find: isLinearBarcodeFormat(format) ? "sh fh" : "sa fh",
    },
  )[0]!;
  const originalStem = basename(imagePath, extname(imagePath));
  let stem = originalStem;
  let records: FixtureProperties[] = [{ ...defaults }];
  let foundCompanion = false;
  while (true) {
    const toml = await readOptional(join(dirname(imagePath), `${stem}.toml`));
    if (toml !== undefined) {
      records = parseFixtureToml(toml, defaults);
      foundCompanion = true;
      break;
    }
    const text = await readOptional(join(dirname(imagePath), `${stem}.txt`));
    if (text !== undefined) {
      records[0]!.TextEscaped = escapeNonGraphical(text);
      foundCompanion = true;
      break;
    }
    const separator = Math.max(
      stem.lastIndexOf("-"),
      stem.lastIndexOf("_"),
      stem.lastIndexOf("!"),
    );
    if (separator < 0) break;
    stem = stem.slice(0, separator);
  }
  if (originalStem.endsWith("!") || !foundCompanion)
    records[0]!.missing = "sa fa pa";
  else if (originalStem.endsWith("!f")) records[0]!.missing = "fa pa";
  else if (originalStem.endsWith("!p")) records[0]!.missing = "pa";
  return records;
}

export function fixtureMismatch(
  barcode: ReadResult,
  expected: FixtureProperties,
): string | undefined {
  for (const [key, value] of Object.entries(expected)) {
    if (!/^[A-Z]/.test(key)) continue;
    let actual: string;
    switch (key) {
      case "Format":
        actual = formatToLabel(barcode.format) ?? barcode.format;
        break;
      case "Identifier":
        actual = barcode.symbologyIdentifier;
        break;
      case "TextPlain":
        actual = barcode.text;
        break;
      case "TextEscaped":
        actual = escapeNonGraphical(barcode.text);
        break;
      default:
        throw new Error(`Unsupported upstream fixture assertion: ${key}`);
    }
    if (actual !== value)
      return `${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual)}`;
  }
  return undefined;
}
