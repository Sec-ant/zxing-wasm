import { readFile } from "node:fs/promises";
import { format, parse, resolve } from "node:path";
import sharp from "sharp";
import { glob } from "tinyglobby";
import { assert, describe, test } from "vitest";
import { defaultReaderOptions } from "../src/bindings/readerOptions.js";
import {
  type BarcodeFormat,
  type ReadResult,
  type ReaderOptions,
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

    for (const { type, minPassCount, maxMisreads, rotation } of testCases) {
      test(`should pass ${type} test with rotation ${rotation}`, async () => {
        const passCount = 0;
        const misreads = 0;

        const notDetectedFiles = [];

        readerOptions.tryDownscale = false;
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

          if (barcode === undefined || barcode.isValid === false) {
            notDetectedFiles.push(imagePath);
            continue;
          }

          const error = checkResult(imagePath, barcodeFormat, barcode);
        }
      });
    }
  });
}

async function checkResult(
  imagePath: string,
  expectedFormat: BarcodeFormat,
  barcode: ReadResult,
): string {
  if (barcode.format !== expectedFormat) {
    return `Format mismatch: expected '${expectedFormat}' but got '${barcode.format}'`;
  }

  const file = await readFile(
    format({ ...parse(imagePath), base: "", ext: ".result.txt" }),
    { encoding: "utf-8" },
  );

  if (file) {
  }

  return "Error reading file";
}
