import { readFile } from "node:fs/promises";
import { format, parse, resolve } from "node:path";
import sharp from "sharp";
import { glob } from "tinyglobby";
import { assert, describe, test } from "vitest";
import { defaultReaderOptions } from "../src/bindings/readerOptions.js";
import {
  type ReadResult,
  readBarcodesFromImageFile,
  setZXingModuleOverrides,
} from "../src/reader/index.js";
import { testEntries } from "./testEntries.js";

setZXingModuleOverrides({
  wasmBinary: await readFile(
    resolve(import.meta.dirname, "../src/reader/zxing_reader.wasm"),
  ),
});

for (const {
  directory,
  barcodeFormat,
  total,
  testCases,
  readerOptions = defaultReaderOptions,
} of testEntries) {
  describe(directory, async () => {
    const imagePaths = await glob([
      `zxing-cpp/test/samples/${directory}/*.(png|jpg|pgm|gif)`,
    ]);

    assert.strictEqual(
      imagePaths.length,
      total,
      `${directory} has ${imagePaths.length} image${imagePaths.length > 1 ? "s" : ""}, expected ${total}`,
    );

    for (const {
      type,
      minPassCount,
      maxPassCount,
      maxMisreads,
      rotation,
    } of testCases) {
      test(`Type: ${type} | Rotation: ${rotation}`, async () => {
        const misReadFiles = new Map<string, string>();
        const undetectedFiles = [];

        // TODO: revisit here when defaults are changed
        readerOptions.tryCode39ExtendedMode = true;
        readerOptions.returnCodabarStartEnd = true;
        readerOptions.eanAddOnSymbol = "Ignore";

        readerOptions.textMode = "Escaped";
        readerOptions.tryDownscale = false; // type === "slow";
        readerOptions.downscaleFactor = 2;
        readerOptions.downscaleThreshold = 180;
        readerOptions.tryHarder = type === "slow";
        readerOptions.tryRotate = type === "slow";
        readerOptions.tryInvert = type === "slow";
        readerOptions.isPure = type === "pure";

        if (readerOptions.isPure) {
          readerOptions.binarizer = "FixedThreshold";
        }

        readerOptions.maxNumberOfSymbols = 1;

        for (const imagePath of imagePaths) {
          const imageBuffer =
            rotation === 0
              ? await readFile(imagePath)
              : await sharp(imagePath).rotate(rotation).toBuffer();
          const imageBlob = new Blob([imageBuffer]);

          const [barcode] = await readBarcodesFromImageFile(
            imageBlob,
            readerOptions,
          );

          // undetected
          if (barcode === undefined || barcode.isValid === false) {
            undetectedFiles.push(imagePath);
            continue;
          }

          // format
          if (barcode.format !== barcodeFormat) {
            misReadFiles.set(
              imagePath,
              `${
                misReadFiles.get(imagePath) ?? ""
              }Format mismatch: expected ${barcodeFormat} but got ${barcode.format}\n`,
            );
          }

          // .result.txt
          try {
            const expected = await readFile(
              format({ ...parse(imagePath), base: "", ext: ".result.txt" }),
              { encoding: "utf-8" },
            );

            let compareResult = true;
            let actual = "";

            for await (const line of expected.split(/\r?\n/)) {
              if (line === "" || line.startsWith("#")) {
                continue;
              }

              const [key, expectedValue] = line.split("=");

              if (expectedValue === undefined) {
                compareResult = false;
                actual += "***Bad format, missing equals***\n";
                break;
              }

              let actualValue = barcode[key as keyof ReadResult].toString();
              if (expectedValue !== actualValue) {
                compareResult = false;
                actualValue += " ***Mismatch***";
              }
              actual += `${key}=${actualValue}\n`;
            }

            if (!compareResult) {
              misReadFiles.set(
                imagePath,
                `${
                  misReadFiles.get(imagePath) ?? ""
                }Result mismatch: expected\n${expected} but got\n${actual}\n`,
              );
            }
          } catch {}

          // .txt
          try {
            const expected = await readFile(
              format({ ...parse(imagePath), base: "", ext: ".txt" }),
              { encoding: "utf-8" },
            );

            const escapedExpected = escapeNonGraphical(expected);

            const actual = barcode.text;

            if (actual !== escapedExpected) {
              misReadFiles.set(
                imagePath,
                `${
                  misReadFiles.get(imagePath) ?? ""
                }Content mismatch: expected '${escapedExpected}' but got '${actual}'\n`,
              );
            }
          } catch {}

          // .bin
          try {
            const expected = await readFile(
              format({ ...parse(imagePath), base: "", ext: ".bin" }),
            );

            const actual = Buffer.from(barcode.bytes);

            if (!expected.equals(actual)) {
              misReadFiles.set(
                imagePath,
                `${
                  misReadFiles.get(imagePath) ?? ""
                }Content mismatch: expected '${expected.toString("hex")}' but got '${actual.toString("hex")}'\n`,
              );
            }
          } catch {}
        }

        const passCount = total - undetectedFiles.length - misReadFiles.size;

        console.log(
          `Type: ${type}\nRotation: ${rotation}\nTotal: ${total}\nPasses: ${passCount} / [${minPassCount}, ${
            maxPassCount === Number.POSITIVE_INFINITY ? "Inf" : maxPassCount
          }]\nMisreads: ${misReadFiles.size} / ${maxMisreads}`,
        );

        let message = "";
        if (passCount < minPassCount && undetectedFiles.length > 0) {
          message += `Undetected (${type}):\n${indent(undetectedFiles.join("\n"))}\n`;
        }
        if (passCount > minPassCount) {
          message += `More detected (${type}): ${passCount - minPassCount}\n`;
        }
        if (passCount > maxPassCount) {
          message += `Over-detected (${type}): ${passCount - maxPassCount}\n`;
        }
        if (misReadFiles.size > maxMisreads) {
          message += `Misread (${type}):\n${indent(
            [...misReadFiles]
              .map(([key, value]) => `${key}:\n${indent(value)}`)
              .join("\n"),
          )}\n`;
        }

        console.log(message);
      });
    }
  });
}

function indent(str: string, indent = "  "): string {
  return str
    .split(/\r?\n/)
    .map((line) => `${indent}${line}`)
    .join("\n");
}

function escapeNonGraphical(str: string): string {
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
