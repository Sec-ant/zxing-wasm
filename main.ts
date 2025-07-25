///<reference types="vite/client"/>

import {
  type ReaderOptions,
  readBarcodes,
  type WriterOptions,
  writeBarcode,
} from "./src/full/index.js";

import img from "./tests/samples/qrcode/wikipedia.png?url";

const imageFile = await fetch(img).then((resp) => resp.blob());

const readerOptions: ReaderOptions = {
  tryHarder: true,
  formats: ["QRCode"],
  maxNumberOfSymbols: 1,
};

const imageFileReadResults = await readBarcodes(imageFile, readerOptions);

console.log(imageFileReadResults); // Hello world!

const writerOptions: WriterOptions = {
  format: "DataMatrix",
  options: "forceSquare",
};

console.log(await writeBarcode("AB12-CD3-E4", writerOptions));
