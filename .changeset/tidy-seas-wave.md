---
"zxing-wasm": major
---

Upgrade zxing-cpp to `9a9ccb83` (v3.0.2).

#### Breaking Changes

##### Barcode format values changed

`ReadResult.format` has changed to match zxing-cpp's new canonical naming:

- `"EAN-8"` → `"EAN8"`
- `"EAN-13"` → `"EAN13"`
- `"UPC-A"` → `"UPCA"`
- `"UPC-E"` → `"UPCE"`
- `"DataBarExpanded"` → `"DataBarExp"`
- `"DataBarLimited"` → `"DataBarLtd"`
- `"rMQRCode"` → `"RMQRCode"`

Code that compared `ReadResult.format` against the old string values (e.g. `result.format === "EAN-13"`) will no longer match.

##### Format sub-variants now distinguished

The reader now returns specific sub-variant format names instead of the base symbology name. For example:

- `"DataBar"` → `"DataBarOmni"` or `"DataBarStk"` (depending on the specific variant detected)
- `"DataBarExpanded"` → `"DataBarExp"` or `"DataBarExpStk"`
- `"Code39"` → `"Code39Ext"` (when extended ASCII characters are present)

Code that matched against base names like `result.format === "DataBar"` will no longer match for omnidirectional or stacked variants. Use the new `ReadResult.symbology` field (e.g. `result.symbology === "DataBar"`) to match by symbology family, or update format checks to include the new variant names.

The reader may also return entirely new format names that did not exist before: `"Code32"`, `"PZN"`, `"ITF14"`, `"DataBarStkOmni"`, `"QRCodeModel1"`, `"ISBN"`, `"AztecRune"`, `"EAN5"`, `"EAN2"`, etc.

##### `symbol.data` pixel polarity inverted

The pixel values in `ReadResult.symbol.data` and `WriteResult.symbol.data` (`Uint8ClampedArray`) have been inverted:

- **Before**: black (foreground) = `0xFF`, white (background) = `0x00`
- **After**: black (foreground) = `0x00`, white (background) = `0xFF`

The new behavior follows standard luminance convention (0 = black, 255 = white). Code that consumes `symbol.data` to render or process barcode images will need to be updated.

##### Format input names changed

The old meta-format names `"Linear-Codes"`, `"Matrix-Codes"`, and `"Any"` are now accepted as deprecated aliases for `"AllLinear"`, `"AllMatrix"`, and `"All"` respectively. They will continue to work but should be migrated to the new names.

Old format names like `"EAN-13"` and `"UPC-A"` are now accepted as human-readable labels (HRI labels), so they continue to work as inputs for `ReaderOptions.formats`. However, the old `"DataBarExpanded"`, `"DataBarLimited"`, and `"rMQRCode"` are only accepted as deprecated aliases — use `"DataBarExp"`, `"DataBarLtd"`, and `"RMQRCode"` instead.

##### `barcodeFormats` content changed

The `barcodeFormats` array (now deprecated in favor of `BARCODE_FORMATS`) changed from 23 entries to 40+ entries. All new sub-variant formats are included, hyphenated names are replaced with canonical names, and `"None"` has been removed. Code that indexed into the array by position, checked its `.length`, or iterated over it expecting the old entries will break.

The same applies to `linearBarcodeFormats` (now `LINEAR_BARCODE_FORMATS`) and `matrixBarcodeFormats` (now `MATRIX_BARCODE_FORMATS`).

##### `ReadResult.eccLevel` removed

The deprecated `eccLevel` field has been removed from `ReadResult`. Use `ecLevel` (which is itself now deprecated in favor of `extra`).

##### `WriterOptions.scale` default changed

The default value of `WriterOptions.scale` changed from `0` to `1`. Previously `0` meant "unset" and was resolved internally; now `1` is the explicit default module size.

##### `WriterOptions.withHRT` and `withQuietZones` renamed

