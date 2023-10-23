import {
  readBarcodesFromImageFile,
  writeBarcodeToImageFile,
} from "./src/full/index";

// import { readBarcodesFromImageFile } from "./src/reader/index";

// import { writeBarcodeToImageFile } from "./src/writer/index";

const text = "Hello World!";
const barcodeImage = (await writeBarcodeToImageFile(text)).image;
if (barcodeImage) {
  const readResults = await readBarcodesFromImageFile(barcodeImage, {
    formats: ["QRCode"],
  });
  console.log(readResults);
  console.log(readResults[0].text === text);
}
