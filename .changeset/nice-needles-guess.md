---
"zxing-wasm": major
---

# V2: Breaking Release - Next Major Version

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
