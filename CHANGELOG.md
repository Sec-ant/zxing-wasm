# zxing-wasm

## 2.2.3

### Patch Changes

- f325c8c: Bump zxing-cpp to `fba4e95` with a newly pinned zint version and some internal tweaks. Updated dependencies. Bump emscripten to v4.0.19, which fixes the uncatchable error on WASM initialization in this lib.

## 2.2.2

### Patch Changes

- c12d2fe: Bump deps and switch to OIDC trusted publishing

## 2.2.1

### Patch Changes

- 2423b8b: Bump deps and zxing-cpp, deprecate `forceSquareDataMatrix` and add `forceSquare` support for options.

## 2.2.0

### Minor Changes

- 158d1b0: Add `symbol` property to `ReadResult` and `WriteResult`.
- 158d1b0: Add `extra` property to `ReadResult`. Add `options` property to `WriterOptions`.

### Patch Changes

- 158d1b0: Bump zxing-cpp to `0a3797f` to fix several bugs.
- 91663f3: Bump zxing-cpp to `aab9ccc` to return position info from pure MaxiCodes.

## 2.1.2

### Patch Changes

- 0be5882: Fix unexpected `new URL(..., import.meta.url)` expansion when bundling this package on the consumer side.
- 0be5882: Bump `zxing-cpp` to `a1516b3` and bump other deps.

## 2.1.1

### Patch Changes

- 5ff557f:
  - Bump `zxing-cpp` to `559471a`, also bump other deps;
  - Bump emscripten to v4.0.7, adjust compiling/linking flags and patch scripts;
  - Increase stack size to fix writer issues in #211 and #215 and add tests for them;

## 2.1.0

### Minor Changes

- 98bcdb6: Support WeChat Mini Program.
- 98bcdb6: Accept `ArrayBuffer` and `Uint8Array` as input types in `readBarcodes`.

## 2.0.2

### Patch Changes

- 3d12c62: Bump zxing-cpp to `37b8477` and other deps.

## 2.0.1

### Patch Changes

- 6321b02: Add `ZXING_CPP_COMMIT` export.

## 2.0.0

