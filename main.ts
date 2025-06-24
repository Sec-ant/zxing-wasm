import {
  type ReaderOptions,
  readBarcodes,
  type WriterOptions,
  writeBarcode,
} from "./src/full/index.js";

const imageFile = await fetch(
  "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Hello%20world!",
).then((resp) => resp.blob());

const readerOptions: ReaderOptions = {
  tryHarder: true,
  formats: ["QRCode"],
  maxNumberOfSymbols: 1,
};

const imageFileReadResults = await readBarcodes(imageFile, readerOptions);

console.log(imageFileReadResults); // Hello world!

const writerOptions: WriterOptions = {
  format: "EAN-13",
  scale: 0,
  withQuietZones: true,
  withHRT: false,
};

console.log(await writeBarcode("12345", writerOptions));
