<!-- markdownlint-disable MD041 MD033 -->

> [!NOTE]
>
> For the v1 release, please visit the [`channel/v1`](https://www.github.com/Sec-ant/zxing-wasm/tree/channel/v1) branch.

# zxing-wasm

[![npm](https://img.shields.io/npm/v/zxing-wasm)](https://www.npmjs.com/package/zxing-wasm/v/latest) [![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/zxing-wasm)](https://www.npmjs.com/package/zxing-wasm/v/latest) [![jsDelivr hits](https://img.shields.io/jsdelivr/npm/hm/zxing-wasm?color=%23ff5627)](https://cdn.jsdelivr.net/npm/zxing-wasm@latest/) [![deploy status](https://github.com/Sec-ant/zxing-wasm/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sec-ant/zxing-wasm/actions/workflows/deploy.yml)

[ZXing-C++](https://github.com/zxing-cpp/zxing-cpp) WebAssembly as an ES/CJS module with types. Read or write barcodes in various JS runtimes: Web, Node.js, Bun, and Deno.

<div align="center">

|  Barcode Format   | Linear Barcode | Matrix Barcode | Reading Support | Writing Support |
| :---------------: | :------------: | :------------: | :-------------: | :-------------: |
|      `Aztec`      |                |       ✅       |       ✅        |       ✅        |
|     `Codabar`     |       ✅       |                |       ✅        |       ✅        |
|     `Code39`      |       ✅       |                |       ✅        |       ✅        |
|     `Code93`      |       ✅       |                |       ✅        |       ✅        |
|     `Code128`     |       ✅       |                |       ✅        |       ✅        |
|     `DataBar`     |       ✅       |                |       ✅        |       ✅        |
| `DataBarLimited`  |       ✅       |                |       ✅        |       ✅        |
| `DataBarExpanded` |       ✅       |                |       ✅        |       ✅        |
|   `DataMatrix`    |                |       ✅       |       ✅        |       ✅        |
|   `DXFilmEdge`    |       ✅       |                |       ✅        |       ✅        |
|      `EAN-8`      |       ✅       |                |       ✅        |       ✅        |
|     `EAN-13`      |       ✅       |                |       ✅        |       ✅        |
|       `ITF`       |       ✅       |                |       ✅        |       ✅        |
|    `MaxiCode`     |                |       ✅       |       ✅[^1]    |       ✅        |
|     `PDF417`      |                |       ✅       |       ✅        |       ✅        |
|     `QRCode`      |                |       ✅       |       ✅        |       ✅        |
|   `MicroQRCode`   |                |       ✅       |       ✅        |       ✅        |
|    `rMQRCode`     |                |       ✅       |       ✅        |       ✅        |
|      `UPC-A`      |       ✅       |                |       ✅        |       ✅        |
|      `UPC-E`      |       ✅       |                |       ✅        |       ✅        |

[^1]: Reading support for `MaxiCode` requires a pure monochrome image that contains an unrotated and unskewed symbol, along with a sufficient white border surrounding it.

</div>

Visit [this online demo](https://zxing-wasm-demo.deno.dev/) to quickly explore its basic reading functions. It works best on the latest Chromium browsers.

## Build

```bash
git clone --recurse-submodules https://github.com/Sec-ant/zxing-wasm
cd zxing-wasm

# Install pnpm before executing the next command:
# https://pnpm.io/installation
pnpm i --frozen-lockfile

# Install CMake before executing the next command:
# https://cmake.org/download/
# Install Emscripten before executing the next command:
# https://emscripten.org/docs/getting_started/downloads.html
pnpm build:wasm

pnpm build
```

## Install

```bash
npm i zxing-wasm
```

## Documentation

<https://zxing-wasm.deno.dev/>

## Demo

Demo page: https://zxing-wasm-demo.deno.dev/

Demo source: https://github.com/Sec-ant/zxing-wasm-demo

## Usage

This package exports three subpaths: `full`, `reader`, and `writer`.

### `zxing-wasm` or `zxing-wasm/full`

These two subpaths provide functions to read and write barcodes. The wasm binary size is ~1.32 MiB.

```ts
import { readBarcodes, writeBarcode } from "zxing-wasm";
```

or

```ts
import { readBarcodes, writeBarcode } from "zxing-wasm/full";
```

### `zxing-wasm/reader`

This subpath only provides a function to read barcodes. The wasm binary size is ~919 KiB.

```ts
import { readBarcodes } from "zxing-wasm/reader";
```

### `zxing-wasm/writer`

This subpath only provides a function to write barcodes. The wasm binary size is ~608 KiB.

```ts
import { writeBarcode } from "zxing-wasm/writer";
```

### IIFE Scripts

Apart from ES and CJS modules, this package also ships IIFE scripts. The registered global variable is named `ZXingWASM`, where you can access all the exported functions and variables under it.

> [!NOTE]
> Replace the `<version>` with the desired version number.

```html
<!-- full -->
<script src="https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/iife/full/index.js"></script>

<!-- reader -->
<script src="https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/iife/reader/index.js"></script>

<!-- writer -->
<script src="https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/iife/writer/index.js"></script>
```

### [`readBarcodes`](https://zxing-wasm.deno.dev/functions/full.readBarcodes.html)

[`readBarcodes`](https://zxing-wasm.deno.dev/functions/full.readBarcodes.html) accepts an image [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob), image [`File`](https://developer.mozilla.org/docs/Web/API/File), [`ArrayBuffer`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), [`Uint8Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array), or an [`ImageData`](https://developer.mozilla.org/docs/Web/API/ImageData) as its first argument, and various options are supported in [`ReaderOptions`](https://zxing-wasm.deno.dev/interfaces/full.ReaderOptions.html) as an optional second argument.

The return result of this function is a `Promise` of an array of [`ReadResult`](https://zxing-wasm.deno.dev/interfaces/full.ReadResult.html)s.

e.g.

```ts
import { readBarcodes, type ReaderOptions } from "zxing-wasm/reader";

const readerOptions: ReaderOptions = {
  tryHarder: true,
  formats: ["QRCode"],
  maxNumberOfSymbols: 1,
};

/**
 * Read from image file/blob
 */
const imageFile = await fetch(
  "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Hello%20world!",
).then((resp) => resp.blob());

const imageFileReadResults = await readBarcodes(imageFile, readerOptions);

console.log(imageFileReadResults[0].text); // Hello world!

/**
 * Read from image data
 */
const imageData = await createImageBitmap(imageFile).then((imageBitmap) => {
  const { width, height } = imageBitmap;
  const context = new OffscreenCanvas(width, height).getContext(
    "2d",
  ) as OffscreenCanvasRenderingContext2D;
  context.drawImage(imageBitmap, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
});

const imageDataReadResults = await readBarcodes(imageData, readerOptions);

console.log(imageDataReadResults[0].text); // Hello world!
```

### [`writeBarcode`](https://zxing-wasm.deno.dev/functions/full.writeBarcode.html)

The first argument of [`writeBarcode`](https://zxing-wasm.deno.dev/functions/full.writeBarcode.html) is a text string or an [`Uint8Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) of bytes to be encoded, and the optional second argument [`WriterOptions`](https://zxing-wasm.deno.dev/interfaces/full.WriterOptions.html) accepts several writer options.

The return result of this function is a `Promise` of a [`WriteResult`](https://zxing-wasm.deno.dev/interfaces/full.WriteResult.html).

e.g.

```ts
import { writeBarcode, type WriterOptions } from "zxing-wasm/writer";

const writerOptions: WriterOptions = {
  format: "QRCode",
  scale: 3,
};

const writeOutput = await writeBarcode("Hello world!", writerOptions);

console.log(writeOutput.svg); // An SVG string.
console.log(writeOutput.utf8); // A multi-line string made up of " ", "▀", "▄", "█" characters.
console.log(writeOutput.image); // A PNG image blob.
```

## Configuring `.wasm` Serving

### Serving via Web or CDN

When using this package, a `.wasm` binary file needs to be served somewhere, so the runtime can fetch, compile and instantiate the WASM module. To provide a smooth development experience, the serve path is automatically assigned a [jsDelivr CDN](https://fastly.jsdelivr.net/npm/zxing-wasm/) URL upon build.

If you want to change the serve path to your own server or other CDNs, please use [`prepareZXingModule`](https://zxing-wasm.deno.dev/functions/full.prepareZXingModule.html) and pass an [`overrides`](http://localhost:4173/interfaces/full.PrepareZXingModuleOptions.html#overrides) object with a custom defined [`locateFile`](https://emscripten.org/docs/api_reference/module.html?highlight=locatefile#Module.locateFile) function before reading or writing barcodes. `locateFile` is one of the [Emscripten `Module` attribute hooks](https://emscripten.org/docs/api_reference/module.html#affecting-execution) that can affect the code execution of the `Module` object during its lifecycle.

e.g.

```ts
import { prepareZXingModule, writeBarcode } from "zxing-wasm";

// Override the locateFile function
prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) => {
      if (path.endsWith(".wasm")) {
        return `https://unpkg.com/zxing-wasm@2/dist/full/${path}`;
      }
      return prefix + path;
    },
  },
});

// Call read or write functions afterward
const writeOutput = await writeBarcode("Hello world!");
```

> [!NOTE]
>
> The default jsDelivr CDN serve path is also achieved by overriding the custom `locateFile` function:
>
> ```ts
> const DEFAULT_MODULE_OVERRIDES: ZXingModuleOverrides = {
>   locateFile: (path, prefix) => {
>     const match = path.match(/_(.+?)\.wasm$/);
>     if (match) {
>       return `https://fastly.jsdelivr.net/npm/zxing-wasm@${ZXING_WASM_VERSION}/dist/${match[1]}/${path}`;
>     }
>     return prefix + path;
>   },
> };
> ```
>
> However, `overrides` is atomic. If you override other `Module` attributes, you _probably_ should also provide a `locateFile` function to ensure the `.wasm` file is fetched correctly.

### Integrating in Non-Web Runtimes

If you want to use this library in non-web runtimes (such as Node.js, Bun, Deno, etc.) without setting up a server, there are several possible approaches. Because API support can differ between runtime environments and versions, you may need to adapt these examples or choose alternative methods depending on your specific runtime’s capabilities. Below are some example configurations for Node.js.

1. **Use the [`Module.instantiateWasm`](https://emscripten.org/docs/api_reference/module.html?highligh=instantiateWasm#Module.instantiateWasm) API**

   ```ts
   import { readFileSync } from "node:fs";
   import { prepareZXingModule } from "zxing-wasm/reader";

   const wasmFileBuffer = readFileSync("/path/to/the/zxing_reader.wasm");

   prepareZXingModule({
     overrides: {
       instantiateWasm(imports, successCallback) {
         WebAssembly.instantiate(wasmFileBuffer, imports).then(({ instance }) =>
           successCallback(instance),
         );
         return {};
       },
     },
   });
   ```

2. **Use the [`Module.wasmBinary`](https://emscripten.org/docs/compiling/WebAssembly.html?highlight=wasmBinary#wasm-files-and-compilation) API**

   ```ts
   import { readFileSync } from "node:fs";
   import { prepareZXingModule } from "zxing-wasm/reader";

   prepareZXingModule({
     overrides: {
       wasmBinary: readFileSync("/path/to/the/zxing_reader.wasm")
         .buffer as ArrayBuffer,
     },
   });
   ```

3. **Use the [`Module.locateFile`](https://emscripten.org/docs/api_reference/module.html?highlight=locatefile#Module.locateFile) API with an Object URL**

   ```ts
   import { readFileSync } from "node:fs";
   import { prepareZXingModule } from "zxing-wasm/reader";

   // Create an Object URL for the .wasm file.
   const wasmFileUrl = URL.createObjectURL(
     new Blob([readFileSync("/path/to/the/zxing_reader.wasm")], {
       type: "application/wasm",
     }),
   );

   prepareZXingModule({
     overrides: {
       locateFile: (path, prefix) => {
         if (path.endsWith(".wasm")) {
           return wasmFileUrl;
         }
         return prefix + path;
       },
       // Call `URL.revokeObjectURL(wasmFileUrl)` after the ZXing module
       // is fully instantiated to free up memory.
       postRun: [
         () => {
           URL.revokeObjectURL(wasmFileUrl);
         },
       ],
     },
   });
   ```

4. **Use the [`Module.locateFile`](https://emscripten.org/docs/api_reference/module.html?highlight=locatefile#Module.locateFile) API with a Base64-encoded Data URL** _(Not recommended)_

   ```ts
   import { readFileSync } from "node:fs";
   import { prepareZXingModule } from "zxing-wasm/reader";

   const wasmBase64 = readFileSync("/path/to/the/zxing_reader.wasm").toString(
     "base64",
   );
   const wasmUrl = `data:application/wasm;base64,${wasmBase64}`;

   prepareZXingModule({
     overrides: {
       locateFile: (path, prefix) => {
         if (path.endsWith(".wasm")) {
           return wasmUrl;
         }
         return prefix + path;
       },
     },
   });
   ```

> [!NOTE]
> To use this library in a WeChat mini program <img src="https://github.com/user-attachments/assets/7d8f3337-dd9c-43ec-aab4-8d4e72d32867" width="16" height="16">, there are several things to keep in mind:
>
> 1. Only the `zxing-wasm` import path is supported; `zxing-wasm/reader` or `zxing-wasm/writer` is not supported.
> 2. Before using the library, you need to copy/move the `node_modules/zxing-wasm/dist/full/zxing_full.wasm` file into your project directory.
> 3. You must use `prepareZXingModule` to configure how the `.wasm` file will be fetched, loaded, and compiled before calling `readBarcodes` or `writeBarcode`. This is mandatory, and you can do so with the following code:
>
>    ```typescript
>    prepareZXingModule({
>      overrides: {
>        instantiateWasm(imports, successCallback) {
>          WXWebAssembly.instantiate("path/to/zxing_full.wasm", imports).then(
>            ({ instance }) => successCallback(instance),
>          );
>          return {};
>        },
>      },
>    });
>    ```
>
>    Note that WeChat mini programs use `WXWebAssembly` instead of the standard `WebAssembly`, and the first argument in `WXWebAssembly.instantiate` should point to the location where the `zxing_full.wasm` file was moved earlier.
>
> 4. This library uses a bare minimum `Blob` polyfill in the mini program environment so that no errors will be thrown if you call `writeBarcode`. However, it's recommended to use a full-fledged `Blob` polyfill for not breaking other parts of your program.

> [!IMPORTANT]
>
> Each version of this library has a unique corresponding `.wasm` file. If you choose to serve it yourself, please ensure that the `.wasm` file matches the version of the `zxing-wasm` library you are using. Otherwise, you may encounter unexpected errors.

For convenience, this library provides an exported `ZXING_WASM_VERSION` variable to indicate the resolved version of the `zxing-wasm` you are using:

```ts
import { ZXING_WASM_VERSION } from "zxing-wasm";
```

The commit hash of the `zxing-cpp` submodule is exported as `ZXING_CPP_COMMIT`:

```ts
import { ZXING_CPP_COMMIT } from "zxing-wasm";
```

The SHA-256 hash of the `.wasm` file (in hex format) is also exported as `ZXING_WASM_SHA256`, in case you want to make sure you are serving the exactly same file:

```ts
import { ZXING_WASM_SHA256 } from "zxing-wasm";
```

To acquire the `.wasm` files for customized serving, in addition to finding them by searching in your `node_modules` folder, they can also be downloaded from CDNs like [jsDelivr](https://cdn.jsdelivr.net/npm/zxing-wasm@latest/dist/):

- **`zxing_full.wasm`**:

  ```text
  https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/full/zxing_full.wasm
  ```

- **`zxing_reader.wasm`**:

  ```text
  https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/reader/zxing_reader.wasm
  ```

- **`zxing_writer.wasm`**:

  ```text
  https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/writer/zxing_writer.wasm
  ```

## Controlling `.wasm` Instantiation Timing and Caching

By default, the `.wasm` binary will not be fetched and instantiated until a `readBarcodes` or `writeBarcode` function is called. This behavior avoids unnecessary network requests and instantiation overhead if you decide to override the default `.wasm` serving path or other settings before using the library. Calling `prepareZXingModule` with `overrides` alone does not change this default behavior:

```ts
prepareZXingModule({
  overrides: {
    /* ... your desired overrides ... */
  },
}); // <-- returns void
```

However, if you want to explicitly trigger the download and instantiation of the `.wasm` binary, you can set the [`fireImmediately`](https://zxing-wasm.deno.dev/interfaces/full.PrepareZXingModuleOptions.html#fireimmediately) option to `true`. Doing so also causes `prepareZXingModule` to return a `Promise` that resolves to the underlying Emscripten module. This allows you to `await` the instantiation process:

```ts
prepareZXingModule({
  overrides: {
    /* ... your desired overrides ... */
  },
  fireImmediately: true,
}); // <-- returns a promise
```

Because different `overrides` settings can influence how this library locates and instantiates the `.wasm` binary, the library performs an equality check on `overrides` to determine if the `.wasm` binary should be re-fetched and re-instantiated. By default, it is determined by a shallow comparison of the `overrides` object. If you prefer a different method of comparison, you can supply a custom [`equalityFn`](https://zxing-wasm.deno.dev/interfaces/full.PrepareZXingModuleOptions.html#equalityfn):

```ts
prepareZXingModule({
  overrides: {
    /* ... your desired overrides ... */
  },
  fireImmediately: true,
  equalityFn: () => false, // <-- force re-fetch and re-instantiate
});
```

## FAQ

1. **Why are submodules required?**

   The core function of reading / writing barcodes of this library is provided by [zxing-cpp](https://github.com/zxing-cpp/zxing-cpp). It is pinned to a specific commit ID as a submodule, and can be built as `.wasm` files. Additionally, the barcode generation ability is provided by [`zint`](https://sourceforge.net/projects/zint/), which is a submodule inside [zxing-cpp](https://github.com/zxing-cpp/zxing-cpp), so it is necessary to clone the repository with `--recurse-submodules` to ensure that all required submodules are also cloned.

2. **I forgot to clone the repository with `--recurse-submodules`, how should I install the submodules without deleting this repo and cloning it again?**

   In the root of the repo, run:

   ```bash
   git submodule update --init --recursive
   ```

3. **Are there any higher level libraries that can be used to simplify the usage of this library?**
   - [barcode-detector](https://github.com/Sec-ant/barcode-detector): A [Barcode Detection API](https://wicg.github.io/shape-detection-api/#barcode-detection-api) polyfill / ponyfill that uses this library under the hood.
   - [vue-qrcode-reader](https://github.com/gruhn/vue-qrcode-reader): A set of Vue.js components for detecting QR codes and various other barcode formats right in the browser which uses [barcode-detector](https://github.com/Sec-ant/barcode-detector) under the hood.
   - [@yudiel/react-qr-scanner](https://github.com/yudielcurbelo/react-qr-scanner): A library to scan QR Codes in react which uses [barcode-detector](https://github.com/Sec-ant/barcode-detector) under the hood.
   - [svelte-qrcode-reader](https://github.com/ollema/svelte-qrcode-reader): A set of Svelte 5 components for detecting and decoding QR-codes which uses [barcode-detector](https://github.com/Sec-ant/barcode-detector) under the hood.

   A React toolkit for scanning barcodes directly based on this library is planned, which aims to provide easy-to-use capabilities for interacting with web cameras.

4. **One of the input types of `readBarcodes` is `ImageData`, which is a `DOM` type. How can I use it in Node.js or other runtimes?**

   The types are duck-typed, so you can use it in Node.js or other runtimes by providing a `DOM`-compatible `ImageData` object in the following shape, where the image data should be in [RGBA format](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/data):

   ```ts
   interface ImageData {
     data: Uint8ClampedArray;
     width: number;
     height: number;
   }
   ```

## Licenses

This project contains code from multiple sources, each with its own license:

- [zxing-cpp](https://github.com/zxing-cpp/zxing-cpp): [Apache License 2.0](https://github.com/zxing-cpp/zxing-cpp/blob/master/LICENSE)
- [src/cpp/ZXingWasm.cpp](https://github.com/Sec-ant/zxing-wasm/blob/main/src/cpp/ZXingWasm.cpp): [Apache License 2.0](https://github.com/Sec-ant/zxing-wasm/blob/main/src/cpp/LICENSE)
- [zint](https://sourceforge.net/projects/zint/): [BSD 3-Clause License](https://sourceforge.net/p/zint/code/ci/master/tree/LICENSE)
- zxing-wasm specific code: [MIT License](https://github.com/Sec-ant/zxing-wasm/blob/main/LICENSE)
