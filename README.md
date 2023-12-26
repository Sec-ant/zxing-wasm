# zxing-wasm

[![npm](https://img.shields.io/npm/v/zxing-wasm)](https://www.npmjs.com/package/zxing-wasm/v/latest) [![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/zxing-wasm)](https://www.npmjs.com/package/zxing-wasm/v/latest) [![jsDelivr hits (npm scoped)](https://img.shields.io/jsdelivr/npm/hm/zxing-wasm?color=%23ff5627)](https://cdn.jsdelivr.net/npm/zxing-wasm@latest/) [![Netlify Status](https://api.netlify.com/api/v1/badges/743dfd74-1572-49fb-a758-c1840e174366/deploy-status?branch=main)](https://app.netlify.com/sites/zxing-wasm/deploys)

[ZXing-C++](https://github.com/zxing-cpp/zxing-cpp) WebAssembly as an ES/CJS module with types. Read or write barcodes in various JS runtimes: web, node, bun and deno.

Visit [this online demo](https://zxing-wasm-demo.netlify.app/) to quickly explore its basic functions. It works best on the latest chromium browsers.

## Build

```bash
git clone --recurse-submodules https://github.com/Sec-ant/zxing-wasm
cd zxing-wasm
npm i
# install cmake first:
# https://cmake.org/download/
npm run cmake
# install emscripten first:
# https://emscripten.org/docs/getting_started/downloads.html
npm run build:wasm
npm run build
```

## Install

```
npm i zxing-wasm
```

## Documentation

https://zxing-wasm.netlify.app/

## Demo

Demo page: https://zxing-wasm-demo.netlify.app/

Demo source: https://github.com/Sec-ant/zxing-wasm-demo

## Usage

This package exports 3 subpaths: `full`, `reader` and `writer`. You can choose whichever fits your needs. If you use TypeScript, you should set [`moduleResolution`](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution) to [`bundler`](https://www.typescriptlang.org/docs/handbook/modules/reference.html#bundler), [`node16` or `nodenext`](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext-1) in your `tsconfig.json` file to properly resolve the exported module.

### `zxing-wasm` or `zxing-wasm/full`

These 2 subpaths include functions to both read and write barcodes. The wasm binary size is ~1.17 MB.

```ts
import {
  readBarcodesFromImageFile,
  readBarcodesFromImageData,
  writeBarcodeToImageFile,
} from "zxing-wasm";
```

or

```ts
import {
  readBarcodesFromImageFile,
  readBarcodesFromImageData,
  writeBarcodeToImageFile,
} from "zxing-wasm/full";
```

### `zxing-wasm/reader`

This subpath only includes functions to read barcodes. The wasm binary size is ~930 KB.

```ts
import {
  readBarcodesFromImageFile,
  readBarcodesFromImageData,
} from "zxing-wasm/reader";
```

### `zxing-wasm/writer`

This subpath only includes a function to write barcodes. The wasm binary size is ~330 KB.

```ts
import { writeBarcodeToImageFile } from "zxing-wasm/writer";
```

### IIFE Scripts

Apart from ES and CJS modules, this package also ships IIFE scripts. The registered global variable is named `ZXingWASM`.

```html
<!-- full -->
<script src="https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/iife/full/index.js"></script>

<!-- reader -->
<script src="https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/iife/reader/index.js"></script>

<!-- writer -->
<script src="https://cdn.jsdelivr.net/npm/zxing-wasm@<version>/dist/iife/writer/index.js"></script>
```

### [`readBarcodesFromImageFile`](https://zxing-wasm.netlify.app/functions/full.readBarcodesFromImageFile.html) and [`readBarcodesFromImageData`](https://zxing-wasm.netlify.app/functions/full.readBarcodesFromImageData.html)

These 2 functions are for reading barcodes.

[`readBarcodesFromImageFile`](https://zxing-wasm.netlify.app/functions/full.readBarcodesFromImageFile.html) accepts an image [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob) or an image [`File`](https://developer.mozilla.org/docs/Web/API/File) as the first input. They're encoded images, e.g. `.png` `.jpg` files.

[`readBarcodesFromImageData`](https://zxing-wasm.netlify.app/functions/full.readBarcodesFromImageData.html) accepts an [`ImageData`](https://developer.mozilla.org/docs/Web/API/ImageData) as the first input. They're raw pixels that usually acquired from [`<canvas>`](https://developer.mozilla.org/docs/Web/HTML/Element/canvas) or related APIs.

Both of these 2 functions optionally accept the same second input: [`ReaderOptions`](https://zxing-wasm.netlify.app/interfaces/full.ReaderOptions.html).

The return result of these 2 functions is a `Promise` of an array of [`ReadResult`](https://zxing-wasm.netlify.app/interfaces/full.ReadResult.html)s.

e.g.

```ts
import {
  readBarcodesFromImageFile,
  readBarcodesFromImageData,
  type ReaderOptions,
} from "zxing-wasm/reader";

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

const imageFileReadResults = await readBarcodesFromImageFile(
  imageFile,
  readerOptions,
);

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

const imageDataReadResults = await readBarcodesFromImageData(
  imageData,
  readerOptions,
);

console.log(imageDataReadResults[0].text); // Hello world!
```

### [`writeBarcodeToImageFile`](https://zxing-wasm.netlify.app/functions/full.writeBarcodeToImageFile.html)

This function is used to write barcodes. The first argument of this function is a text string to be encoded and the optional second argument is an [`WriterOptions`](https://zxing-wasm.netlify.app/interfaces/full.WriterOptions.html).

The return result of this function is a `Promise` of a [`WriteResult`](https://zxing-wasm.netlify.app/interfaces/full.WriteResult.html).

e.g.

```ts
import { writeBarcodeToImageFile, type WriterOptions } from "zxing-wasm/writer";

const writerOptions: WriterOptions = {
  format: "QRCode",
  width: 150,
  height: 150,
  margin: 10,
  eccLevel: 2,
};

const writeOutput = await writeBarcodeToImageFile(
  "Hello world!",
  writerOptions,
);

console.log(writeOutput.image);
```

## Notes

When using this package, the `.wasm` binary needs to be served along with the JS glue code. In order to provide a smooth dev experience, the serve path is automatically assigned the [jsDelivr CDN](https://fastly.jsdelivr.net/npm/zxing-wasm/) url upon build.

If you would like to change the serve path (to one of your local network hosts, some other CDNs, or just Base64 encoded data URIs), please use [`setZXingModuleOverrides`](https://zxing-wasm.netlify.app/functions/full.setZXingModuleOverrides.html) to override the [`locateFile`](https://emscripten.org/docs/api_reference/module.html?highlight=locatefile#Module.locateFile) function in advance. `locateFile` is one of the [Emscripten `Module` attribute hooks](https://emscripten.org/docs/api_reference/module.html?highlight=locatefile#affecting-execution) that can affect the code execution of the `Module` object during its lifecycles.

e.g.

```ts
import { setZXingModuleOverrides, writeBarcodeToImageFile } from "zxing-wasm";

// override the locateFile function
setZXingModuleOverrides({
  locateFile: (path, prefix) => {
    if (path.endsWith(".wasm")) {
      return `https://unpkg.com/zxing-wasm@1/dist/full/${path}`;
    }
    return prefix + path;
  },
});

// call read or write functions afterwards
const writeOutput = await writeBarcodeToImageFile("Hello world!");
```

The wasm binary won't be fetched or instantiated unless a [read](#readbarcodesfromimagefile-and-readbarcodesfromimagedata) or [write](#writebarcodetoimagefile) function is firstly called, and will only be instantiated once given the same ([`Object.is`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/is)) [ZXingModuleOverrides](https://zxing-wasm.netlify.app/types/full.ZXingModuleOverrides). If you want to manually trigger the download and instantiation of the wasm binary prior to any read or write functions, you can use [`getZXingModule`](https://zxing-wasm.netlify.app/functions/full.getZXingModule). This function will also return a `Promise` that resolves to a [`ZXingModule`](https://zxing-wasm.netlify.app/types/full.ZXingModule).

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

[`getZXingModule`](https://zxing-wasm.netlify.app/functions/full.getZXingModule) can also optionally accept a [`ZXingModuleOverrides`](https://zxing-wasm.netlify.app/types/full.ZXingModuleOverrides.html) argument.

```ts
import { getZXingModule } from "zxing-wasm";

getZXingModule({
  locateFile: (path, prefix) => {
    if (path.endsWith(".wasm")) {
      return `https://unpkg.com/zxing-wasm@1/dist/full/${path}`;
    }
    return prefix + path;
  },
});
```

## License

MIT
