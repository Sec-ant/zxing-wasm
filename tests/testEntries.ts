import { defaultReaderOptions } from "../src/bindings/readerOptions.js";
import type { BarcodeFormat, ReaderOptions } from "../src/reader/index.js";

interface TestEntry {
  directory: string;
  barcodeFormat: BarcodeFormat;
  total: number;
  testCases: TestCase[];
  readerOptions?: ReaderOptions;
}

interface TestCase {
  type: "fast" | "slow" | "pure";
  minPassCount: number;
  maxMisreads: number;
  rotation: number;
}

interface DefineFastAndSlowTestCaseProps {
  fastMinPassCount: number;
  fastMaxMisreads?: number;
  slowMinPassCount: number;
  slowMaxMisreads?: number;
  rotations?: number[];
}

function defineFastAndSlowTestCases({
  fastMinPassCount,
  fastMaxMisreads = 0,
  slowMinPassCount,
  slowMaxMisreads = 0,
  rotations = [0, 90, 180, 270],
}: DefineFastAndSlowTestCaseProps): TestCase[] {
  return rotations.flatMap((rotation) => [
    {
      type: "fast",
      minPassCount: fastMinPassCount,
      maxMisreads: fastMaxMisreads,
      rotation,
    },
    {
      type: "slow",
      minPassCount: slowMinPassCount,
      maxMisreads: slowMaxMisreads,
      rotation,
    },
  ]);
}

interface DefinePureTestCaseProps {
  minPassCount: number;
  maxMisreads?: number;
}

function definePureTestCase({
  minPassCount,
  maxMisreads = 0,
}: DefinePureTestCaseProps): TestCase {
  return {
    type: "pure",
    minPassCount: minPassCount,
    maxMisreads: maxMisreads,
    rotation: 0,
  };
}