`withHRT` and `withQuietZones` on `ZXingWriterOptions` (the internal interface) have been replaced by `addHRT` and `addQuietZones`. The user-facing `WriterOptions` still accepts the old names as deprecated aliases (preferring the new names when both are provided).

##### `TextMode` values reordered

The `textModes` array (now deprecated in favor of `TEXT_MODES`) order changed from `["Plain", "ECI", "HRI", "Hex", "Escaped"]` to `["Plain", "ECI", "HRI", "Escaped", "Hex", "HexECI"]`. `"Hex"` and `"Escaped"` swapped positions, and `"HexECI"` was added. Code that indexed into the `textModes` array by position will break.

Note: users who set `textMode` by string value (e.g. `textMode: "HRI"`) are not affected.

##### `CharacterSet` duplicate removed

A duplicate `"UTF16BE"` entry was removed from the `characterSets` array (now deprecated in favor of `CHARACTER_SETS`), reducing its length from 35 to 34 and shifting all entries after position 29. Code that indexed into the `characterSets` array by position will break.

Note: users who set `characterSet` by string value (e.g. `characterSet: "UTF8"`) are not affected.

##### `WriterOptions` fields restructured

`readerInit`, `forceSquareDataMatrix`, `ecLevel`, and `sizeHint` have been removed from `ZXingWriterOptions` (the internal C++ interface). They are still accepted on the user-facing `WriterOptions` as deprecated fields and are translated into the `options` string or `scale` value automatically.

#### New Features

##### Symbology system

- **`ReadResult.symbology`**: New field that returns the symbology family name. For example, reading an EAN-13 barcode returns `format: "EAN13"` and `symbology: "EANUPC"`. This allows grouping results by symbology family.
- **New variant formats**: The reader now distinguishes sub-formats within symbology families:
  - Code39 → `Code39`, `Code39Std`, `Code39Ext`, `Code32`, `PZN`
  - ITF → `ITF`, `ITF14`
  - DataBar → `DataBar`, `DataBarOmni`, `DataBarStk`, `DataBarStkOmni`, `DataBarLtd`, `DataBarExp`, `DataBarExpStk`
  - EAN/UPC → `EANUPC`, `EAN13`, `EAN8`, `EAN5`, `EAN2`, `ISBN`, `UPCA`, `UPCE`
  - PDF417 → `PDF417`, `CompactPDF417`, `MicroPDF417`
  - Aztec → `Aztec`, `AztecCode`, `AztecRune`
  - QRCode → `QRCode`, `QRCodeModel1`, `QRCodeModel2`, `MicroQRCode`, `RMQRCode`
  - Other → `OtherBarcode`, `DXFilmEdge`

##### `ReadResult.extra` expanded

The `extra` JSON string now includes `ECLevel` for barcode types that support error correction: QR codes, MicroQR codes, Aztec, PDF417, and rMQR codes. For Aztec and PDF417, which previously had empty `extra` strings, this is entirely new metadata.

##### Meta-formats

New meta-format groupings for `ReaderOptions.formats`: `"All"`, `"AllReadable"`, `"AllCreatable"`, `"AllLinear"`, `"AllMatrix"`, `"AllGS1"`, `"AllRetail"`, `"AllIndustrial"`.

##### Format input flexibility

`ReaderOptions.formats` and `WriterOptions.format` now accept:

- Canonical names (e.g. `"QRCode"`, `"EAN13"`)
- Human-readable labels (e.g. `"QR Code"`, `"EAN-13"`, `"Code 128"`)
- Meta-format names (e.g. `"All"`, `"AllLinear"`)
- Deprecated aliases (e.g. `"DataBarExpanded"`, `"Any"`)

##### `WriterOptions.invert`

New option to invert the colors of the generated barcode.

##### `WriterOptions.options` keys expanded

The `options` string (which was already available but experimental) now supports additional keys: `eci`, `readerInit`, `ecLevel`, `rows`, `columns`. The `@experimental` tag has been removed.

##### `ReaderOptions.validateOptionalChecksum`

