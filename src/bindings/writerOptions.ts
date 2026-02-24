import { encodeFormat, type WriteInputBarcodeFormat } from "./barcodeFormat.js";
import type { EcLevel } from "./ecLevel.js";

/**
 * @internal
 */
export interface ZXingWriterOptions {
  /**
   * @internal
   */
  format: string;
  /**
   * Comma separated list of symbology specific options and flags.
   *
   * @internal
   */
  options: string;
  /**
   * Scale factor for rendering, i.e. the module size.
   * Passing a negative value will choose the scale automatically
   * to fit the size of the barcode to abs(scale) as close as possible.
   *
   * @defaultValue `1`
   */
  scale: number;
  /**
   * Rotate the barcode by given degrees (0, 90, 180, 270).
   *
   * @defaultValue `0`
   */
  rotate: number;
  /**
   * Invert the colors of the barcode.
   *
   * @defaultValue `false`
   */
  invert: boolean;
  /**
   * Add human readable text (HRI) to the barcode.
   *
   * @defaultValue `false`
   */
  addHRT: boolean;
  /**
   * Add quiet zones around the barcode.
   *
   * @defaultValue `true`
   */
  addQuietZones: boolean;
}

/**
 * Writer options for writing barcodes.
 */
export interface WriterOptions
  extends Partial<Omit<ZXingWriterOptions, "format">> {
  /**
   * The format of the barcode to write.
   *
   * Accepted values are derived from `barcodeFormat.ts` (`BCF`) and include:
   * - canonical format names,
   * - human-readable labels from the table,
   * - backward-compatible aliases (e.g. `"rMQRCode"`).
   *
   * @remarks
   * - Values are normalized by {@link encodeFormat | `encodeFormat`} before being sent to C++.
   * - The concrete writable set is zint-aware in this package build (`w` flag or non-zero `zint` id).
   *
   * @defaultValue `"QRCode"`
   */
  format?: WriteInputBarcodeFormat;
  /**
   * Comma separated list of symbology specific options and flags.
   *
   * This string is parsed by the underlying C++ library to extract named parameters.
   * For boolean flags, include the name (e.g., `"gs1"`).
   * For options with values, use a `key=value` format (e.g., `"version=5"`).
   * Multiple options can be combined, separated by commas (e.g., `"gs1,version=2"`).
   *
   * Known keys used by `CreatorOptions` in the C++ backend:
   * - `eci`: (string/integer) Specifies ECI designator.
   * - `gs1`: (boolean) Enables GS1 encoding.
   * - `readerInit`: (boolean) Sets reader-initialization / programming mode.
   * - `stacked`: (boolean) Generates a stacked version for DataBar / DataBarExpanded.
   * - `forceSquare`: (boolean) Only consider square symbol versions.
   *   Supported only for the `DataMatrix` format.
   * - `columns`: (integer) Specifies number of columns (e.g., PDF417 / DataBarExpanded stacked).
   * - `rows`: (integer) Specifies number of rows (e.g., PDF417 / DataBarExpanded stacked).
   * - `version`: (integer) Specifies the version / size of most 2D symbols.
   * - `dataMask`: (integer) Specifies the data mask pattern for QRCode / MicroQRCode.
   * - `ecLevel`: (string) Error correction level / percentage where supported (e.g. `L`, `M`, `Q`, `H`, `30%`).
   *
   * @remarks This field is forwarded directly to ZXing C++ `CreatorOptions` for parsing.
   * @defaultValue `""`
   */
  options?: string;

  // deprecated fields

  /**
   * A size hint to determine the scale of the barcode. `0` means unset.
   *
   * This only takes effect if `scale` is unset.
   *
   * @defaultValue `0`
   * @deprecated This option is translated to `scale = -abs(sizeHint)` when `scale` is not provided. Use `scale` directly.
   */
  sizeHint?: number;

  /**
   * Set if this is the reader initialisation / programming symbol.
   *
   * @see {@link ReadResult.readerInit | `ReadResult.readerInit`}
   * @defaultValue `false`
   * @deprecated This option will be translated into `options="readerInit"` and may be removed in the next major version. Use `options` instead.
   */
  readerInit?: boolean;

  /**
   * Force the Data Matrix to be square.
   *
   * @defaultValue `false`
   * @deprecated This option is translated into `options="forceSquare"`. Use `options` instead.
   */
  forceSquareDataMatrix?: boolean;

  /**
   * The error correction level of the symbol (empty string if not applicable)
   *
   * @see {@link ReadResult.ecLevel | `ReadResult.ecLevel`}
   * @defaultValue `""`
   * @deprecated This option will be translated into `options="ecLevel=<value>"` and may be removed in the next major version. Use `options` instead.
   */
  ecLevel?: EcLevel;

  /**
   * Legacy alias of {@link WriterOptions.addHRT | `addHRT`}.
   *
   * Only used when `addHRT` is not provided.
   *
   * @defaultValue `false`
   * @deprecated Use `addHRT` instead.
   */
  withHRT?: boolean;

  /**
   * Legacy alias of {@link WriterOptions.addQuietZones | `addQuietZones`}.
   *
   * Only used when `addQuietZones` is not provided.
   *
   * @defaultValue `true`
   * @deprecated Use `addQuietZones` instead.
   */
  withQuietZones?: boolean;
}

