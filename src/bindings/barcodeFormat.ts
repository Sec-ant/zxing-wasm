/**
 * Unified source of truth modeled after zxing-cpp ZX_BCF_LIST.
 */
// biome-ignore format: keep this metadata table manually structured
const BCF = [
// name               sym  var  flags    zint  hri-label                  
  ["All",             "*", "*", "     ",   0, "All"                     ],
  ["AllReadable",     "*", "r", "     ",   0, "All Readable"            ],
  ["AllCreatable",    "*", "w", "     ",   0, "All Creatable"           ],
  ["AllLinear",       "*", "l", "     ",   0, "All Linear"              ],
  ["AllMatrix",       "*", "m", "     ",   0, "All Matrix"              ],
  ["AllGS1",          "*", "G", "     ",   0, "All GS1"                 ],
  ["AllRetail",       "*", "R", "     ",   0, "All Retail"              ],
  ["AllIndustrial",   "*", "I", "     ",   0, "All Industrial"          ],
  ["Codabar",         "F", " ", "lrw  ",  18, "Codabar"                 ],
  ["Code39",          "A", " ", "lrw I",   8, "Code 39"                 ],
  ["Code39Std",       "A", "s", "lrw I",   8, "Code 39 Standard"        ],
  ["Code39Ext",       "A", "e", "lr  I",   9, "Code 39 Extended"        ],
  ["Code32",          "A", "2", "lr  I", 129, "Code 32"                 ],
  ["PZN",             "A", "p", "lr  I",  52, "Pharmazentralnummer"     ],
  ["Code93",          "G", " ", "lrw I",  25, "Code 93"                 ],
  ["Code128",         "C", " ", "lrwGI",  20, "Code 128"                ],
  ["ITF",             "I", " ", "lrw I",   3, "ITF"                     ],
  ["ITF14",           "I", "4", "lr  I",  89, "ITF-14"                  ],
  ["DataBar",         "e", " ", "lr GR",  29, "DataBar"                 ],
  ["DataBarOmni",     "e", "o", "lr GR",  29, "DataBar Omni"            ],
  ["DataBarStk",      "e", "s", "lr GR",  79, "DataBar Stacked"         ],
  ["DataBarStkOmni",  "e", "O", "lr GR",  80, "DataBar Stacked Omni"    ],
  ["DataBarLtd",      "e", "l", "lr GR",  30, "DataBar Limited"         ],
  ["DataBarExp",      "e", "e", "lr GR",  31, "DataBar Expanded"        ],
  ["DataBarExpStk",   "e", "E", "lr GR",  81, "DataBar Expanded Stacked"],
  ["EANUPC",          "E", " ", "lr  R",  15, "EAN/UPC"                 ],
  ["EAN13",           "E", "1", "lrw R",  15, "EAN-13"                  ],
  ["EAN8",            "E", "8", "lrw R",  10, "EAN-8"                   ],
  ["EAN5",            "E", "5", "l   R",  12, "EAN-5"                   ],
  ["EAN2",            "E", "2", "l   R",  11, "EAN-2"                   ],
  ["ISBN",            "E", "i", "lr  R",  69, "ISBN"                    ],
  ["UPCA",            "E", "a", "lrw R",  34, "UPC-A"                   ],
  ["UPCE",            "E", "e", "lrw R",  37, "UPC-E"                   ],
  ["OtherBarcode",    "X", " ", " r   ",   0, "Other barcode"           ],
  ["DXFilmEdge",      "X", "x", "lr   ", 147, "DX Film Edge"            ],
  ["PDF417",          "L", " ", "mrw  ",  55, "PDF417"                  ],
  ["CompactPDF417",   "L", "c", "mr   ",  56, "Compact PDF417"          ],
  ["MicroPDF417",     "L", "m", "m    ",  84, "MicroPDF417"             ],
  ["Aztec",           "z", " ", "mr G ",  92, "Aztec"                   ],
  ["AztecCode",       "z", "c", "mrwG ",  92, "Aztec Code"              ],
  ["AztecRune",       "z", "r", "mr   ", 128, "Aztec Rune"              ],
  ["QRCode",          "Q", " ", "mrwG ",  58, "QR Code"                 ],
  ["QRCodeModel1",    "Q", "1", "mr   ",   0, "QR Code Model 1"         ],
  ["QRCodeModel2",    "Q", "2", "mr   ",  58, "QR Code Model 2"         ],
  ["MicroQRCode",     "Q", "m", "mr   ",  97, "Micro QR Code"           ],
  ["RMQRCode",        "Q", "r", "mr G ", 145, "rMQR Code"               ],
  ["DataMatrix",      "d", " ", "mrwG ",  71, "Data Matrix"             ],
  ["MaxiCode",        "U", " ", "mr   ",  57, "MaxiCode"                ],
] as const;

