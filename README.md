# zxing-wasm

[![npm](https://img.shields.io/npm/v/zxing-wasm)](https://www.npmjs.com/package/zxing-wasm/v/latest) [![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/zxing-wasm)](https://www.npmjs.com/package/zxing-wasm/v/latest) [![jsDelivr hits](https://img.shields.io/jsdelivr/npm/hm/zxing-wasm?color=%23ff5627)](https://cdn.jsdelivr.net/npm/zxing-wasm@latest/) [![deploy status](https://github.com/Sec-ant/zxing-wasm/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sec-ant/zxing-wasm/actions/workflows/deploy.yml)

[ZXing-C++](https://github.com/zxing-cpp/zxing-cpp) WebAssembly as an ES/CJS module with types. Read or write barcodes in various JS runtimes: Web, Node, Bun, and Deno.

<!-- Visit [this online demo](https://zxing-wasm-demo.deno.dev/) to quickly explore its basic functions. It works best on the latest Chromium browsers. -->

## Build

```bash
git clone --recurse-submodules https://github.com/Sec-ant/zxing-wasm
cd zxing-wasm

# Install pnpm before executing the next command:
# https://pnpm.io/installation
pnpm i --frozen-lockfile

# Install CMake before executing the next command:
# https://cmake.org/download/
pnpm cmake

# Install Emscripten before executing the next command:
# https://emscripten.org/docs/getting_started/downloads.html
pnpm build:wasm

pnpm build
```

## Install

```
npm i zxing-wasm
```

## Documentation

https://zxing-wasm.deno.dev/

<!-- ## Demo

Demo page: https://zxing-wasm-demo.deno.dev/

Demo source: https://github.com/Sec-ant/zxing-wasm-demo -->

## Usage

This package exports three subpaths: `full`, `reader`, and `writer`. You can choose the one that fits your needs. If you use TypeScript, you should set [`moduleResolution`](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution) to [`bundler`](https://www.typescriptlang.org/docs/handbook/modules/reference.html#bundler), [`node16`, or `nodenext`](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext-1) in your `tsconfig.json` file to properly resolve the exported module.

### `zxing-wasm` or `zxing-wasm/full`

These two subpaths provide functions to read and write barcodes. The wasm binary size is ~1.30 MB.

```ts
import { readBarcodes, writeBarcode } from "zxing-wasm";
```

or

```ts
import { readBarcodes, writeBarcode } from "zxing-wasm/full";
```

### `zxing-wasm/reader`

This subpath only provides a function to read barcodes. The wasm binary size is ~906 KB.

```ts
import { readBarcodes } from "zxing-wasm/reader";
```

### `zxing-wasm/writer`

This subpath only provides a function to write barcodes. The wasm binary size is ~1.17 MB.

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

[`readBarcodes`](https://zxing-wasm.deno.dev/functions/full.readBarcodes.html) accepts an image [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob), image [`File`](https://developer.mozilla.org/docs/Web/API/File), or an [`ImageData`](https://developer.mozilla.org/docs/Web/API/ImageData) as its first argument, and various options are supported in [`ReaderOptions`](https://zxing-wasm.deno.dev/interfaces/full.ReaderOptions.html) as an optional second argument.

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

## About `.wasm` serving

When using this package, a `.wasm` binary file needs to be served somewhere so the runtime can fetch, compile and instantiate the WASM module. In order to provide a smooth development experience, the serve path is automatically assigned a [jsDelivr CDN](https://fastly.jsdelivr.net/npm/zxing-wasm/) url upon build.

If you want to change the serve path to your own server, other CDNs, or just inlined base64-encoded data URIs, please use [`prepareZXingModule`](https://zxing-wasm.deno.dev/functions/full.prepareZXingModule.html) and pass an `overrides` object with a custom defined [`locateFile`](https://emscripten.org/docs/api_reference/module.html?highlight=locatefile#Module.locateFile) function before reading or writing barcodes. `locateFile` is one of the [Emscripten `Module` attribute hooks](https://emscripten.org/docs/api_reference/module.html#affecting-execution) that can affect the code execution of the `Module` object during its lifecycle.

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
> Each version of this library has a unique corresponding `.wasm` file. If you choose to serve it yourself, please ensure that the `.wasm` file matches the version of the `zxing-wasm` library you are using.

For convenience, this library provides an exported `ZXING_WASM_VERSION` variable to easily determine the resolved version of the `zxing-wasm` you are using:

```ts
import { ZXING_WASM_VERSION } from "zxing-wasm";
```

The SHA-256 hash of the `.wasm` file (in hex format) is also exported as `ZXING_WASM_SHA256`, in case you want to make sure you are serving the exactly same file:

```ts
import { ZXING_WASM_SHA256 } from "zxing-wasm";
```

To acquire the `.wasm` files for customized serving, in addition to finding them by searching in your `node_modules` folder, they can also be downloaded from CDNs like [jsDelivr](https://cdn.jsdelivr.net/npm/zxing-wasm@latest/dist/):

- **`zxing_full.wasm`**:

  ```
  https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/full/zxing_full.wasm
  ```

- **`zxing_reader.wasm`**:

  ```
  https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/reader/zxing_reader.wasm
  ```

- **`zxing_writer.wasm`**:

  ```
  https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/writer/zxing_writer.wasm
  ```

If you want to use this library in a local runtime (node, bun, deno, etc., instead of web) without servers, there're several different ways depending on the runtime APIs and the build tools you may be using, for example:

```ts
import { readFile } from "node:fs/promises";

await prepareZXingModule({
  overrides: {
    wasmBinary: (await readFile("/path/to/the/zxing_reader.wasm"))
      .buffer as ArrayBuffer,
  },
});
```

```ts
import wasmUrl from "./path/to/the/zxing_reader.wasm?url";

await prepareZXingModule({
  locateFile: (path, prefix) => {
    if (path.endsWith(".wasm")) {
      return wasmUrl;
    }
    return prefix + path;
  },
});
```

## About `.wasm` instantiating

The wasm binary won't be fetched or instantiated unless a [read](#readbarcodes) or [write](#writebarcode) function is first called, and will only be instantiated once given the same ([`Object.is`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/is)) [ZXingModuleOverrides](https://zxing-wasm.deno.dev/types/full.ZXingModuleOverrides.html). If you want to manually trigger the download and instantiation of the wasm binary prior to any read or write functions, you can use [`getZXingModule`](https://zxing-wasm.deno.dev/functions/full.getZXingModule). This function will also return a `Promise` that resolves to a [`ZXingModule`](https://zxing-wasm.deno.dev/types/full.ZXingModule).

```ts
import { getZXingModule } from "zxing-wasm";

/**
 * This function will trigger the download and
 * instantiation of the wasm binary immediately
 */
const zxingModulePromise1 = getZXingModule();

const zxingModulePromise2 = getZXingModule();

console.log(zxingModulePromise1 === zxingModulePromise2); // true
```

[`getZXingModule`](https://zxing-wasm.deno.dev/functions/full.getZXingModule) can also optionally accept a [`ZXingModuleOverrides`](https://zxing-wasm.deno.dev/types/full.ZXingModuleOverrides.html) argument.

```ts
import { getZXingModule } from "zxing-wasm";

getZXingModule({
  locateFile: (path, prefix) => {
    if (path.endsWith(".wasm")) {
      return `https://unpkg.com/zxing-wasm@2/dist/full/${path}`;
    }
    return prefix + path;
  },
});
```

## License

MIT
