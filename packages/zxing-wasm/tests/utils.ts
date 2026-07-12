import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, format, parse } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { stringify } from "yaml";
import {
  defaultReaderOptions,
  type LinearBarcodeFormat,
  linearBarcodeFormats,
  type ReaderOptions,
  type ReadOutputBarcodeFormat,
  type ReadResult,
} from "../src/reader/index.js";

export const DEFAULT_READER_OPTIONS_FOR_TESTS: ReaderOptions = {
  ...defaultReaderOptions,
  textMode: "Escaped",
  tryDownscale: false,
  maxNumberOfSymbols: 1,
};

const [warmUpCache, getRotatedImage] = (() => {
  type RasterImage = {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
  type CachedImage = Buffer | RasterImage;
  const cache = new Map<string, Map<number, CachedImage>>();

  const rotatePixels = (source: RasterImage, rotation: number): RasterImage => {
    const turns = ((rotation % 360) + 360) % 360;
    if (turns === 0) {
      return source;
    }
    if (turns !== 90 && turns !== 180 && turns !== 270) {
      throw new Error(`Unsupported blackbox rotation: ${rotation}`);
    }

    const width = turns === 90 || turns === 270 ? source.height : source.width;
    const height = turns === 90 || turns === 270 ? source.width : source.height;
    const data = new Uint8ClampedArray(source.data.length);
    for (let sourceY = 0; sourceY < source.height; sourceY++) {
      for (let sourceX = 0; sourceX < source.width; sourceX++) {
        const [targetX, targetY] =
          turns === 90
            ? [source.height - 1 - sourceY, sourceX]
            : turns === 180
              ? [source.width - 1 - sourceX, source.height - 1 - sourceY]
              : [sourceY, source.width - 1 - sourceX];
        const sourceOffset = (sourceY * source.width + sourceX) * 4;
        const targetOffset = (targetY * width + targetX) * 4;
        data.set(
          source.data.subarray(sourceOffset, sourceOffset + 4),
          targetOffset,
        );
      }
    }
    return { data, width, height };
  };

  return [
    async (imagePath: string, rotations: number[]) => {
      if (cache.has(imagePath)) {
        return;
      }
      const imageCache = new Map<number, CachedImage>();
      const source = await readFile(imagePath);
      const needsRasterConversion =
        extname(imagePath).toLowerCase() === ".webp";
      const image =
        needsRasterConversion || rotations.some((rotation) => rotation !== 0)
          ? await loadImage(source)
          : undefined;

      let rasterImage: RasterImage | undefined;
      if (image) {
        const canvas = createCanvas(image!.width, image!.height);
        const context = canvas.getContext("2d");
        context.drawImage(image!, 0, 0);
        rasterImage = context.getImageData(0, 0, image!.width, image!.height);
      }

      if (needsRasterConversion) {
        // The WASM image loader uses stb_image, which cannot decode WebP. The
        // native zxing-cpp blackbox runner decodes WebP through libwebp, so
        // feed the same decoded pixels directly to the WASM decoder instead.
        imageCache.set(0, rasterImage!);
      } else {
        imageCache.set(0, source);
      }
      cache.set(imagePath, imageCache);
      await Promise.all(
        rotations.map(async (rotation) => {
          if (rotation === 0) {
            return;
          }
          imageCache.set(rotation, rotatePixels(rasterImage!, rotation));
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

export { getRotatedImage, warmUpCache };

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

export function isLinearBarcodeFormat(
  barcodeFormat: ReadOutputBarcodeFormat,
): boolean {
  return (
    linearBarcodeFormats.indexOf(barcodeFormat as LinearBarcodeFormat) !== -1
  );
}

function hashBinary(
  value?: Uint8Array | Uint8ClampedArray,
): string | undefined {
  return value
    ? createHash("sha256").update(value).digest("hex").slice(0, 7)
    : undefined;
}

export function takeSnapshot(
  readResult?: ReadResult,
): Record<string, unknown> | null {
  if (!readResult) {
    return null;
  }
  // Keep the full ReadResult contract. YAML changes the representation only;
  // it must not hide a change to the detected quadrilateral or any other
  // result field produced by zxing-cpp.
  return {
    isValid: readResult.isValid,
    error: readResult.error,
    format: readResult.format,
    symbology: readResult.symbology,
    bytes: hashBinary(readResult.bytes),
    bytesECI: hashBinary(readResult.bytesECI),
    text: readResult.text,
    contentType: readResult.contentType,
    hasECI: readResult.hasECI,
    position: {
      topLeft: readResult.position.topLeft,
      topRight: readResult.position.topRight,
      bottomRight: readResult.position.bottomRight,
      bottomLeft: readResult.position.bottomLeft,
    },
    orientation: readResult.orientation,
    isMirrored: readResult.isMirrored,
    isInverted: readResult.isInverted,
    symbologyIdentifier: readResult.symbologyIdentifier,
    sequenceSize: readResult.sequenceSize,
    sequenceIndex: readResult.sequenceIndex,
    sequenceId: readResult.sequenceId,
    lineCount: readResult.lineCount,
    symbol: {
      data: hashBinary(readResult.symbol.data),
      width: readResult.symbol.width,
      height: readResult.symbol.height,
    },
    extra: readResult.extra,
    version: readResult.version,
    readerInit: readResult.readerInit,
    ecLevel: readResult.ecLevel,
  };
}

export function formatSnapshot(value: unknown): string {
  return stringify(value);
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