const ALIASES = {
  /**
   * @deprecated Use `DataBarExp` instead.
   */
  DataBarExpanded: "DataBarExp",
  /**
   * @deprecated Use `DataBarLtd` instead.
   */
  DataBarLimited: "DataBarLtd",
  /**
   * @deprecated Use `AllLinear` instead.
   */
  "Linear-Codes": "AllLinear",
  /**
   * @deprecated Use `AllMatrix` instead.
   */
  "Matrix-Codes": "AllMatrix",
  /**
   * @deprecated Use `All` instead.
   */
  Any: "All",
  rMQRCode: "RMQRCode",
} as const satisfies Record<string, (typeof BCF)[number][0]>;

type WithAliases<T extends string> =
  | T
  | {
      [K in keyof typeof ALIASES]: (typeof ALIASES)[K] extends T ? K : never;
    }[keyof typeof ALIASES];

// ----

/**
 * Array of all human-readable interface (HRI) labels for barcode formats.
 * These are display-friendly names like "Code 39", "EAN-13", "QR Code", etc.
 */
export const BARCODE_HRI_LABELS = BCF.map((e) => e[5]);

/**
 * Human-readable interface (HRI) label for a barcode format.
 * For example: "Code 39", "EAN-13", "QR Code", "Pharmazentralnummer".
 */
export type BarcodeHriLabel = (typeof BARCODE_HRI_LABELS)[number];

// ----

const BARCODE_META_FORMAT_ENTRIES = BCF.filter((e) => e[1] === "*");

/**
 * Array of meta-formats that represent groups of barcode formats.
 * Includes: "All", "AllReadable", "AllCreatable", "AllLinear", "AllMatrix", "AllGS1", "AllRetail", "AllIndustrial".
 * These are not actual barcode formats but logical groupings for reader/writer configuration.
 */
export const BARCODE_META_FORMATS = BARCODE_META_FORMAT_ENTRIES.map(
  (e) => e[0],
);

/**
 * Meta-format representing a logical group of barcode formats.
 * Examples: "All", "AllLinear", "AllMatrix", "AllGS1".
 */
export type BarcodeMetaFormat = (typeof BARCODE_META_FORMATS)[number];

// ----

const BARCODE_FORMAT_ENTRIES = BCF.filter((e) => e[1] !== "*");

/**
 * Array of all actual barcode format names (excludes meta-formats).
 * Includes formats like "QRCode", "Code128", "EAN13", "Aztec", etc.
 */
export const BARCODE_FORMATS = BARCODE_FORMAT_ENTRIES.map((e) => e[0]);

/**
 * An actual barcode format name.
 * Examples: "QRCode", "Code128", "EAN13", "DataMatrix", "PDF417".
 * Does not include meta-formats like "All" or "AllLinear".
 */
export type BarcodeFormat = (typeof BARCODE_FORMATS)[number];
/** @deprecated Use {@link BARCODE_FORMATS} instead. */
export const barcodeFormats = BARCODE_FORMATS;

// ----

const BARCODE_SYMBOLOGY_ENTRIES = BCF.filter((e) => e[2] === " ");

