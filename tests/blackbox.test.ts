import { readFile } from "node:fs/promises";
import { basename, extname, relative, resolve } from "node:path";
import { glob } from "tinyglobby";
import { beforeAll, describe, expect, test } from "vitest";
import {
  getZXingModule,
  readBarcodesFromImageFile,
} from "../src/reader/index.js";
import { testEntries } from "./testEntries.js";
import {
  DEFAULT_READER_OPTIONS_FOR_TESTS,
  fourOrientations,
  getRotatedImage,
  parseExpectedBinary,
  parseExpectedResult,
  parseExpectedText,
  snapshotResult,
} from "./utils.js";

type Type = "fast" | "slow" | "pure";

type _Summary = {
  [type in Type]?: {
    [rotation in number]?: {
      failures: number;
      misreads: {
        total: number;
        images: {
          path: string;
          description: string;
        }[];
      };
      undetected: {
        total: number;
        images: string[];
      };
    };
  };
};

interface Summary extends _Summary {
  total: number;
}

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

beforeAll(async () => {
  await getZXingModule({
    wasmBinary: await readFile(
      resolve(import.meta.dirname, "../src/reader/zxing_reader.wasm"),
    ),
  });
});

const PATH_PREFIX = "zxing-cpp/test/samples";

for (const {
  directory,
  barcodeFormat,
  testFast = true,
  testSlow = true,
  testPure = false,
  rotations = fourOrientations(barcodeFormat) ? [0, 90, 180, 270] : [0, 180],
  readerOptions = DEFAULT_READER_OPTIONS_FOR_TESTS,
} of testEntries) {
  describe(directory, async () => {
    const types = [
      ...(testFast ? ["fast"] : []),
      ...(testSlow ? ["slow"] : []),
      ...(testPure ? ["pure"] : []),
    ] as Type[];
    const imagePaths = (
      await glob([`${PATH_PREFIX}/${directory}/*.(png|jpg|pgm|gif)`])
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const summary: Summary = {
      total: imagePaths.length,
    };
    for (const imagePath of imagePaths) {
      const imageName = basename(imagePath, extname(imagePath));
      const shortImagePath = relative(PATH_PREFIX, imagePath);
      const [expectedResult, expectedText, expectedBinary] = await Promise.all([
        parseExpectedResult(imagePath),
        parseExpectedText(imagePath),
        parseExpectedBinary(imagePath),
      ]);
      describe(`${directory} ${imageName}`, async () => {
        for (const type of types) {
          summary[type] ??= {};
          for (const rotation of type === "pure" ? [0] : rotations) {
            summary[type][rotation] ??= {
              failures: 0,
              misreads: {
                total: 0,
                images: [],
              },
              undetected: {
                total: 0,
                images: [],
              },
            };
            test(`${directory} ${imageName} ${type} ${rotation}`, async () => {
              const imageBlob = new Blob([
                await getRotatedImage(imagePath, rotation),
              ]);
              const [barcode] = await readBarcodesFromImageFile(imageBlob, {
                ...readerOptions,
                tryHarder: type === "slow",
                tryRotate: type === "slow",
                tryInvert: type === "slow",
                isPure: type === "pure",
                binarizer: type === "pure" ? "FixedThreshold" : "LocalAverage",
              });

              // Snapshot
              expect(snapshotResult(barcode)).toMatchFileSnapshot(
                resolve(
                  import.meta.dirname,
                  `./__snapshots__/${directory}/${imageName}/${type}-${rotation}.json`,
                ),
              );

              // Undetected
              if (barcode === undefined || !barcode.isValid) {
                summary[type]![rotation]!.undetected.images.push(
                  shortImagePath,
                );
                summary[type]![rotation]!.undetected.total += 1;
                return;
              }

              // Format mismatch
              if (barcode.format !== barcodeFormat) {
                summary[type]![rotation]!.misreads.images.push({
                  path: shortImagePath,
                  description: `[Format mismatch]: expected '${barcodeFormat}', but got '${barcode.format}'`,
                });
                summary[type]![rotation]!.misreads.total += 1;
              }

              // .result.txt
              if (expectedResult) {
                let misread = false;
                let description = "[Result mismatch]:";
                for (const [key, value] of Object.entries(
                  expectedResult,
                ) as Entries<typeof expectedResult>) {
                  if (
                    barcode[
                      (key as string) === "ecLevel" ? "eccLevel" : key
                    ].toString() !== value
                  ) {
                    misread = true;
                    description += `\n  ${key}: expected '${value}', but got '${barcode[key]}'`;
                  }
                }
                if (misread) {
                  summary[type]![rotation]!.misreads.images.push({
                    path: shortImagePath,
                    description,
                  });
                  summary[type]![rotation]!.misreads.total += 1;
                }
              }

              // .txt
              if (expectedText) {
                if (barcode.text !== expectedText) {
                  summary[type]![rotation]!.misreads.images.push({
                    path: shortImagePath,
                    description: `[Text content mismatch]: expected '${expectedText}', but got '${barcode.text}'`,
                  });
                  summary[type]![rotation]!.misreads.total += 1;
                }
              }

              // .bin
              if (expectedBinary) {
                if (!expectedBinary.equals(Buffer.from(barcode.bytes))) {
                  summary[type]![rotation]!.misreads.images.push({
                    path: shortImagePath,
                    description: "[Binary content mismatch]",
                  });
                  summary[type]![rotation]!.misreads.total += 1;
                }
              }
            });
          }
        }
      });
    }

    test.sequential(`${directory} summary`, () => {
      for (const type of types) {
        for (const _summary of Object.values(summary[type]!)) {
          _summary!.failures = new Set([
            ..._summary!.misreads.images,
            ..._summary!.undetected.images,
          ]).size;
        }
      }
      expect(`${JSON.stringify(summary, null, 2)}\n`).toMatchFileSnapshot(
        resolve(
          import.meta.dirname,
          `./__snapshots__/${directory}/summary.json`,
        ),
      );
    });
  });
}
