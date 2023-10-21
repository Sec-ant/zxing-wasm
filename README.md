# @sec-ant/zxing-wasm

[![npm](https://img.shields.io/npm/v/@sec-ant/zxing-wasm)](https://www.npmjs.com/package/@sec-ant/zxing-wasm/v/latest) [![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@sec-ant/zxing-wasm)](https://www.npmjs.com/package/@sec-ant/zxing-wasm/v/latest) [![jsDelivr hits (npm scoped)](https://img.shields.io/jsdelivr/npm/hm/@sec-ant/zxing-wasm?color=%23ff5627)](https://cdn.jsdelivr.net/npm/@sec-ant/zxing-wasm@latest/)

An ES module wrapper of [zxing-wasm-build](https://github.com/Sec-ant/zxing-wasm-build). Read or write barcodes in your browser!

## Build

```bash
git clone https://github.com/Sec-ant/zxing-wasm
cd zxing-wasm
npm i
npm run fetch
npm run build
```

## Install

```
npm i @sec-ant/zxing-wasm
```

## Usage

This package exports 3 subpaths: `full`, `reader` and `writer`. You can choose whichever fits your needs. If you use TypeScript, you should set [`moduleResolution`](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution) to `bundler`, `node16` or `nodenext` in your `tsconfig.json` file to properly resolve the exported module.

### `@sec-ant/zxing-wasm` or `@sec-ant/zxing-wasm/full`

These 2 subpaths include functions to both read and write barcodes. The wasm binary size is ~1.26 MB.

```ts
import {
  readBarcodesFromImageFile,
  readBarcodesFromImageData,
  writeBarcodeToImageFile,
} from "@sec-ant/zxing-wasm";
```

or

```ts
import {
  readBarcodesFromImageFile,
  readBarcodesFromImageData,
  writeBarcodeToImageFile,
} from "@sec-ant/zxing-wasm/full";
```

### `@sec-ant/zxing-wasm/reader`

This subpath only includes functions to read barcodes. The wasm binary size is ~976 KB.

```ts
import {
  readBarcodesFromImageFile,
  readBarcodesFromImageData,
} from "@sec-ant/zxing-wasm/reader";
```

### `@sec-ant/zxing-wasm/writer`

This subpath only includes functions to write barcodes. The wasm binary size is ~383 KB.

```ts
import { writeBarcodeToImageFile } from "@sec-ant/zxing-wasm/writer";
```

### `readBarcodesFromImageFile` and `readBarcodesFromImageData`

These 2 functions are for reading barcodes.

`readBarcodesFromImageFile` accepts an image [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob) or an image [`File`](https://developer.mozilla.org/docs/Web/API/File) as the first input. They're encoded images, e.g. `.png` `.jpg` files.

`readBarcodesFromImageData` accepts an [`ImageData`](https://developer.mozilla.org/docs/Web/API/ImageData) as the first input. They're raw pixels that usually acquired from [`<canvas>`](https://developer.mozilla.org/docs/Web/HTML/Element/canvas) or related APIs.

Both of these 2 functions accepts the same second input: `ZXingReadOptions`:

```ts
interface ZXingReadOptions {
  /* Try harder to find barcodes, default = true */
  tryHarder?: boolean;
  /* An array of barcode formats to detect, default = [] (indicates any format) */
  formats?: readonly ZXingReadInputBarcodeFormat[];
  /* Upper limit of the number of barcodes to be detected, default = 255 (max) */
  maxSymbols?: number;
}
```

The allowed barcode formats to read are:

```ts
type ZXingReadInputBarcodeFormat =
  | "Aztec"
  | "Codabar"
  | "Code128"
  | "Code39"
  | "Code93"
  | "DataBar"
  | "DataBarExpanded"
  | "DataMatrix"
  | "EAN-13"
  | "EAN-8"
  | "ITF"
  | "Linear-Codes"
  | "Matrix-Codes"
  | "MaxiCode"
  | "MicroQRCode"
  | "PDF417"
  | "QRCode"
  | "UPC-A"
  | "UPC-E";
```

The return result of these 2 functions is a `Promise` of an array of `ZXingReadOutput`s:

```ts
interface ZXingReadOutput {
  /* detected barcode format */
  format: ZXingReadOutputBarcodeFormat;
  /* detected barcode text */
  text: string;
  /* detected barcode raw bytes */
  bytes: Uint8Array;
  /* error message (if any) */
  error: string;
  /* detected barcode position:
    {
      bottomLeft:  { x, y },
      bottomRight: { x, y },
      topLeft:     { x, y },
      topLeft:     { x, y }
    }
  */
  position: ZXingPosition;
  /* symbology identifier: https://github.com/zxing-cpp/zxing-cpp/blob/1bb03a85ef9846076fc5068b05646454f7fe6f6f/core/src/Content.h#L24 */
  symbologyIdentifier: string;
  /* error correction code level: L M Q H */
  eccLevel: ZXingReadOutputECCLevel;
  /* QRCode / DataMatrix / Aztec version or size */
  version: string;
  /* orientation of barcode in degree */
  orientation: number;
  /* is the symbol mirrored (currently only supported by QRCode and DataMatrix) */
  isMirrored: boolean;
  /* is the symbol inverted / has reveresed reflectance */
  isInverted: boolean;
}
```

e.g.

```ts
import {
  readBarcodesFromImageFile,
  readBarcodesFromImageData,
  ZXingReadOptions,
} from "@sec-ant/zxing-wasm/reader";

const zxingReadOptions: ZXingReadOptions = {
  tryHarder: true,
  formats: ["QRCode"],
  maxSymbols: 1,
};

/**
 * Read from image file/blob
 */
const imageFile = await fetch(
  "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Hello%20world!",
).then((resp) => resp.blob());

const imageFileReadOutputs = await readBarcodesFromImageFile(
  imageFile,
  zxingReadOptions,
);

console.log(imageFileReadOutputs[0].text); // Hello world!

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

const imageDataReadOutputs = await readBarcodesFromImageData(
  imageData,
  zxingReadOptions,
);

console.log(imageDataReadOutputs[0].text); // Hello world!
```

### `writeBarcodeToImageFile`

There is only 1 function to write barcodes. The first argument of this function is a text string to be encoded and the second argument is a `ZXingWriteOptions`:

```ts
interface ZXingWriteOptions {
  /* barcode format to write
     "DataBar", "DataBarExpanded", "MaxiCode" and "MicroQRCode" are currently not supported
     default = "QRCode" */
  format?: ZXingWriteInputBarcodeFormat;
  /* encoding charset, default = "UTF-8" */
  charset?: ZXingCharacterSet;
  /* barcode margin, default = 10 */
  quietZone?: number;
  /* barcode width, default = 200 */
  width?: number;
  /* barcode height, default = 200 */
  height?: number;
  /* (E)rror (C)orrection (C)apability level, -1 ~ 8, default = -1 (default) */
  eccLevel?: ZXingWriteInputECCLevel;
}
```

The return result of this function is a `Promise` of `ZXingWriteOutput`:

```ts
interface ZXingWriteOutput {
  /* a png image blob, or null */
  image: Blob | null;
  /* the error reason if image is null */
  error: string;
}
```

e.g.

```ts
import { writeBarcodeToImageFile } from "@sec-ant/zxing-wasm/writer";

const writeOutput = await writeBarcodeToImageFile("Hello world!", {
  format: "QRCode",
  charset: "UTF-8",
  quietZone: 5,
  width: 150,
  height: 150,
  eccLevel: 2,
});

console.log(writeOutput.image);
```

## Notes

When using this package, the wasm binary needs to be served along with the JS glue code. In order to provide a smooth dev experience, the wasm binary serve path is automatically assigned the [jsDelivr CDN](https://fastly.jsdelivr.net/npm/@sec-ant/zxing-wasm/) url upon build.

If you would like to change the serve path (to one of your local network hosts or other CDNs), please use `setZXingModuleOverrides` to override the [`locateFile`](https://emscripten.org/docs/api_reference/module.html?highlight=locatefile#Module.locateFile) function in advance. `locateFile` is one of the [Emscripten `Module` attribute hooks](https://emscripten.org/docs/api_reference/module.html?highlight=locatefile#affecting-execution) that can affect the code execution of the `Module` object during its lifecycles.

```ts
import {
  setZXingModuleOverrides,
  writeBarcodeToImageFile,
} from "@sec-ant/zxing-wasm";

// override the locateFile function
setZXingModuleOverrides({
  locateFile: (path, prefix) => {
    if (path.endsWith(".wasm")) {
      return `https://esm.sh/@sec-ant/zxing-wasm/dist/full/${path}`;
    }
    return prefix + path;
  },
});

// call read or write functions afterwards
const writeOutput = await writeBarcodeToImageFile("Hello world!");
```

The wasm binary won't be fetched or instantiated unless a [read](#readbarcodefromimagefile-and-readbarcodefromimagedata) or [write](#writebarcodetoimagefile) function is firstly called, and will only be instantiated once given the same module overrides. So there'll be a cold start in the first function call (or several calls if they appear in a very short period). If you want to manually trigger the download and instantiation of the wasm binary prior to any read or write functions, you can use `getZXingModule`. This function will also return a `Promise` that resolves to a `ZXingModule`.

```ts
import { getZXingModule } from "@sec-ant/zxing-wasm";

/**
 * This function will trigger the download and
 * instantiation of the wasm binary immediately
 */
const zxingModulePromise1 = getZXingModule();

const zxingModulePromise2 = getZXingModule();

console.log(zxingModulePromise1 === zxingModulePromise2); // true
```

`getZXingModule` can also optionally accept a `ZXingModuleOverrides` argument.

```ts
import { getZXingModule } from "@sec-ant/zxing-wasm";

getZXingModule({
  locateFile: (path, prefix) => {
    if (path.endsWith(".wasm")) {
      return `https://esm.sh/@sec-ant/zxing-wasm/dist/full/${path}`;
    }
    return prefix + path;
  },
});
```

## License

MIT