/**
 * Array of barcode symbologies - the base formats from which variants derive.
 * Examples: "EANUPC" (parent of EAN13, EAN8, UPCA, etc.), "QRCode" (parent of MicroQRCode, RMQRCode, etc.).
 */
export const BARCODE_SYMBOLOGIES = BARCODE_SYMBOLOGY_ENTRIES.map((e) => e[0]);

/**
 * A barcode symbology - the root format from which related variants derive.
 * For example, "EANUPC" is the symbology for EAN13, EAN8, UPCA, UPCE, ISBN, etc.
 * "QRCode" is the symbology for QRCodeModel1, QRCodeModel2, MicroQRCode, RMQRCode.
 */
export type BarcodeSymbology = (typeof BARCODE_SYMBOLOGIES)[number];

// ----

const LINEAR_BARCODE_FORMAT_ENTRIES = BCF.filter(
  (e): e is (typeof BCF)[number] & { 3: `l${string}` } => e[3][0] === "l",
);

/**
 * Array of linear (1D) barcode formats.
 * Linear barcodes encode data in one dimension (horizontal bars of varying widths).
 * Examples: Code128, EAN13, Code39, ITF, DataBar, etc.
 */
export const LINEAR_BARCODE_FORMATS = LINEAR_BARCODE_FORMAT_ENTRIES.map(
  (e) => e[0],
);

/**
 * A linear (1D) barcode format.
 * Linear barcodes encode data in one dimension using horizontal bars.
 * Examples: "Code128", "EAN13", "Code39", "ITF", "DataBar".
 */
export type LinearBarcodeFormat = (typeof LINEAR_BARCODE_FORMATS)[number];
/** @deprecated Use {@link LINEAR_BARCODE_FORMATS} instead. */
export const linearBarcodeFormats = LINEAR_BARCODE_FORMATS;

// ----

const MATRIX_BARCODE_FORMAT_ENTRIES = BCF.filter(
  (e): e is (typeof BCF)[number] & { 3: `m${string}` } => e[3][0] === "m",
);

/**
 * Array of matrix (2D) barcode formats.
 * Matrix barcodes encode data in two dimensions using patterns of squares, dots, or other shapes.
 * Examples: QRCode, DataMatrix, PDF417, Aztec, MaxiCode, etc.
 */
export const MATRIX_BARCODE_FORMATS = MATRIX_BARCODE_FORMAT_ENTRIES.map(
  (e) => e[0],
);

/**
 * A matrix (2D) barcode format.
 * Matrix barcodes encode data in two dimensions.
 * Examples: "QRCode", "DataMatrix", "PDF417", "Aztec", "MaxiCode".
 */
export type MatrixBarcodeFormat = (typeof MATRIX_BARCODE_FORMATS)[number];
/** @deprecated Use {@link MATRIX_BARCODE_FORMATS} instead. */
export const matrixBarcodeFormats = MATRIX_BARCODE_FORMATS;

// ----

const READABLE_BARCODE_FORMAT_ENTRIES = BCF.filter(
  (e): e is (typeof BCF)[number] & { 3: `${string}r${string}` } =>
    e[3][1] === "r",
);

/**
 * Array of barcode formats that can be read by the reader.
 * Most barcode formats can be read; this excludes write-only formats.
 */
export const READABLE_BARCODE_FORMATS = READABLE_BARCODE_FORMAT_ENTRIES.map(
  (e) => e[0],
);

/**
 * A barcode format that can be read by the reader.
 * Examples: "QRCode", "Code128", "EAN13", "DataMatrix", "PDF417".
 */
export type ReadableBarcodeFormat = (typeof READABLE_BARCODE_FORMATS)[number];

// ----

const CREATABLE_BARCODE_FORMAT_ENTRIES = BCF.filter(
  (
    e,
  ): e is (typeof BCF)[number] &
    (
      | { 3: `${string}w${string}` }
      | { 4: Exclude<(typeof BCF)[number][4], 0> }
    ) => e[3][2] === "w" || e[4] !== 0,
);

