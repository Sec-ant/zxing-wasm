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

            const actual = barcode.text;

            if (actual !== expected) {
              misReadFiles.set(
                imagePath,
                `${
                  misReadFiles.get(imagePath) ?? ""
                }Content mismatch: expected '${expected}' but got '${actual}'\n`,
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