This release introduces a major refactoring of the underlying Embind APIs and read / write functions. Key changes include a new set of default reader options, enhanced writer capabilities backed by [`zint`](https://sourceforge.net/projects/zint/), and updated APIs for reading and writing barcodes. These changes break backward compatibility, so we are upgrading to the next major version.

### Breaking Changes

#### Consolidated Reader Function

`readBarcodes(...)` replaces both `readBarcodesFromImageFile(...)` and `readBarcodesFromImageData(...)`. The new function can accept either a `Blob` or an `ImageData` as its input.

> [!NOTE]
>
> The v1 reader functions `readBarcodesFromImageFile` and `readBarcodesFromImageData` are still kept for a smooth migration experience, but marked as deprecated.

#### Updated Reader Options

A few reader options have changed their default values. This change is to align with the latest ZXing C++ library and provide a more consistent experience across different platforms:

1. `tryCode39ExtendedMode` is now `true` by default. It was previously `false`.
2. `eanAddOnSymbol` is now `"Ignore"` by default. It was previously `"Read"`.
3. `textMode` is now `"HRI"` by default. It was previously `"Plain"`.

Some deprecated options have been removed, see [zxing-cpp#704](https://github.com/zxing-cpp/zxing-cpp/discussions/704) for more details:

1. `validateCode39CheckSum` is now removed. The Code39 symbol has a valid checksum if the third character of the `symbologyIdentifier` is an odd digit.
2. `validateITFCheckSum` is now removed. The ITF symbol has a valid checksum if the third character of the `symbologyIdentifier` is a `'1'`.
3. `returnCodabarStartEnd` is now removed. The detected results of Codabar symbols now always include the start and end characters.

#### `eccLevel` in Read Result Renamed to `ecLevel`

In `ReadResult`, the `eccLevel` field has been renamed to `ecLevel`. It now holds strings like `"L"`, `"M"`, `"Q"`, or `"H"` or stringified numeric percentage values for error correction levels. An empty string indicates that the error correction level is not applicable.

> [!NOTE]
>
> The `eccLevel` field is still kept for a smooth migration experience, but marked as deprecated.

#### Renamed & Enhanced Writer Function

`writeBarcode(...)` replaces `writeBarcodeToImageFile(...)`. This function is now powered by the new [`zint`](https://sourceforge.net/projects/zint/) backend which supports all available formats that are currently supported by the reader. It accepts either a `string` text or an `Uint8Array` binary data as its input for barcode generation, and provides new output formats (e.g. SVG, UTF-8) in addition to an image file blob.

The `WriterOptions` object has also been updated completely.

> [!NOTE]
>
> The final shape of the `writeBarcode` function is still in review. The current implementation is subject to change.

#### `.wasm` Module Initialization / Caching Overhaul

`prepareZXingModule(...)` replaces both `setZXingModuleOverrides(...)` and `getZXingModuleOverrides(...)`. The new function provides a more flexible way to initialize the ZXing module with custom options.

> [!NOTE]
>
> The v1 module initialization functions `setZXingModuleOverrides` and `getZXingModuleOverrides` are still kept for a smooth migration experience, but marked as deprecated.

`purgeZXingModule` now only clears the relevant module cache from where it is imported. It no longer resets the global module cache.

#### Redefined `BarcodeFormat`-Family Types

`None` is removed from the `BarcodeFormat` union type. New types like `LinearBarcodeFormat`, `MatrixBarcodeFormat` and `LooseBarcodeFormat` are introduced. See [`barcodeFormat.ts`](https://github.com/Sec-ant/zxing-wasm/blob/main/src/bindings/barcodeFormat.ts) for more details.

### New Features & Enhancements

#### More Barcode Formats Supported in Writer

The new `writeBarcode` function supports more barcode formats than the previous `writeBarcodeToImageFile`. All barcode formats supported by the reader are now supported by the writer.

#### New `tryDenoise` Option for Reading Barcodes

The new `tryDenoise` option in `ReaderOptions` allows you to enable or disable the denoising algorithm when reading barcodes. This is an experimental feature. By default, it is set to `false`.

### Bug Fixes

#### Fix TS `moduleResolution: node` Subpath Exports Resolution

The subpath export types are now compatible with TypeScript's `moduleResolution: node` strategy by using the [types-versions-wildcards strategy](https://github.com/andrewbranch/example-subpath-exports-ts-compat/tree/main/examples/node_modules/types-versions-wildcards). This package now passes all the [`arethetypeswrong` checks](https://arethetypeswrong.github.io/?p=zxing-wasm%402.0.0).

## 2.0.0-beta.4

### Patch Changes

- f8c33b2: Fix the `zxing_writer.wasm` size issue. See [#190](https://github.com/Sec-ant/zxing-wasm/discussions/190).

## 2.0.0-beta.3

### Minor Changes

- 615a321: - Add `DXFilmEdge` writing support.
  - Fix subpath exports TS compatibility with types-versions-wildcards strategy. Check [this](https://github.com/andrewbranch/example-subpath-exports-ts-compat/tree/main/examples/node_modules/types-versions-wildcards) for more information.
  - Add types to `.wasm` subpath exports.
  - Add `ImageData` ambient type export.

## 2.0.0-beta.2

### Patch Changes

- b856d58: Add `typesVersions` field for `moduleResolution: node`

## 2.0.0-beta.1

### Patch Changes

- a10ffcc: Bump `zxing-cpp` to `0dfa36b` to fix DataBarExpanded decoder error and ITF quiet zone detection heuristic

## 2.0.0-beta.0

### Major Changes

- 1a77296: V2: Breaking Release - Next Major Version

  This release introduces a major refactoring of the underlying Embind APIs and read / write functions. Key changes include transitioning away from [Embind Enums](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html#enums) toward numeric encoding and decoding, a new set of default reader options, enhanced writer capabilities backed by [`zint`](https://sourceforge.net/projects/zint/), and updated APIs for reading and writing barcodes. These changes break backward compatibility, so we are upgrading to the next major version.

  ## Breaking Changes

  ### Renamed & Consolidated Reader Function

  `readBarcodes(...)` replaces both `readBarcodesFromImageFile(...)` and `readBarcodesFromImageData(...)`. The new function unifies code paths for `Blob` and `ImageData` inputs.

  > [!NOTE]
  >
  > The v1 reader functions `readBarcodesFromImageFile` and `readBarcodesFromImageData` are still kept for a smooth migration experience, but marked as deprecated.

  ### Updated Reader Options

  A few reader options have changed their default values. This change is to align with the latest ZXing C++ library and provide a more consistent experience across different platforms:
  1. `tryCode39ExtendedMode` is now `true` by default. It was previously `false`.
  2. `eanAddOnSymbol` is now `"Ignore"` by default. It was previously `"Read"`.
  3. `textMode` is now `"HRI"` by default. It was previously `"Plain"`.

  Some deprecated options have been removed, see [zxing-cpp#704](https://github.com/zxing-cpp/zxing-cpp/discussions/704) for more details:
  1. `validateCode39CheckSum` is now removed. The Code39 symbol has a valid checksum if the third character of the `symbologyIdentifier` is an odd digit.
  2. `validateITFCheckSum` is now removed. The ITF symbol has a valid checksum if the third character of the `symbologyIdentifier` is a `'1'`.
  3. `returnCodabarStartEnd` is now removed. The detected results of Codabar symbols now always include the start and end characters.

  ### `eccLevel` in Read Result Renamed to `ecLevel`

  In `ReadResult`, the `eccLevel` field has been renamed to `ecLevel`. It now holds strings like `"L"`, `"M"`, `"Q"`, or `"H"` or stringified numeric values for error correction levels. An empty string indicates that the error correction level is not applicable.

  > [!NOTE]
  >
  > The `eccLevel` field is still kept for a smooth migration experience, but marked as deprecated.

  ### Renamed & Enhanced Writer Function

  `writeBarcode(...)` replaces `writeBarcodeToImageFile(...)`. The new function is powered by the new [`zint`](https://sourceforge.net/projects/zint/) writer, which supports more barcode formats, supports both `string` and `Uint8Array` inputs for generating barcodes from text or binary data, and provides new output formats (e.g. SVG, UTF-8) in addition to the binary image file output.

  The `WriterOptions` object has also been updated completely.

  > [!NOTE]
  >
  > The final shape of the `writeBarcode` function is still under discussion. The current implementation is subject to change.

  ### Module Initialization / Caching Overhaul

  `prepareZXingModule(...)` replaces both `setZXingModuleOverrides(...)` and `getZXingModuleOverrides(...)`. The new function provides a more flexible way to initialize the ZXing module with custom options.

  > [!NOTE]
  >
  > The v1 module initialization functions `setZXingModuleOverrides` and `getZXingModuleOverrides` are still kept for a smooth migration experience, but marked as deprecated.

  `purgeZXingModule` now only clears the relevant module cache from where it is imported. It no longer resets the global module cache.

  ## New Features & Enhancements

  ### More Barcode Formats Supported in Writer

  The new `writeBarcode` function supports more barcode formats than the previous `writeBarcodeToImageFile`. All barcode formats supported by the reader except for `DXFilmEdge` are now supported by the writer.

  ### New `tryDenoise` Option for Reading Barcodes

  The new `tryDenoise` option in `ReaderOptions` allows you to enable or disable the denoising algorithm when reading barcodes. This is an experimental feature and by default, it is set to `false`.

## 1.3.4

### Patch Changes

- 1a9a372: Bump `zxing-cpp` to `579650a` to fix incorrect PDF417 position info.

## 1.3.3

### Patch Changes

- 0709489: Bump `zxing-cpp` to `cd9bba3` to fix an ITF detection regression.

## 1.3.2

### Patch Changes

- 4b0ca08: Bump zxing-cpp to [`308f820`](https://github.com/zxing-cpp/zxing-cpp/commit/308f82077dd82979c9df1f82a8ff264dcf0d6371) and improve DataBar detection rate.

## 1.3.1

### Patch Changes

- 999335b: Bump zxing-cpp to [`8fb2f81`](https://github.com/zxing-cpp/zxing-cpp/commit/8fb2f81841de9161c813e6473a0e48f62c2ff2b8) to support shorter ITF symbols.

## 1.3.0

### Minor Changes

- 925e12f: Add reader support for `DataBarLimited`.

## 1.2.15

### Patch Changes

- fa87128: Fix webassembly exception handling. Increase success rate.
- f1eef5c: Bump zxing-cpp to `81407a0` to fix reader options not being passed to the internal reader if `isPure` is set.

## 1.2.14

### Patch Changes

- aad8899: Patch emscripten to mitigate DOM Clobbering vulnerability.

## 1.2.13

### Patch Changes

- 650c295: DOM Clobbering security patch.

## 1.2.12

### Patch Changes

- 2228845: Bump `zxing-cpp` and switch to `pnpm`, `renovate`.

## 1.2.11

### Patch Changes

- d3c92ee:
  - Always use `.js` as the chunk filename extension.
  - Bump zxing-cpp to `986f785`
  - Bump dependencies

## 1.2.10

### Patch Changes

- 0a43b27: Bump zxing-cpp to `d0c1f34`

## 1.2.9

### Patch Changes

- 01e8878: Bump zxing-cpp to `441132c`

## 1.2.8

### Patch Changes

- 2fc9bec: Bump zxing-cpp to 4bbc1db

## 1.2.7

### Patch Changes

- 308d165: Bump zxing-cpp to 9ca0684

## 1.2.6

### Patch Changes

- a2339d3: Bump zxing-cpp to [`b58682b`](https://github.com/zxing-cpp/zxing-cpp/commit/b58682b90ff082cee8d946c73f8852574478fb09).

## 1.2.5

### Patch Changes

- 4358969: Fix WebAssembly instantiation issue in electron.

## 1.2.5-rc.0

### Patch Changes

- 4358969: Fix WebAssembly instantiation issue in electron.

## 1.2.4

### Patch Changes

- f749591: Bump zxing-cpp to `b3aff4a`:
  - Deprecate `validateCode39CheckSum`, `validateITFCheckSum` and `returnCodabarStartEnd`. Related commits from upstream: [`fc8f32d`](https://github.com/zxing-cpp/zxing-cpp/commit/fc8f32d7db00060b3aab24338c08ab792cef0bfd), [`b3fe574`](https://github.com/zxing-cpp/zxing-cpp/commit/b3fe5744b2a0ac554efa70635a087c5ff3342c42), [`d636c6d`](https://github.com/zxing-cpp/zxing-cpp/commit/d636c6d8a054fe5d794e9ed57159a5230ad6ebf5) [`68c97c7`](https://github.com/zxing-cpp/zxing-cpp/commit/68c97c744f2fe1ead3677dd106020530d44d7180), [`2f3c72c`](https://github.com/zxing-cpp/zxing-cpp/commit/2f3c72cccea22a60d41b31c185aba1ea5425d6bb).
  - Reduce WASM binaries size. Related commits from upstream: [`6741403`](https://github.com/zxing-cpp/zxing-cpp/commit/67414033f8cc28d7152c3cdf2bb1562078b03c4f), [`1fa0070`](https://github.com/zxing-cpp/zxing-cpp/commit/1fa0070450437badab7ae6dcb1c1e80d7911d8e7), [`b3aff4a`](https://github.com/zxing-cpp/zxing-cpp/commit/b3aff4a98b03e056a244ca385a8221c50d67e352).
  - Other fixes and improvements from upstream.

## 1.2.3

### Patch Changes

- de36dce: reset zxing-cpp to b152afd
  - `validateITFCheckSum`, `tryCode39ExtendedMode` and `validateCode39CheckSum` are deprecated in [later commits](https://github.com/zxing-cpp/zxing-cpp/commits/master/?since=2024-01-26).

## 1.2.2

### Patch Changes

- 02f0386: Bump zxing-cpp to b3fe574