/**
 * Array of barcode formats that can be created by the writer.
 * Formats are creatable if they have the 'w' flag or a non-zero Zint ID.
 */
export const CREATABLE_BARCODE_FORMATS = CREATABLE_BARCODE_FORMAT_ENTRIES.map(
  (e) => e[0],
);

/**
 * A barcode format that can be created by the writer.
 * Examples: "QRCode", "Code128", "EAN13", "DataMatrix", "PDF417".
 */
export type CreatableBarcodeFormat = (typeof CREATABLE_BARCODE_FORMATS)[number];

// ----

const GS1_BARCODE_FORMAT_ENTRIES = BCF.filter(
  (e): e is (typeof BCF)[number] & { 3: `${string}G${string}` } =>
    e[3][3] === "G",
);

/**
 * Array of barcode formats that support GS1 data encoding.
 * GS1 is a global standard for supply chain barcodes.
 */
export const GS1_BARCODE_FORMATS = GS1_BARCODE_FORMAT_ENTRIES.map((e) => e[0]);

/**
 * A barcode format that supports GS1 data encoding.
 * GS1 is used in retail and supply chain applications.
 * Examples: "Code128", "DataBar", "QRCode", "DataMatrix", "Aztec".
 */
export type GS1BarcodeFormat = (typeof GS1_BARCODE_FORMATS)[number];

// ----

const RETAIL_BARCODE_FORMAT_ENTRIES = BCF.filter(
  (e): e is (typeof BCF)[number] & { 3: `${string}R` } => e[3][4] === "R",
);

/**
 * Array of barcode formats commonly used in retail applications.
 * These include product labeling formats like EAN, UPC, and related variants.
 */
export const RETAIL_BARCODE_FORMATS = RETAIL_BARCODE_FORMAT_ENTRIES.map(
  (e) => e[0],
);

/**
 * A barcode format commonly used in retail applications.
 * Retail formats are typically found on consumer products.
 * Examples: "EAN13", "EAN8", "UPCA", "UPCE", "ISBN", "DataBar".
 */
export type RetailBarcodeFormat = (typeof RETAIL_BARCODE_FORMATS)[number];

// ----

const INDUSTRIAL_BARCODE_FORMAT_ENTRIES = BCF.filter(
  (e): e is (typeof BCF)[number] & { 3: `${string}I` } => e[3][5] === "I",
);

/**
 * Array of barcode formats commonly used in industrial and logistics applications.
 * These include formats used for inventory, shipping, tracking, and pharmaceutical labeling.
 */
export const INDUSTRIAL_BARCODE_FORMATS = INDUSTRIAL_BARCODE_FORMAT_ENTRIES.map(
  (e) => e[0],
);

/**
 * A barcode format commonly used in industrial and logistics applications.
 * Industrial formats are used for inventory, shipping, tracking, and pharmaceutical labeling.
 * Examples: "Code39", "Code128", "ITF", "PZN", "Code93".
 */
export type IndustrialBarcodeFormat =
  (typeof INDUSTRIAL_BARCODE_FORMATS)[number];

/**
 * Expands a symbology into its corresponding formats.
 * For example, "EANUPC" expands to ["EAN13", "EAN8", "EAN5", "EAN2", "ISBN", "UPCA", "UPCE"].
 */
export function symbologyToFormats(
  symbology: BarcodeSymbology,
): BarcodeFormat[] {
  const formats: BarcodeFormat[] = [];
  let sym: (typeof BCF)[number][1] | undefined;
  for (const entry of BCF) {
    if (entry[1] === "*") {
      continue;
    }
    if (!sym) {
      if (entry[0] === symbology) {
        formats.push(entry[0]);
        sym = entry[1];
      }
    } else if (entry[1] === sym) {
      formats.push(entry[0]);
    } else {
      break;
    }
  }
  return formats;
}

