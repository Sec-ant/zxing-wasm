import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { glob } from "tinyglobby";
import { beforeAll, describe, expect, test } from "vitest";
import {
  prepareZXingModule,
  type ReaderOptions,
  readBarcodes,
} from "../src/reader/index.js";
import { testEntries } from "./testEntries.js";
import {
  type FixtureMode,
  fixtureApplies,
  fixtureMismatch,
  loadFixtureProperties,
  parseFixtureToml,
} from "./upstreamFixtures.js";
import { getRotatedImage, warmUpCache } from "./utils.js";

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

test("upstream symbol tables inherit defaults independently", () => {
  expect(
    parseFixtureToml(
      'Format = "QR Code"\n[[symbol]]\nTextPlain = "first"\n[[symbol]]\nTextPlain = "second"',
    ),
  ).toEqual([
    { Format: "QR Code", TextPlain: "first" },
    { Format: "QR Code", TextPlain: "second" },
  ]);
});

test("upstream filters keep modes and rotations separate", () => {
  expect(
    [0, 90, 180, 270].map((rotation) =>
      fixtureApplies("sa fh p0", "fast", rotation),
    ),
  ).toEqual([true, false, true, false]);
  expect(fixtureApplies("sa fh p0", "pure", 90)).toBe(false);
  expect(() => fixtureApplies("x", "slow", 0)).toThrow();
});

for (const { directory, barcodeFormat } of testEntries.filter(
  ({ upstreamContract }) => upstreamContract,
)) {
  describe(`${directory} upstream contract`, async () => {
    const imagePaths = (
      await glob(`zxing-cpp/test/samples/${directory}/*.(png|jpg|pgm|gif|webp)`)
    ).sort();
    test("contains image fixtures", () =>
      expect(imagePaths.length).toBeGreaterThan(0));
    for (const imagePath of imagePaths) {
      const records = await loadFixtureProperties(imagePath, barcodeFormat);
      const first = records[0]!;
      const search = `${first.find} ${first.search ?? ""}`;
      const cases: { mode: FixtureMode; rotation: number }[] = [];
      for (const mode of ["slow", "fast", "pure"] as const) {
        for (const rotation of [0, 90, 180, 270]) {
          if (fixtureApplies(search, mode, rotation))
            cases.push({ mode, rotation });
        }
      }
      describe(imagePath, () => {
        beforeAll(() =>
          warmUpCache(imagePath, [
            ...new Set(cases.map(({ rotation }) => rotation)),
          ]),
        );
        for (const { mode, rotation } of cases) {
          test(`${mode} ${rotation}`, async () => {
            const options: ReaderOptions = {
              textMode: "Plain",
              tryDownscale: false,
              downscaleFactor: 2,
              downscaleThreshold: 180,
              tryHarder: mode === "slow",
              tryRotate: mode === "slow",
              tryInvert: mode === "slow",
              isPure: mode === "pure",
              binarizer: mode === "pure" ? "FixedThreshold" : "LocalAverage",
            };
            if (first.formats !== undefined) {
              if (first.formats !== "upca")
                throw new Error(
                  `Unsupported fixture formats: ${first.formats}`,
                );
              options.formats = ["UPCA"];
            }
            if (first.eanAddOnSymbol !== undefined) {
              options.eanAddOnSymbol =
                first.eanAddOnSymbol === "require"
                  ? "Require"
                  : first.eanAddOnSymbol === "read"
                    ? "Read"
                    : "Ignore";
            }
            if (first.maxNumberOfSymbols !== undefined)
              options.maxNumberOfSymbols = Number(first.maxNumberOfSymbols);
            if (first.returnErrors !== undefined)
              options.returnErrors = first.returnErrors === "true";
            const input = await getRotatedImage(imagePath, rotation);
            const found = await readBarcodes(
              Buffer.isBuffer(input)
                ? new Blob([input as BlobPart])
                : (input as ImageData),
              options,
            );
            if (barcodeFormat === "None" && directory.startsWith("none-")) {
              expect(
                found,
                "negative fixtures must not produce false positives",
              ).toEqual([]);
              return;
            }
            const remaining = [...found];
            for (const expected of records) {
              if (
                !fixtureApplies(expected.find!, mode, rotation) ||
                fixtureApplies(expected.missing ?? "", mode, rotation)
              )
                continue;
              const index = remaining.findIndex(
                (barcode) => fixtureMismatch(barcode, expected) === undefined,
              );
              expect(
                index,
                `Missing upstream symbol ${JSON.stringify(expected)}; found ${JSON.stringify(found.map(({ format, text, symbologyIdentifier }) => ({ format, text, symbologyIdentifier })))}`,
              ).toBeGreaterThanOrEqual(0);
              expect(remaining[index]!.isValid).toBe(true);
              remaining.splice(index, 1);
            }
            for (const barcode of remaining) {
              expect(
                records.some(
                  (expected) =>
                    fixtureMismatch(barcode, expected) === undefined,
                ),
                `Unexpected symbol ${JSON.stringify({ format: barcode.format, text: barcode.text })}`,
              ).toBe(true);
            }
          });
        }
      });
    }
  });
}
