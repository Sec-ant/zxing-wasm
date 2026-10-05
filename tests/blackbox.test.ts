import { readdir, readFile } from "node:fs/promises";
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
import { formatToLabel } from "../src/bindings/barcodeFormat.js";
import {
  prepareZXingModule,
  type ReaderOptions,
  readBarcodes,
} from "../src/reader/index.js";
import { testEntries } from "./testEntries.js";
import {
  DEFAULT_READER_OPTIONS_FOR_TESTS,
  formatSnapshot,
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

const SAMPLES_PATH_PREFIX = "zxing-cpp/test/samples";
const upstreamSampleDirectories = (
  await readdir(SAMPLES_PATH_PREFIX, {
    withFileTypes: true,
  })
)
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const configuredSampleDirectories = new Set(
  testEntries.map(({ directory }) => directory),
);
const intentionallyUncoveredSampleDirectories = new Set([
  "code39ext-1",
  "databarExp-1",
  "databarExp-2",
  "databarExp-3",
  "databarExpStk-1",
  "databarOmni-1",
  "databarStk-1",
  "datamatrix-5",
  "ean13-ext-1",
  "multi-1",
  "none-1",
  "none-2",
  "upca-ext-1",
]);
const upstreamSampleDirectorySet = new Set(upstreamSampleDirectories);

test("consistent test entries", async () => {
  expect(
    [...configuredSampleDirectories].filter(
      (directory) => !upstreamSampleDirectorySet.has(directory),
    ),
  ).toEqual([]);
  expect(
    upstreamSampleDirectories.filter(
      (directory) =>
        !configuredSampleDirectories.has(directory) &&
        !intentionallyUncoveredSampleDirectories.has(directory),
    ),
  ).toEqual([]);
  expect(
    [...intentionallyUncoveredSampleDirectories].filter(
      (directory) =>
        !upstreamSampleDirectorySet.has(directory) ||
        configuredSampleDirectories.has(directory),
    ),
  ).toEqual([]);
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
} of testEntries.filter(({ directory }) =>
  upstreamSampleDirectories.includes(directory),
)) {
  describe(directory, async () => {
    const types = [
      ...(testFast ? ["fast"] : []),
      ...(testSlow ? ["slow"] : []),
      ...(testPure ? ["pure"] : []),
    ] as Type[];
    const imagePaths = (
      await glob([
        `${SAMPLES_PATH_PREFIX}/${directory}/*.(png|jpg|pgm|gif|webp)`,
      ])
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const imageNameCounts = new Map<string, number>();
    for (const imagePath of imagePaths) {
      const imageName = basename(imagePath, extname(imagePath));
      imageNameCounts.set(imageName, (imageNameCounts.get(imageName) ?? 0) + 1);
    }
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
      const snapshotName =
        imageNameCounts.get(imageName)! > 1 ? imageNameWithExt : imageName;
      const snapshots: Partial<
        Record<Type, Record<number, ReturnType<typeof takeSnapshot>>>
      > = {};
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
          snapshots[type] ??= {};
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

              const input = await getRotatedImage(imagePath, rotation);

              const appliedReaderOptions: ReaderOptions = {
                ...readerOptions,
                tryHarder: type === "slow",
                tryRotate: type === "slow",
                tryInvert: type === "slow",
                isPure: type === "pure",
                binarizer: type === "pure" ? "FixedThreshold" : "LocalAverage",
              };

              const [barcode] = await readBarcodes(
                Buffer.isBuffer(input)
                  ? new Blob([input as BlobPart])
                  : (input as ImageData),
                appliedReaderOptions,
              );

              snapshots[type]![rotation] = takeSnapshot(barcode);

              if (barcode === undefined || !barcode.isValid) {
                summary[type]![rotation].undetected!.images.push(
                  imageNameWithExt,
                );
                summary[type]![rotation].undetected!.total += 1;
                passCurrent = false;
                return;
              }
              if (
                barcode.format !== barcodeFormat &&
                barcode.symbology !== barcodeFormat
              ) {
                summary[type]![rotation].misreads!.images.push({
                  path: imageNameWithExt,
                  description: `[Format mismatch]: expected '${barcodeFormat}', but got '${barcode.format}'`,
                });
                summary[type]![rotation].misreads!.total += 1;
                passCurrent = false;
              }

              if (expectedResult) {
                let misread = false;
                let description = "[Result mismatch]:";
                for (const [key, value] of Object.entries(
                  expectedResult,
                ) as Entries<typeof expectedResult>) {
                  const actual =
                    key === "format"
                      ? (formatToLabel(barcode[key]) ?? barcode[key].toString())
                      : barcode[key].toString();
                  if (actual !== value) {
                    misread = true;
                    description += `\n  ${key}: expected '${value}', but got '${actual}'`;
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
        test(`${directory} ${imageName} snapshot`, {
          concurrent: false,
        }, async () => {
          await expect(formatSnapshot(snapshots)).toMatchFileSnapshot(
            resolve(
              import.meta.dirname,
              `./__snapshots__/${directory}/${snapshotName}.yaml`,
            ),
          );
        });
      });
    }
    test(`${directory} summary`, { concurrent: false }, async () => {
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
      await expect(formatSnapshot(summary)).toMatchFileSnapshot(
        resolve(
          import.meta.dirname,
          `./__snapshots__/${directory}/summary.yaml`,
        ),
      );
    });
  });
}
