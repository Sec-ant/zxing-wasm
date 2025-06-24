import type {
  ReaderOptions,
  ReadOutputBarcodeFormat,
} from "../src/reader/index.js";
import { DEFAULT_READER_OPTIONS_FOR_TESTS } from "./utils.js";

interface TestEntry {
  directory: string;
  barcodeFormat: ReadOutputBarcodeFormat;
  /**
   * default: true
   */
  testFast?: boolean;
  /**
   * default: true
   */
  testSlow?: boolean;
  /**
   * default: false
   */
  testPure?: boolean;
  /**
   * default: [0, 90, 180, 270] for 2D barcodes, [0, 180] for 1D barcodes
   */
  rotations?: number[];
  /**
   * default: DEFAULT_READER_OPTIONS_FOR_TESTS
   */
  readerOptions?: ReaderOptions;
}

// Source: https://github.com/zxing-cpp/zxing-cpp/blob/daa502d6b4a1e15cd29f48269c01e383f1b384db/test/blackbox/BlackboxTestRunner.cpp#L338-L681
export const testEntries: TestEntry[] = [
  {
    directory: "aztec-1",
    barcodeFormat: "Aztec",
    testPure: true,
  },
  {
    directory: "aztec-2",
    barcodeFormat: "Aztec",
  },
  {
    directory: "datamatrix-1",
    barcodeFormat: "DataMatrix",
    testPure: true,
  },
  {
    directory: "datamatrix-2",
    barcodeFormat: "DataMatrix",
  },
  {
    directory: "datamatrix-3",
    barcodeFormat: "DataMatrix",
  },
  {
    directory: "datamatrix-4",
    barcodeFormat: "DataMatrix",
    testPure: true,
  },
  {
    directory: "dxfilmedge-1",
    barcodeFormat: "DXFilmEdge",
  },
  {
    directory: "codabar-1",
    barcodeFormat: "Codabar",
  },
  {
    directory: "codabar-2",
    barcodeFormat: "Codabar",
  },
  {
    directory: "code39-1",
    barcodeFormat: "Code39",
  },
  {
    directory: "code39-2",
    barcodeFormat: "Code39",
  },
  {
    directory: "code39-3",
    barcodeFormat: "Code39",
  },
  {
    directory: "code93-1",
    barcodeFormat: "Code93",
  },
  {
    directory: "code128-1",
    barcodeFormat: "Code128",
  },
  {
    directory: "code128-2",
    barcodeFormat: "Code128",
  },
  {
    directory: "code128-3",
    barcodeFormat: "Code128",
  },
  {
    directory: "ean8-1",
    barcodeFormat: "EAN-8",
    testPure: true,
  },
  {
    directory: "ean13-1",
    barcodeFormat: "EAN-13",
  },
  {
    directory: "ean13-2",
    barcodeFormat: "EAN-13",
  },
  {
    directory: "ean13-3",
    barcodeFormat: "EAN-13",
  },
  {
    directory: "ean13-4",
    barcodeFormat: "EAN-13",
  },
  {
    directory: "ean13-extension-1",
    barcodeFormat: "EAN-13",
    readerOptions: {
      ...DEFAULT_READER_OPTIONS_FOR_TESTS,
      eanAddOnSymbol: "Require",
    },
  },
  {
    directory: "itf-1",
    barcodeFormat: "ITF",
  },
  {
    directory: "itf-2",
    barcodeFormat: "ITF",
  },
  {
    directory: "maxicode-1",
    barcodeFormat: "MaxiCode",
    rotations: [0],
  },
  {
    directory: "maxicode-2",
    barcodeFormat: "MaxiCode",
    rotations: [0],
  },
  {
    directory: "upca-1",
    barcodeFormat: "UPC-A",
    readerOptions: {
      ...DEFAULT_READER_OPTIONS_FOR_TESTS,
      formats: ["UPC-A"],
    },
  },
  {
    directory: "upca-2",
    barcodeFormat: "UPC-A",
    readerOptions: {
      ...DEFAULT_READER_OPTIONS_FOR_TESTS,
      formats: ["UPC-A"],
    },
  },
  {
    directory: "upca-3",
    barcodeFormat: "UPC-A",
    readerOptions: {
      ...DEFAULT_READER_OPTIONS_FOR_TESTS,
      formats: ["UPC-A"],
    },
  },
  {
    directory: "upca-4",
    barcodeFormat: "UPC-A",
    readerOptions: {
      ...DEFAULT_READER_OPTIONS_FOR_TESTS,
      formats: ["UPC-A"],
    },
  },
  {
    directory: "upca-5",
    barcodeFormat: "UPC-A",
    readerOptions: {
      ...DEFAULT_READER_OPTIONS_FOR_TESTS,
      formats: ["UPC-A"],
    },
  },
  {
    directory: "upca-extension-1",
    barcodeFormat: "UPC-A",
    readerOptions: {
      ...DEFAULT_READER_OPTIONS_FOR_TESTS,
      eanAddOnSymbol: "Require",
      formats: ["UPC-A"],
    },
  },
  {
    directory: "upce-1",
    barcodeFormat: "UPC-E",
    testPure: true,
  },
  {
    directory: "upce-2",
    barcodeFormat: "UPC-E",
  },
  {
    directory: "upce-3",
    barcodeFormat: "UPC-E",
  },
  {
    directory: "rss14-1",
    barcodeFormat: "DataBar",
  },
  {
    directory: "rss14-2",
    barcodeFormat: "DataBar",
  },
  {
    directory: "rssexpanded-1",
    barcodeFormat: "DataBarExpanded",
    testPure: true,
  },
  {
    directory: "rssexpanded-2",
    barcodeFormat: "DataBarExpanded",
  },
  {
    directory: "rssexpanded-3",
    barcodeFormat: "DataBarExpanded",
    testPure: true,
  },
  {
    directory: "rssexpandedstacked-1",
    barcodeFormat: "DataBarExpanded",
    testPure: true,
  },
  {
    directory: "rssexpandedstacked-2",
    barcodeFormat: "DataBarExpanded",
  },
  {
    directory: "databarltd-1",
    barcodeFormat: "DataBarLimited",
    testPure: true,
  },
  {
    directory: "qrcode-1",
    barcodeFormat: "QRCode",
  },
  {
    directory: "qrcode-2",
    barcodeFormat: "QRCode",
    testPure: true,
  },
  {
    directory: "qrcode-3",
    barcodeFormat: "QRCode",
  },
  {
    directory: "qrcode-4",
    barcodeFormat: "QRCode",
  },
  {
    directory: "qrcode-5",
    barcodeFormat: "QRCode",
    testPure: true,
  },
  {
    directory: "qrcode-6",
    barcodeFormat: "QRCode",
  },
  // TODO: qrcode-7
  {
    directory: "microqrcode-1",
    barcodeFormat: "MicroQRCode",
    testPure: true,
  },
  {
    directory: "rmqrcode-1",
    barcodeFormat: "rMQRCode",
    testPure: true,
  },
  {
    directory: "pdf417-1",
    barcodeFormat: "PDF417",
    testPure: true,
  },
  {
    directory: "pdf417-2",
    barcodeFormat: "PDF417",
  },
  {
    directory: "pdf417-3",
    barcodeFormat: "PDF417",
    testPure: true,
  },
  // TODO: pdf417-4
  {
    directory: "falsepositives-1",
    barcodeFormat: "None",
    testPure: true,
  },
  {
    directory: "falsepositives-2",
    barcodeFormat: "None",
    testPure: true,
  },
];
