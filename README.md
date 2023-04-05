# @sec-ant/zxing-wasm

An ES6 module wrapper of [zxing-wasm-build](https://github.com/Sec-ant/zxing-wasm-build).

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

This package exports 3 subpaths: full, reader and writer. You can choose whichever fits your needs. However, bear in mind that [subpath imports needs a `moduleResolution` of `node16` or `nodenext` in your `tsconfig.json` file](https://github.com/microsoft/TypeScript/issues/44848#issuecomment-1212826554).

### `@sec-ant/zxing-wasm` or `@sec-ant/zxing-wasm/full`

These imports includes functions to both read and write barcodes. The wasm binary size is ~1.25 MB.

```ts
import {
  readBarcodeFromImageFile,
  readBarcodeFromImageData,
  writeBarcodeToImageFile,
} from "@sec-ant/zxing-wasm";
```

or

```ts
import {
  readBarcodeFromImageFile,
  readBarcodeFromImageData,
  writeBarcodeToImageFile,
} from "@sec-ant/zxing-wasm/full";
```

### `@sec-ant/zxing-wasm/reader`

This subpath only includes functions to read barcodes. The wasm binary size is ~948 KB.

```ts
import {
  readBarcodeFromImageFile,
  readBarcodeFromImageData,
} from "@sec-ant/zxing-wasm/reader";
```

### `@sec-ant/zxing-wasm/writer`

This subpath only includes functions to write barcodes. The wasm binary size is ~392 KB.

```ts
import { writeBarcodeToImageFile } from "@sec-ant/zxing-wasm/writer";
```

### `readBarcodeFromImageFile` and `readBarcodeFromImageData`

These are 2 functions to read barcodes.

`readBarcodeFromImageFile` accepts an image [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob) or an image [`File`](https://developer.mozilla.org/docs/Web/API/File) as the first input. They're encoded images, e.g. `.png` `.jpg` files.

`readBarcodeFromImageData` accepts an [`ImageData`](https://developer.mozilla.org/docs/Web/API/ImageData) as the first input. They're raw pixels that usually acquired from [`<canvas>`](https://developer.mozilla.org/docs/Web/HTML/Element/canvas) or related APIs.

Both of these 2 functions accepts the same second input: `ZXingReadOptions`:

```ts
interface ZXingReadOptions {
  /* Try better to find barcodes, default = true */
  tryHarder?: boolean;
  /* An array of barcode formats to detect, default = [] (indicates any format) */
  formats?: readonly ZXingReadInputBarcodeFormat[];
  /* Upper limit of the number of barcodes to be detected, default = Infinite */
  maxNumberOfSymbols?: number;
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

The return result of these 2 functions is a `Promise` of an array of `ZXingReadOutput`:

```ts
interface ZXingReadOutput {
  /* detected barcode format */
  format: ZXingReadOutputBarcodeFormat;
  /* detected barcode text */
  text: string;
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
}
```

e.g.

```ts
import {
  readBarcodeFromImageFile,
  readBarcodeFromImageData,
  ZXingReadOptions,
} from "@sec-ant/zxing-wasm/reader";

const zxingReadOptions: ZXingReadOptions = {
  tryHarder: true,
  formats: ["QRCode"],
  maxNumberOfSymbols: 1,
};

/**
 * Read from image file/blob
 */
const imageFile = await fetch(
  "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Hello%20world!"
).then((resp) => resp.blob());

const imageFileReadOutputs = await readBarcodeFromImageFile(
  imageFile,
  zxingReadOptions
);

console.log(imageFileReadOutputs[0].text); // Hello world!

/**
 * Read from image data
 */
const imageData = await createImageBitmap(imageFile).then((imageBitmap) => {
  const { width, height } = imageBitmap;
  const context = new OffscreenCanvas(width, height).getContext(
    "2d"
  ) as OffscreenCanvasRenderingContext2D;
  context.drawImage(imageBitmap, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
});

const imageDataReadOutputs = await readBarcodeFromImageData(
  imageData,
  zxingReadOptions
);

console.log(imageDataReadOutputs[0].text); // Hello world!
```

### `writeBarcodeToImageFile`

There is currently only 1 function to write barcodes. The first argument of this function is a text string to be encoded and the second argument is a `ZXingWriteOptions`:

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
  eccLevel?: ZXingECCLevel;
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

When using this package, the wasm binary needs to be served along with the JS glue code. In order to provide a smooth dev experience, the wasm binary serve path is automatically assigned the [jsDelivr CDN](https://cdn.jsdelivr.net/npm/@sec-ant/zxing-wasm@latest/) url upon build.

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

The wasm binary won't be fetched or instantiated unless a [read](#readbarcodefromimagefile-and-readbarcodefromimagedata) or [write](#writebarcodetoimagefile) function is firstly called, and will only be instantiated once given the same module overrides. So there'll be a cold start in the first function call (or several calls if they appear in a very short period). If you want to manully trigger the download and instantiation of the wasm binary prior to any read or write functions, you can use `getZXingModule`. This function will also return a `Promise` that resolves to a `ZXingModule`, the wasm `Module` object this wrapper library is built upon.

```ts
import { getZXingModule } from "@sec-ant/zxing-wasm";

/**
 * This function will trigger the download and
 * instantiation of the wasm binary immediately
 */
zxingModulePromise1 = getZXingModule();

zxingModulePromise2 = getZXingModule();

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