export const testEntries: TestEntry[] = [
  {
    directory: "aztec-1",
    barcodeFormat: "Aztec",
    total: 31,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 30,
        slowMinPassCount: 31,
      }),
      definePureTestCase({
        minPassCount: 29,
      }),
    ],
  },
  {
    directory: "aztec-2",
    barcodeFormat: "Aztec",
    total: 22,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 21,
        slowMinPassCount: 21,
      }),
    ],
  },
  {
    directory: "datamatrix-1",
    barcodeFormat: "DataMatrix",
    total: 29,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 29,
        slowMinPassCount: 29,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 27,
        rotations: [90, 180, 270],
      }),
      definePureTestCase({
        minPassCount: 28,
      }),
    ],
  },
  {
    directory: "datamatrix-2",
    barcodeFormat: "DataMatrix",
    total: 13,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 13,
        slowMinPassCount: 13,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 13,
        rotations: [90, 180, 270],
      }),
    ],
  },
  {
    directory: "datamatrix-3",
    barcodeFormat: "DataMatrix",
    total: 21,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 20,
        slowMinPassCount: 21,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 21,
        rotations: [90, 180, 270],
      }),
    ],
  },
  {
    directory: "datamatrix-4",
    barcodeFormat: "DataMatrix",
    total: 21,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 21,
        slowMinPassCount: 21,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 21,
        rotations: [90, 180, 270],
      }),
      definePureTestCase({
        minPassCount: 19,
      }),
    ],
  },
  {
    directory: "dxfilmedge-1",
    barcodeFormat: "DXFilmEdge",
    total: 3,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 1,
        slowMinPassCount: 3,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 3,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "codabar-1",
    barcodeFormat: "Codabar",
    total: 11,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 11,
        slowMinPassCount: 11,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "codabar-2",
    barcodeFormat: "Codabar",
    total: 4,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 2,
        slowMinPassCount: 3,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "code39-1",
    barcodeFormat: "Code39",
    total: 4,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 4,
        slowMinPassCount: 4,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "code39-2",
    barcodeFormat: "Code39",
    total: 2,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 2,
        slowMinPassCount: 2,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "code39-3",
    barcodeFormat: "Code39",
    total: 12,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 12,
        slowMinPassCount: 12,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "code93-1",
    barcodeFormat: "Code93",
    total: 3,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 3,
        slowMinPassCount: 3,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "code128-1",
    barcodeFormat: "Code128",
    total: 6,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 6,
        slowMinPassCount: 6,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "code128-2",
    barcodeFormat: "Code128",
    total: 22,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 19,
        slowMinPassCount: 22,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 20,
        slowMinPassCount: 22,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "code128-3",
    barcodeFormat: "Code128",
    total: 2,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 2,
        slowMinPassCount: 2,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "ean8-1",
    barcodeFormat: "EAN-8",
    total: 9,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 9,
        slowMinPassCount: 9,
        rotations: [0, 180],
      }),
      definePureTestCase({
        minPassCount: 8,
      }),
    ],
  },
  {
    directory: "ean13-1",
    barcodeFormat: "EAN-13",
    total: 32,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 26,
        slowMinPassCount: 30,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 25,
        slowMinPassCount: 30,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "ean13-2",
    barcodeFormat: "EAN-13",
    total: 24,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 7,
        slowMinPassCount: 13,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "ean13-3",
    barcodeFormat: "EAN-13",
    total: 21,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 20,
        slowMinPassCount: 21,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 21,
        slowMinPassCount: 21,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "ean13-4",
    barcodeFormat: "EAN-13",
    total: 22,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 6,
        slowMinPassCount: 13,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 7,
        slowMinPassCount: 13,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "ean13-extension-1",
    barcodeFormat: "EAN-13",
    total: 5,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 3,
        slowMinPassCount: 5,
        rotations: [0, 180],
      }),
    ],
    readerOptions: { ...defaultReaderOptions, eanAddOnSymbol: "Require" },
  },
  {
    directory: "itf-1",
    barcodeFormat: "ITF",
    total: 11,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 10,
        slowMinPassCount: 11,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "itf-2",
    barcodeFormat: "ITF",
    total: 6,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 6,
        slowMinPassCount: 6,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "maxicode-1",
    barcodeFormat: "MaxiCode",
    total: 9,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 9,
        slowMinPassCount: 9,
        rotations: [0],
      }),
    ],
  },
  {
    directory: "maxicode-2",
    barcodeFormat: "MaxiCode",
    total: 4,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 0,
        rotations: [0],
      }),
    ],
  },
  {
    directory: "upca-1",
    barcodeFormat: "UPC-A",
    total: 12,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 10,
        slowMinPassCount: 12,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 11,
        slowMinPassCount: 12,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "upca-2",
    barcodeFormat: "UPC-A",
    total: 36,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 17,
        slowMinPassCount: 22,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "upca-3",
    barcodeFormat: "UPC-A",
    total: 21,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 7,
        slowMinPassCount: 11,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 8,
        slowMinPassCount: 11,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "upca-4",
    barcodeFormat: "UPC-A",
    total: 19,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 8,
        slowMinPassCount: 12,
        slowMaxMisreads: 1,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 9,
        slowMinPassCount: 12,
        slowMaxMisreads: 1,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "upca-5",
    barcodeFormat: "UPC-A",
    total: 32,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 18,
        slowMinPassCount: 20,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "upca-extension-1",
    barcodeFormat: "UPC-A",
    total: 6,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 4,
        slowMinPassCount: 4,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 3,
        slowMinPassCount: 4,
        rotations: [180],
      }),
    ],
    readerOptions: { ...defaultReaderOptions, eanAddOnSymbol: "Require" },
  },
  {
    directory: "upce-1",
    barcodeFormat: "UPC-E",
    total: 3,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 3,
        slowMinPassCount: 3,
        rotations: [0, 180],
      }),
      definePureTestCase({
        minPassCount: 3,
      }),
    ],
  },
  {
    directory: "upce-2",
    barcodeFormat: "UPC-E",
    total: 28,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 18,
        slowMinPassCount: 22,
        slowMaxMisreads: 1,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 19,
        fastMaxMisreads: 1,
        slowMinPassCount: 22,
        slowMaxMisreads: 1,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "upce-3",
    barcodeFormat: "UPC-E",
    total: 11,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 5,
        slowMinPassCount: 7,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 6,
        slowMinPassCount: 7,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "rss14-1",
    barcodeFormat: "DataBar",
    total: 6,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 6,
        slowMinPassCount: 6,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "rss14-2",
    barcodeFormat: "DataBar",
    total: 16,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 8,
        slowMinPassCount: 10,
        rotations: [0],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 9,
        slowMinPassCount: 10,
        rotations: [180],
      }),
    ],
  },
  {
    directory: "rssexpanded-1",
    barcodeFormat: "DataBarExpanded",
    total: 34,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 34,
        slowMinPassCount: 34,
        rotations: [0, 180],
      }),
      definePureTestCase({
        minPassCount: 34,
      }),
    ],
  },
  {
    directory: "rssexpanded-2",
    barcodeFormat: "DataBarExpanded",
    total: 15,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 13,
        slowMinPassCount: 15,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "rssexpanded-3",
    barcodeFormat: "DataBarExpanded",
    total: 118,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 118,
        slowMinPassCount: 118,
        rotations: [0, 180],
      }),
      definePureTestCase({
        minPassCount: 118,
      }),
    ],
  },
  {
    directory: "rssexpandedstacked-1",
    barcodeFormat: "DataBarExpanded",
    total: 65,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 55,
        slowMinPassCount: 65,
        rotations: [0, 180],
      }),
      definePureTestCase({
        minPassCount: 60,
      }),
    ],
  },
  {
    directory: "rssexpandedstacked-2",
    barcodeFormat: "DataBarExpanded",
    total: 2,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 2,
        slowMinPassCount: 2,
        rotations: [0, 180],
      }),
    ],
  },
  {
    directory: "qrcode-1",
    barcodeFormat: "QRCode",
    total: 16,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 16,
        slowMinPassCount: 16,
      }),
    ],
  },
  {
    directory: "qrcode-2",
    barcodeFormat: "QRCode",
    total: 51,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 45,
        slowMinPassCount: 48,
      }),
      definePureTestCase({
        minPassCount: 22,
        maxMisreads: 1,
      }),
    ],
  },
  {
    directory: "qrcode-3",
    barcodeFormat: "QRCode",
    total: 28,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 28,
        slowMinPassCount: 28,
      }),
    ],
  },
  {
    directory: "qrcode-4",
    barcodeFormat: "QRCode",
    total: 41,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 31,
        slowMinPassCount: 31,
      }),
    ],
  },
  {
    directory: "qrcode-5",
    barcodeFormat: "QRCode",
    total: 16,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 16,
        slowMinPassCount: 16,
      }),
      definePureTestCase({
        minPassCount: 4,
      }),
    ],
  },
  {
    directory: "qrcode-6",
    barcodeFormat: "QRCode",
    total: 15,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 15,
        slowMinPassCount: 15,
      }),
    ],
  },
  // TODO: qrcode-7
  {
    directory: "microqrcode-1",
    barcodeFormat: "MicroQRCode",
    total: 16,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 15,
        slowMinPassCount: 15,
        rotations: [0, 270],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 14,
        slowMinPassCount: 14,
        rotations: [90, 180],
      }),
      definePureTestCase({
        minPassCount: 9,
      }),
    ],
  },
  {
    directory: "rmqrcode-1",
    barcodeFormat: "rMQRCode",
    total: 3,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 2,
        slowMinPassCount: 3,
      }),
      definePureTestCase({
        minPassCount: 2,
        maxMisreads: 2,
      }),
    ],
  },
  {
    directory: "pdf417-1",
    barcodeFormat: "PDF417",
    total: 17,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 16,
        slowMinPassCount: 17,
        rotations: [0, 180],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 1,
        slowMinPassCount: 17,
        rotations: [90, 270],
      }),
      definePureTestCase({
        minPassCount: 16,
      }),
    ],
  },
  {
    directory: "pdf417-2",
    barcodeFormat: "PDF417",
    total: 25,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 25,
        slowMinPassCount: 25,
        rotations: [0, 180],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 25,
        rotations: [90, 270],
      }),
    ],
  },
  {
    directory: "pdf417-3",
    barcodeFormat: "PDF417",
    total: 16,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 16,
        slowMinPassCount: 16,
        rotations: [0, 180],
      }),
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 16,
        rotations: [90, 270],
      }),
      definePureTestCase({
        minPassCount: 7,
      }),
    ],
  },
  // TODO: pdf417-4
  {
    directory: "falsepositives-1",
    barcodeFormat: "None",
    total: 27,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 0,
      }),
      definePureTestCase({
        minPassCount: 0,
      }),
    ],
  },
  {
    directory: "falsepositives-2",
    barcodeFormat: "None",
    total: 25,
    testCases: [
      ...defineFastAndSlowTestCases({
        fastMinPassCount: 0,
        slowMinPassCount: 0,
      }),
      definePureTestCase({
        minPassCount: 0,
      }),
    ],
  },
];