export const defaultWriterOptions: Required<WriterOptions> = {
  format: "QRCode",
  readerInit: false,
  forceSquareDataMatrix: false,
  ecLevel: "",
  scale: 1,
  sizeHint: 0,
  rotate: 0,
  invert: false,
  withHRT: false,
  withQuietZones: true,
  addHRT: false,
  addQuietZones: true,
  options: "",
};

/**
 * Converts WriterOptions to ZXingWriterOptions format.
 *
 * @param writerOptions - Optional writer options to be converted
 * @returns A ZXingWriterOptions object with the encoded format
 */
export function writerOptionsToZXingWriterOptions(
  writerOptions: WriterOptions = defaultWriterOptions,
): ZXingWriterOptions {
  const {
    format = defaultWriterOptions.format,
    sizeHint = defaultWriterOptions.sizeHint,
    readerInit = defaultWriterOptions.readerInit,
    forceSquareDataMatrix = defaultWriterOptions.forceSquareDataMatrix,
    ecLevel = defaultWriterOptions.ecLevel,
    withHRT,
    withQuietZones,
    addHRT,
    addQuietZones,
    options = defaultWriterOptions.options,
    scale,
    rotate = defaultWriterOptions.rotate,
    invert = defaultWriterOptions.invert,
  } = writerOptions;

  const optionTokens = options
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const addOptionToken = (token: string) => {
    const key = token.split("=")[0];
    if (!optionTokens.some((t) => t.split("=")[0] === key)) {
      optionTokens.push(token);
    }
  };

  if (readerInit) {
    addOptionToken("readerInit");
  }

  if (forceSquareDataMatrix) {
    addOptionToken("forceSquare");
  }

  if (ecLevel) {
    addOptionToken(`ecLevel=${ecLevel}`);
  }

  const resolvedScale =
    scale ??
    (sizeHint > 0
      ? -Math.trunc(Math.abs(sizeHint))
      : defaultWriterOptions.scale);

  return {
    format: encodeFormat(format),
    options: optionTokens.join(","),
    scale: resolvedScale,
    rotate,
    invert,
    addHRT: addHRT ?? withHRT ?? defaultWriterOptions.addHRT,
    addQuietZones:
      addQuietZones ?? withQuietZones ?? defaultWriterOptions.addQuietZones,
  };
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("writerOptionsToZXingWriterOptions", () => {
    it("maps legacy with* aliases when add* is missing", () => {
      const mapped = writerOptionsToZXingWriterOptions({
        withHRT: true,
        withQuietZones: false,
      });

      expect(mapped.addHRT).toBe(true);
      expect(mapped.addQuietZones).toBe(false);
    });

    it("prefers add* over with* when both are provided", () => {
      const mapped = writerOptionsToZXingWriterOptions({
        addHRT: false,
        withHRT: true,
        addQuietZones: true,
        withQuietZones: false,
      });

      expect(mapped.addHRT).toBe(false);
      expect(mapped.addQuietZones).toBe(true);
    });

    it("translates deprecated fields into options tokens", () => {
      const mapped = writerOptionsToZXingWriterOptions({
        options: "gs1",
        readerInit: true,
        forceSquareDataMatrix: true,
        ecLevel: "Q",
      });

      expect(mapped.options).toContain("gs1");
      expect(mapped.options).toContain("readerInit");
      expect(mapped.options).toContain("forceSquare");
      expect(mapped.options).toContain("ecLevel=Q");
    });

    it("maps sizeHint to negative scale when scale is omitted", () => {
      const mapped = writerOptionsToZXingWriterOptions({ sizeHint: 123 });
      expect(mapped.scale).toBe(-123);
    });

    it("keeps explicit scale over sizeHint", () => {
      const mapped = writerOptionsToZXingWriterOptions({
        scale: 5,
        sizeHint: 999,
      });
      expect(mapped.scale).toBe(5);
    });
  });
}
