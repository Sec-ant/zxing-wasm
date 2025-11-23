import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, test, vi } from "vitest";
import {
  prepareZXingModule as prepareZXingModuleForReading,
  readBarcodes,
} from "../src/reader/index.js";
import {
  prepareZXingModule as prepareZXingModuleForWriting,
  writeBarcode,
} from "../src/writer/index.js";

describe("zxing/writer", async () => {
  beforeAll(async () => {
    await prepareZXingModuleForWriting({
      overrides: {
        wasmBinary: (
          await readFile(
            resolve(import.meta.dirname, "../src/writer/zxing_writer.wasm"),
          )
        ).buffer as ArrayBuffer,
      },
      fireImmediately: true,
    });
  });

  test("#211", async () => {
    await expect(
      writeBarcode(new Uint8Array(48).fill(0), {
        format: "Aztec",
        scale: 0,
        withQuietZones: true,
        withHRT: false,
      }),
    ).resolves.not.toThrowError();
  });

  test("#215", async () => {
    await expect(
      writeBarcode("123456", {
        format: "PDF417",
      }),
    ).resolves.not.toThrowError();

    await expect(
      writeBarcode("123456", {
        format: "PDF417",
      }),
    ).resolves.not.toThrowError();
  });
});

describe("zxing/reader", async () => {
  beforeAll(async () => {
    await prepareZXingModuleForReading({
      overrides: {
        wasmBinary: (
          await readFile(
            resolve(import.meta.dirname, "../src/reader/zxing_reader.wasm"),
          )
        ).buffer as ArrayBuffer,
      },
      fireImmediately: true,
    });
  });

  test("#223@barcode-detector", async () => {
    // Simulate old environment without Array.prototype.entries using spyOn
    const entriesSpy = vi
      .spyOn(Array.prototype, "entries")
      .mockImplementation(function (this: unknown[]) {
        throw new TypeError("entries is not a function");
      });

    try {
      const image = await readFile(
        resolve(import.meta.dirname, "./samples/qrcode/wikipedia.png"),
      );

      // Test that readBarcode still works without .entries()
      const result = await readBarcodes(image);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].text).toBe("http://en.m.wikipedia.org");
    } finally {
      // Restore Array.prototype.entries
      entriesSpy.mockRestore();
    }
  });
});