New option to validate optional checksums where applicable (e.g. Code39, ITF).

##### `TextMode` `"HexECI"`

New text mode that transcodes `ReadResult.bytesECI` to an ASCII string of hex values.

##### Barcode format utilities

New exported functions and constants:

- **Functions**: `encodeFormat()`, `encodeFormats()`, `symbologyToFormats()`, `formatToSymbology()`, `formatToLabel()`
- **Constants**: `BARCODE_FORMATS`, `BARCODE_HRI_LABELS`, `BARCODE_META_FORMATS`, `BARCODE_SYMBOLOGIES`, `LINEAR_BARCODE_FORMATS`, `MATRIX_BARCODE_FORMATS`, `READABLE_BARCODE_FORMATS`, `CREATABLE_BARCODE_FORMATS`, `GS1_BARCODE_FORMATS`, `RETAIL_BARCODE_FORMATS`, `INDUSTRIAL_BARCODE_FORMATS`, `TEXT_MODES`, `CHARACTER_SETS`, `BINARIZERS`, `CONTENT_TYPES`, `EAN_ADD_ON_SYMBOLS`
- **Types**: `BarcodeFormat`, `BarcodeHRILabel`, `BarcodeMetaFormat`, `BarcodeSymbology`, `LinearBarcodeFormat`, `MatrixBarcodeFormat`, `ReadableBarcodeFormat`, `CreatableBarcodeFormat`, `GS1BarcodeFormat`, `RetailBarcodeFormat`, `IndustrialBarcodeFormat`, `LooseBarcodeFormat`, `ReadInputBarcodeFormat`, `WriteInputBarcodeFormat`, `ReadOutputBarcodeFormat`

### Expanded write support

Many more formats are now writable via the integrated zint library, including: `Code39Ext`, `Code32`, `PZN`, `ITF14`, all DataBar variants, `EANUPC`, `EAN5`, `EAN2`, `ISBN`, `DXFilmEdge`, `CompactPDF417`, `MicroPDF417`, `Aztec`, `AztecRune`, `QRCodeModel2`, `MicroQRCode`, `RMQRCode`, `MaxiCode`.

#### Deprecations

The following are deprecated and will be removed in a future major version:

- `ReadResult.ecLevel` → parse from `ReadResult.extra`
- `ReadResult.readerInit` → parse from `ReadResult.extra`
- `ReadResult.version` → parse from `ReadResult.extra`
- `WriterOptions.withHRT` → use `addHRT`
- `WriterOptions.withQuietZones` → use `addQuietZones`
- `WriterOptions.readerInit` → use `options: "readerInit"`
- `WriterOptions.forceSquareDataMatrix` → use `options: "forceSquare"`
- `WriterOptions.ecLevel` → use `options: "ecLevel=<value>"`
- `WriterOptions.sizeHint` → use negative `scale` value
- `ReaderOptions.tryCode39ExtendedMode` → use `Code39Ext` / `Code39Std` format names
- Format alias `"DataBarExpanded"` → use `"DataBarExp"`
- Format alias `"DataBarLimited"` → use `"DataBarLtd"`
- Format alias `"Linear-Codes"` → use `"AllLinear"`
- Format alias `"Matrix-Codes"` → use `"AllMatrix"`
- Format alias `"Any"` → use `"All"`
- `barcodeFormats` → use `BARCODE_FORMATS`
- `linearBarcodeFormats` → use `LINEAR_BARCODE_FORMATS`
- `matrixBarcodeFormats` → use `MATRIX_BARCODE_FORMATS`
- `textModes` → use `TEXT_MODES`
- `characterSets` → use `CHARACTER_SETS`
- `binarizers` → use `BINARIZERS`
- `contentTypes` → use `CONTENT_TYPES`
- `eanAddOnSymbols` → use `EAN_ADD_ON_SYMBOLS`

#### Fixes

- `downscaleThreshold` and `downscaleFactor` in `ReaderOptions` are no longer marked as experimental.
