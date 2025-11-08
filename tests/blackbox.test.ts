import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { glob } from "tinyglobby";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
} from "vitest";
import {
  prepareZXingModule,
  type ReaderOptions,
  readBarcodes,
} from "../src/reader/index.js";
import { testEntries } from "./testEntries.js";
import {
  DEFAULT_READER_OPTIONS_FOR_TESTS,
  getRotatedImage,
  isLinearBarcodeFormat,
  parseExpectedBinary,
  parseExpectedResult,
  parseExpectedText,
  takeSnapshot,
  warmUpCache,
} from "./utils.js";

type Type = "fast" | "slow" | "pure";

type _Summary = {
  [type in Type]?: {
    [rotation in number]: {
      failures?: number;
      misreads?: {
        total: number;
        images: {
          path: string;
          description: string;
        }[];
      };
      undetected?: {
        total: number;
        images: string[];
      };
    };
  };
};

interface Summary extends _Summary {
  total: number;
  passAll: number;
  passSome: number;
}

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

const TEST_RUNNER_PATH = resolve(
  import.meta.dirname,
  "../zxing-cpp/test/blackbox/BlackboxTestRunner.cpp",
);
const SAMPLES_PATH_PREFIX = "zxing-cpp/test/samples";

test("consistent test entries", async () => {
  const zxingCppBlackBoxTestRunner = await readFile(TEST_RUNNER_PATH, "utf-8");
  const testDirs = zxingCppBlackBoxTestRunner.match(
    /(?<=runTests\(")[^"]+?(?=",)/g,
  );
  expect(testDirs).toBeDefined();
  expect(testDirs).toEqual(testEntries.map(({ directory }) => directory));
});

await prepareZXingModule({
  overrides: {
    wasmBinary: (
      await readFile(
        resolve(import.meta.dirname, "../src/reader/zxing_reader.wasm"),
      )
    ).buffer as ArrayBuffer,
  },
  fireImmediately: true,
});

for (const {
  directory,
  barcodeFormat,
  testFast = true,
  testSlow = true,
  testPure = false,
  rotations = isLinearBarcodeFormat(barcodeFormat)
    ? [0, 180]
    : [0, 90, 180, 270],
  readerOptions = DEFAULT_READER_OPTIONS_FOR_TESTS,
} of testEntries) {
  describe(directory, async () => {
    const types = [
      ...(testFast ? ["fast"] : []),
      ...(testSlow ? ["slow"] : []),
      ...(testPure ? ["pure"] : []),
    ] as Type[];
    const imagePaths = (
      await glob([`${SAMPLES_PATH_PREFIX}/${directory}/*.(png|jpg|pgm|gif)`])
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const summary: Summary = {
      total: imagePaths.length,
      passAll: 0,
      passSome: 0,
    };
    for (const imagePath of imagePaths) {
      let passAll = true;
      let passSome = false;
      const imageName = basename(imagePath, extname(imagePath));
      const imageNameWithExt = basename(imagePath);
      const [expectedResult, expectedText, expectedBinary] = await Promise.all([
        parseExpectedResult(imagePath),
        parseExpectedText(imagePath),
        parseExpectedBinary(imagePath),
      ]);
      describe(`${directory} ${imageName}`, async () => {
        beforeAll(async () => {
          await warmUpCache(imagePath, rotations);
        });
        afterAll(() => {
          if (passAll) {
            ++summary.passAll;
          }
          if (passSome) {
            ++summary.passSome;
          }
        });
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
              let passCurrent = true;

              onTestFinished(() => {
                passAll &&= passCurrent;
                passSome ||= passCurrent;
              });

              const imageBlob = new Blob([
                (await getRotatedImage(imagePath, rotation)) as BlobPart,
              ]);

              const appliedReaderOptions: ReaderOptions = {
                ...readerOptions,
                tryHarder: type === "slow",
                tryRotate: type === "slow",
                tryInvert: type === "slow",
                isPure: type === "pure",
                binarizer: type === "pure" ? "FixedThreshold" : "LocalAverage",
              };

              const [barcode] = await readBarcodes(
                imageBlob,
                appliedReaderOptions,
              );

              // Snapshot
              await expect(takeSnapshot(barcode)).toMatchFileSnapshot(
                resolve(
                  import.meta.dirname,
                  `./__snapshots__/${directory}/${imageName}/${type}-${rotation}.json`,
                ),
              );

              // Undetected
              if (barcode === undefined || !barcode.isValid) {
                summary[type]![rotation].undetected!.images.push(
                  imageNameWithExt,
                );
                summary[type]![rotation].undetected!.total += 1;
                passCurrent = false;
                return;
              }

              // Format mismatch
              if (barcode.format !== barcodeFormat) {
                summary[type]![rotation].misreads!.images.push({
                  path: imageNameWithExt,
                  description: `[Format mismatch]: expected '${barcodeFormat}', but got '${barcode.format}'`,
                });
                summary[type]![rotation].misreads!.total += 1;
                passCurrent = false;
              }

              // .result.txt
              if (expectedResult) {
                let misread = false;
                let description = "[Result mismatch]:";
                for (const [key, value] of Object.entries(
                  expectedResult,
                ) as Entries<typeof expectedResult>) {
                  if (barcode[key].toString() !== value) {
                    misread = true;
                    description += `\n  ${key}: expected '${value}', but got '${barcode[key]}'`;
                  }
                }
                if (misread) {
                  summary[type]![rotation].misreads!.images.push({
                    path: imageNameWithExt,
                    description,
                  });
                  summary[type]![rotation].misreads!.total += 1;
                  passCurrent = false;
                }
              }

              // .txt
              if (expectedText) {
                if (barcode.text !== expectedText) {
                  summary[type]![rotation].misreads!.images.push({
                    path: imageNameWithExt,
                    description: `[Text content mismatch]: expected '${expectedText}', but got '${barcode.text}'`,
                  });
                  summary[type]![rotation].misreads!.total += 1;
                  passCurrent = false;
                }
              }

              // .bin
              if (expectedBinary) {
                if (!expectedBinary.equals(Buffer.from(barcode.bytes))) {
                  summary[type]![rotation].misreads!.images.push({
                    path: imageNameWithExt,
                    description: "[Binary content mismatch]",
                  });
                  summary[type]![rotation].misreads!.total += 1;
                  passCurrent = false;
                }
              }
            });
          }
        }
      });
    }
    test.sequential(`${directory} summary`, async () => {
      for (const type of types) {
        for (const _summary of Object.values(summary[type]!)) {
          _summary!.failures = new Set([
            ..._summary!.misreads!.images,
            ..._summary!.undetected!.images,
          ]).size;
          if (_summary!.misreads!.total === 0) {
            delete _summary!.misreads;
          }
          if (_summary!.undetected!.total === 0) {
            delete _summary!.undetected;
          }
          if (_summary!.failures === 0) {
            delete _summary!.failures;
          }
        }
      }
      await expect(`${JSON.stringify(summary, null, 2)}\n`).toMatchFileSnapshot(
        resolve(
          import.meta.dirname,
          `./__snapshots__/${directory}/summary.json`,
        ),
      );
    });
  });
}
