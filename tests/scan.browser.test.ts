import { describe, expect, test } from "vitest";
import type { ReadResult } from "../src/bindings/index.js";
import { defaultReaderOptions } from "../src/reader/index.js";
import { scan } from "../src/scanner/index.js";

const QR_IMAGE_URL = "/tests/samples/qrcode/wikipedia.png";

const BASE_READER_OPTIONS = {
  ...defaultReaderOptions,
  textMode: "Escaped" as const,
  tryDownscale: false,
  maxNumberOfSymbols: 1,
};

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

async function nextResults(
  iterator: AsyncGenerator<ReadResult[], void, undefined>,
) {
  const result = await iterator.next();
  expect(result.done).toBe(false);
  return result.value;
}

describe("scan (browser integration)", () => {
  test("scans QR code from <img> on the main thread", async () => {
    const image = await loadImage(QR_IMAGE_URL);
    const iterator = scan(image, { readerOptions: BASE_READER_OPTIONS });

    try {
      const results = await nextResults(iterator);
      expect(results).toHaveLength(1);
      expect(results?.[0].format).toBe("QRCode");
      expect(results?.[0].text).toContain("http");
    } finally {
      await iterator.return?.();
    }
  });

  test("scans QR code from <img> in worker mode", async () => {
    const image = await loadImage(QR_IMAGE_URL);
    const iterator = scan(image, {
      readerOptions: BASE_READER_OPTIONS,
      worker: true,
    });

    try {
      const results = await nextResults(iterator);
      expect(results).toHaveLength(1);
      expect(results?.[0].format).toBe("QRCode");
      expect(results?.[0].text).toContain("http");
    } finally {
      await iterator.return?.();
    }
  });

  test("uses the latest readerOptions getter value on the next frame", async () => {
    const image = await loadImage(QR_IMAGE_URL);
    let formats: ("Code128" | "QRCode")[] = ["Code128"];
    const iterator = scan(image, {
      readerOptions: () => ({
        ...BASE_READER_OPTIONS,
        formats,
      }),
    });

    try {
      expect(await nextResults(iterator)).toEqual([]);

      formats = ["QRCode"];
      const results = await nextResults(iterator);
      expect(results).toHaveLength(1);
      expect(results?.[0].format).toBe("QRCode");
    } finally {
      await iterator.return?.();
    }
  });

  test("does not cross wires between concurrent clients sharing one worker", async () => {
    const [imageA, imageB] = await Promise.all([
      loadImage(QR_IMAGE_URL),
      loadImage(QR_IMAGE_URL),
    ]);
    const workerKey = "shared-test-worker";
    const iteratorA = scan(imageA, {
      worker: workerKey,
      readerOptions: {
        ...BASE_READER_OPTIONS,
        formats: ["QRCode"],
      },
    });
    const iteratorB = scan(imageB, {
      worker: workerKey,
      readerOptions: {
        ...BASE_READER_OPTIONS,
        formats: ["Code128"],
      },
    });

    try {
      const [qrResults, code128Results] = await Promise.all([
        nextResults(iteratorA),
        nextResults(iteratorB),
      ]);

      expect(qrResults).toHaveLength(1);
      expect(qrResults?.[0].format).toBe("QRCode");
      expect(code128Results).toEqual([]);
    } finally {
      await Promise.all([iteratorA.return?.(), iteratorB.return?.()]);
    }
  });
});