/**
 * Finds the symbology of a given format.
 * For example, "EAN13" belongs to the "EANUPC" symbology.
 * Returns `undefined` if the format does not belong to any symbology.
 */
export function formatToSymbology(
  format: BarcodeFormat,
): BarcodeSymbology | undefined {
  let currentSymbology: BarcodeSymbology | undefined;
  for (const entry of BCF) {
    if (entry[1] === "*") {
      continue;
    }
    if (entry[2] === " ") {
      currentSymbology = entry[0];
    }
    if (entry[0] === format) {
      return currentSymbology!;
    }
  }
  return undefined;
}

/**
 * Returns the human-readable label of a given barcode format.
 * For example, "Code32" returns "Code 32", "PZN" returns "Pharmazentralnummer".
 * Returns `undefined` if the format is not found.
 */
export function formatToLabel(format: string): BarcodeHriLabel | undefined {
  for (const entry of BCF) {
    if (entry[0] === format) {
      return entry[5];
    }
  }
  return undefined;
}

/**
 * Barcode formats that can be used in {@link ReaderOptions.formats | `ReaderOptions.formats`} to read barcodes.
 */
export type ReadInputBarcodeFormat = WithAliases<
  | (typeof READABLE_BARCODE_FORMAT_ENTRIES)[number][0 | 5]
  | (typeof BARCODE_META_FORMAT_ENTRIES)[number][0 | 5]
>;

/**
 * Barcode formats that can be used in {@link WriterOptions.format | `WriterOptions.format`} to write barcodes.
 */
export type WriteInputBarcodeFormat = WithAliases<
  (typeof CREATABLE_BARCODE_FORMAT_ENTRIES)[number][0 | 5]
>;

/**
 * Barcode formats that may be returned in {@link ReadResult.format | `ReadResult.format`} in read functions.
 */
export type ReadOutputBarcodeFormat = ReadableBarcodeFormat | "None";

/**
 * Union of all possible barcode format values accepted or returned by the library.
 * Includes input formats (with aliases and HRI labels), output formats, and meta-formats.
 */
export type LooseBarcodeFormat =
  | ReadInputBarcodeFormat
  | WriteInputBarcodeFormat
  | ReadOutputBarcodeFormat;

/**
 * Encodes a barcode format into its canonical string representation.
 *
 * This normalizes deprecated aliases (e.g. `"Linear-Codes"` -> `"AllLinear"`).
 * Human-readable labels and canonical names are passed through.
 */
export function encodeFormat(format: LooseBarcodeFormat): string {
  return ALIASES[format as keyof typeof ALIASES] ?? format;
}

/**
 * Encodes an array of barcode formats into the C++ parser friendly format list.
 */
export function encodeFormats(formats: LooseBarcodeFormat[]): string {
  return formats.map(encodeFormat).join(",");
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("barcode format helpers", () => {
    it("normalizes deprecated aliases", () => {
      expect(encodeFormat("Any")).toBe("All");
      expect(encodeFormat("Linear-Codes")).toBe("AllLinear");
      expect(encodeFormat("Matrix-Codes")).toBe("AllMatrix");
      expect(encodeFormat("DataBarExpanded")).toBe("DataBarExp");
      expect(encodeFormat("DataBarLimited")).toBe("DataBarLtd");
      expect(encodeFormat("rMQRCode")).toBe("RMQRCode");
    });

    it("encodes format lists as comma separated values", () => {
      expect(encodeFormats(["QRCode", "Any", "DataBarLimited"])).toBe(
        "QRCode,All,DataBarLtd",
      );
    });

    it("maps between symbology and formats", () => {
      expect(symbologyToFormats("EANUPC")).toEqual([
        "EANUPC",
        "EAN13",
        "EAN8",
        "EAN5",
        "EAN2",
        "ISBN",
        "UPCA",
        "UPCE",
      ]);
      expect(formatToSymbology("UPCA")).toBe("EANUPC");
      expect(formatToSymbology("RMQRCode")).toBe("QRCode");
    });
  });
}
