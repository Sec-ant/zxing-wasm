import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";
import { prepareZXingModule, writeBarcode } from "../src/writer/index.js";

describe("zxing/writer", async () => {
  beforeAll(async () => {
    await prepareZXingModule({
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
