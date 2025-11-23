import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import {
  prepareZXingModule as prepareZXingFullModule,
  purgeZXingModule as purgeZXingFullModule,
} from "../src/full/index.js";
import {
  prepareZXingModule as prepareZXingReaderModule,
  readBarcodes,
} from "../src/reader/index.js";

describe("prepare zxing module", () => {
  const consoleMock = vi.spyOn(console, "error").mockImplementation(() => {});

  afterAll(() => {
    consoleMock.mockReset();
  });

  test("no module promise should be created without fireImmediately", () => {
    const modulePromise = prepareZXingFullModule();

    expect(modulePromise).toBe(undefined);
  });

  test("module promise should be created with fireImmediately", () => {
    const modulePromise = prepareZXingFullModule({
      fireImmediately: true,
    });

    modulePromise.catch(() => {});

    expect(modulePromise).toBeInstanceOf(Promise);
  });

  test("module promise should be reused with no overrides", () => {
    const modulePromise1 = prepareZXingFullModule({
      fireImmediately: true,
    });

    modulePromise1.catch(() => {});

    const modulePromise2 = prepareZXingFullModule({
      fireImmediately: true,
    });

    modulePromise2.catch(() => {});

    expect(modulePromise1).toBe(modulePromise2);
  });

  test("module promise should be reused with same overrides (Object.is)", () => {
    const overrides = {};

    const modulePromise1 = prepareZXingFullModule({
      overrides,
      fireImmediately: true,
    });

    modulePromise1.catch(() => {});

    const modulePromise2 = prepareZXingFullModule({
      overrides,
      fireImmediately: true,
    });

    modulePromise2.catch(() => {});

    expect(modulePromise1).toBe(modulePromise2);
  });

  test("module promise should be reused with same overrides (shallow)", () => {
    const modulePromise1 = prepareZXingFullModule({
      overrides: {},
      fireImmediately: true,
    });

    modulePromise1.catch(() => {});

    const modulePromise2 = prepareZXingFullModule({
      overrides: {},
      fireImmediately: true,
    });

    modulePromise2.catch(() => {});

    expect(modulePromise1).toBe(modulePromise2);
  });

  test("module promise shouldn't be reused with different overrides", () => {
    const modulePromise1 = prepareZXingFullModule({
      overrides: {
        locateFile: (url) => url,
      },
      fireImmediately: true,
    });

    modulePromise1.catch(() => {});

    const modulePromise2 = prepareZXingFullModule({
      overrides: {},
      fireImmediately: true,
    });

    modulePromise2.catch(() => {});

    const modulePromise3 = prepareZXingFullModule({
      overrides: {
        locateFile: (url) => url,
      },
      fireImmediately: true,
    });

    modulePromise3.catch(() => {});

    expect(modulePromise1).not.toBe(modulePromise2);
    expect(modulePromise1).not.toBe(modulePromise3);
  });

  test("equalityFn should work", () => {
    const modulePromise1 = prepareZXingFullModule({
      overrides: {},
      fireImmediately: true,
    });

    modulePromise1.catch(() => {});

    const modulePromise2 = prepareZXingFullModule({
      overrides: {},
      fireImmediately: true,
      equalityFn: Object.is,
    });

    modulePromise2.catch(() => {});

    expect(modulePromise1).not.toBe(modulePromise2);
  });

  test("purgeZXingModule should work", () => {
    const modulePromise1 = prepareZXingFullModule({
      overrides: {},
      fireImmediately: true,
    });

    modulePromise1.catch(() => {});

    purgeZXingFullModule();

    const modulePromise2 = prepareZXingFullModule({
      overrides: {},
      fireImmediately: true,
    });

    modulePromise2.catch(() => {});

    expect(modulePromise1).not.toBe(modulePromise2);
  });

  test("purgeZXingModule shouldn't affect each other", () => {
    const modulePromise1 = prepareZXingFullModule({
      overrides: {},
      fireImmediately: true,
    });

    modulePromise1.catch(() => {});

    const modulePromise2 = prepareZXingReaderModule({
      overrides: {},
      fireImmediately: true,
    });

    modulePromise2.catch(() => {});

    purgeZXingFullModule();

    const modulePromise3 = prepareZXingReaderModule({
      overrides: {},
      fireImmediately: true,
    });

    modulePromise3.catch(() => {});

    expect(modulePromise2).toBe(modulePromise3);
  });
});

describe("readBarcodes input", async () => {
  const arrayBuffer = await readFile(
    fileURLToPath(new URL("./samples/qrcode/wikipedia.png", import.meta.url)),
  );

  beforeAll(async () => {
    await prepareZXingReaderModule({
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

  test("readBarcodes accepts ArrayBuffer as input", async () => {
    const readResult = await readBarcodes(arrayBuffer);
    expect(readResult).length(1);
    expect(readResult[0].text).toBe("http://en.m.wikipedia.org");
  });

  test("readBarcodes accepts Blob as input", async () => {
    const blob = new Blob([arrayBuffer], { type: "image/png" });
    const readResult = await readBarcodes(blob);
    expect(readResult).length(1);
    expect(readResult[0].text).toBe("http://en.m.wikipedia.org");
  });

  test("readBarcodes accepts File as input", async () => {
    const file = new File([arrayBuffer], "wikipedia.png", {
      type: "image/png",
    });
    const readResult = await readBarcodes(file);
    expect(readResult).length(1);
    expect(readResult[0].text).toBe("http://en.m.wikipedia.org");
  });

  test("readBarcodes accepts Uint8Array as input", async () => {
    const uint8Array = new Uint8Array(arrayBuffer);
    const readResult = await readBarcodes(uint8Array);
    expect(readResult).length(1);
    expect(readResult[0].text).toBe("http://en.m.wikipedia.org");
  });

  test("readBarcodes accepts ImageData as input", async () => {
    const image = await loadImage(arrayBuffer);
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, image.width, image.height);
    const imageData = context.getImageData(0, 0, image.width, image.height);

    Object.defineProperty(imageData, "colorSpace", {
      value: "srgb",
      writable: false,
    });

    const readResult = await readBarcodes(imageData as ImageData);
    expect(readResult).length(1);
    expect(readResult[0].text).toBe("http://en.m.wikipedia.org");
  });
});
