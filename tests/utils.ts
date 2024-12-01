import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { format, parse } from "node:path";
import { Jimp } from "jimp";
import {
  type BarcodeFormat,
  type ReadResult,
  type ReaderOptions,
  defaultReaderOptions,
} from "../src/reader/index.js";

export const DEFAULT_READER_OPTIONS_FOR_TESTS: ReaderOptions = {
  ...defaultReaderOptions,
  tryCode39ExtendedMode: true,
  returnCodabarStartEnd: true,
  eanAddOnSymbol: "Ignore",
  textMode: "Escaped",
  tryDownscale: false,
  maxNumberOfSymbols: 1,
};

type ProvidedMimeType = Parameters<
  Awaited<ReturnType<typeof Jimp.read>>["getBuffer"]
>[0];

const [warmUpCache, getRotatedImage] = (() => {
  const cache = new Map<string, Map<number, Buffer>>();
  return [
    async (imagePath: string, rotations: number[]) => {
      if (cache.has(imagePath)) {
        return;
      }
      const imageCache = new Map<number, Buffer>();
      imageCache.set(0, await readFile(imagePath));
      cache.set(imagePath, imageCache);
      await Promise.all(
        rotations.map(async (rotation) => {
          if (rotation === 0) {
            return;
          }
          const jimpImage = (await Jimp.read(imageCache.get(0)!)).clone();
          imageCache.set(
            rotation,
            await jimpImage
              .rotate(rotation)
              .getBuffer((jimpImage.mime ?? "image/png") as ProvidedMimeType),
          );
        }),
      );
    },
    async (imagePath: string, rotation: number) => {
      const imageCache = cache.get(imagePath)?.get(rotation);
      if (!imageCache) {
        throw new Error("Cache not warmed up");
      }
      return imageCache;
    },
  ];
})();

export { warmUpCache, getRotatedImage };

export function escapeNonGraphical(str: string): string {
  const asciiNongraphs = [
    "NUL",
    "SOH",
    "STX",
    "ETX",
    "EOT",
    "ENQ",
    "ACK",
    "BEL",
    "BS",
    "HT",
    "LF",
    "VT",
    "FF",
    "CR",
    "SO",
    "SI",
    "DLE",
    "DC1",
    "DC2",
    "DC3",
    "DC4",
    "NAK",
    "SYN",
    "ETB",
    "CAN",
    "EM",
    "SUB",
    "ESC",
    "FS",
    "GS",
    "RS",
    "US",
    "DEL",
  ];

  let result = "";
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.codePointAt(i)!;

    // Non-graphical ASCII characters (0-31 and 127)
    if (codePoint < 32 || codePoint === 127) {
      result += `<${asciiNongraphs[codePoint === 127 ? 32 : codePoint]}>`;
    }
    // Printable ASCII characters (32-126)
    else if (codePoint < 128) {
      result += String.fromCodePoint(codePoint);
    }
    // Handle UTF-16 surrogate pairs
    else if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < str.length) {
      const nextCodePoint = str.codePointAt(i + 1)!;
      if (nextCodePoint >= 0xdc00 && nextCodePoint <= 0xdfff) {
        result += String.fromCodePoint(codePoint, nextCodePoint);
        i++; // Skip the next character as it's part of the surrogate pair
      }
    }
    // Exclude unpaired surrogates, NO-BREAK SPACE, NUMERICAL SPACE, etc.
    else if (
      (codePoint < 0xd800 || codePoint >= 0xe000) &&
      isGraphicalUnicode(codePoint) &&
      codePoint !== 0xa0 &&
      codePoint !== 0x2007 &&
      codePoint !== 0x202f &&
      codePoint !== 0xfffd
    ) {
      result += String.fromCodePoint(codePoint);
    }
    // Non-graphical Unicode characters
    else {
      result += `<U+${codePoint
        .toString(16)
        .toUpperCase()
        .padStart(codePoint < 256 ? 2 : 4, "0")}>`;
    }
  }

  return result;
}

function isGraphicalUnicode(codePoint: number): boolean {
  // Check for spaces and whitespace characters (tab, newline, etc.)
  if (codePoint === 0x20 || (codePoint >= 0x09 && codePoint <= 0x0d)) {
    return false;
  }

  // Check for ASCII graphical characters (0x21 to 0x7E)
  if (codePoint < 0xff) {
    return ((codePoint + 1) & 0x7f) >= 0x21;
  }

  // Exclude U+2028 and U+2029 (line/paragraph separators)
  if (codePoint === 0x2028 || codePoint === 0x2029) {
    return false;
  }

  // Exclude interlinear annotation controls (U+FFF9 through U+FFFB)
  if (codePoint >= 0xfff9 && codePoint <= 0xfffb) {
    return false;
  }

  // Exclude surrogate pairs and illegal Unicode ranges
  if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
    return false;
  }

  // Exclude code points that are non-character (U+FFFE, U+FFFF, and others in those ranges)
  if (
    codePoint >= 0xfffc &&
    codePoint <= 0x10ffff &&
    (codePoint & 0xfffe) === 0xfffe
  ) {
    return false;
  }

  // For all other valid Unicode graphical characters
  return true;
}

/**
 * TODO: handle this more gracefully
 */
export function fourOrientations(barcodeFormat: BarcodeFormat): boolean {
  return (
    barcodeFormat === "Aztec" ||
    barcodeFormat === "DataMatrix" ||
    barcodeFormat === "MaxiCode" ||
    barcodeFormat === "PDF417" ||
    barcodeFormat === "QRCode" ||
    barcodeFormat === "MicroQRCode" ||
    barcodeFormat === "rMQRCode" ||
    barcodeFormat === "None"
  );
}

export function snapshotResult(readResult?: ReadResult): string {
  if (!readResult) {
    return "null\n";
  }
  const hashBytes = createHash("sha256");
  const hashBytesECI = createHash("sha256");
  return `${JSON.stringify(
    {
      ...readResult,
      bytes: hashBytes.update(readResult.bytes).digest("hex").slice(0, 7),
      bytesECI: hashBytesECI
        .update(readResult.bytesECI)
        .digest("hex")
        .slice(0, 7),
    },
    null,
    2,
  )}\n`;
}

// .result.txt
export async function parseExpectedResult(
  imagePath: string,
): Promise<Record<keyof ReadResult, string> | null> {
  try {
    const expected = await readFile(
      format({ ...parse(imagePath), base: "", ext: ".result.txt" }),
      { encoding: "utf-8" },
    );
    const expectedObject: Record<string, string> = {};
    for await (const line of expected.split(/\r?\n/)) {
      if (line === "" || line.startsWith("#")) {
        continue;
      }
      const [key, expectedValue] = line.split("=");
      if (expectedValue === undefined) {
        console.warn(`Bad format, missing equals: ${key}`);
        continue;
      }
      expectedObject[key] = expectedValue;
    }
    return expectedObject;
  } catch {
    return null;
  }
}

// .txt
export async function parseExpectedText(
  imagePath: string,
): Promise<string | null> {
  try {
    const expected = await readFile(
      format({ ...parse(imagePath), base: "", ext: ".txt" }),
      { encoding: "utf-8" },
    );
    return escapeNonGraphical(expected);
  } catch {
    return null;
  }
}

// .bin
export async function parseExpectedBinary(
  imagePath: string,
): Promise<Buffer | null> {
  try {
    return await readFile(
      format({ ...parse(imagePath), base: "", ext: ".bin" }),
    );
  } catch {
    return null;
  }
}
