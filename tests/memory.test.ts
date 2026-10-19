import { readFile } from "node:fs/promises";
import { afterEach, expect, test, vi } from "vitest";
import { rgbaToGrayscale } from "../src/grayscale.js";
import {
  prepareZXingModule,
  purgeZXingModule,
  readBarcodes,
} from "../src/reader/index.js";

afterEach(() => {
  vi.restoreAllMocks();
  purgeZXingModule();
});

test("writes grayscale values into the supplied destination", () => {
  const rgba = new Uint8ClampedArray([
    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0,
    255,
  ]);
  const luminance = new Uint8Array(5);
  rgbaToGrayscale(rgba, luminance);
  expect(luminance).toEqual(new Uint8Array([76, 150, 29, 255, 0]));
});

test("deletes result vectors after conversion, including conversion failures", async () => {
  const module = await prepareZXingModule({
    overrides: {
      wasmBinary: Uint8Array.from(
        await readFile(
          new URL("../src/reader/zxing_reader.wasm", import.meta.url),
        ),
      ).buffer,
    },
    fireImmediately: true,
  });
  const input = await readFile(
    new URL("./samples/qrcode/wikipedia.png", import.meta.url),
  );
  const original = module.readBarcodesFromImage.bind(module);
  const deleted = vi.fn();
  const read = vi
    .spyOn(module, "readBarcodesFromImage")
    .mockImplementation((...args) => {
      const vector = original(...args);
      const destroy = vector.delete.bind(vector);
      vector.delete = () => {
        deleted();
        destroy();
      };
      return vector;
    });
  const first = await readBarcodes(input);
  const bytes = first[0]!.bytes.slice();
  expect(await readBarcodes(input)).toEqual(first);
  expect(first[0]!.bytes).toEqual(bytes);
  expect(deleted).toHaveBeenCalledTimes(2);

  read.mockReturnValueOnce({
    size: () => 1,
    get: () => {
      throw new Error("conversion failed");
    },
    delete: deleted,
  });
  await expect(readBarcodes(input)).rejects.toThrow("conversion failed");
  expect(deleted).toHaveBeenCalledTimes(3);
});
