import {
  readBarcodesFromImageFile,
  writeBarcodeToImageFile,
} from "./src/full/index";

const text = "Hello World!+++";
const barcodeImage = (await writeBarcodeToImageFile(text)).image;
console.log(barcodeImage);
if (barcodeImage) {
  const readResults = await readBarcodesFromImageFile(barcodeImage, {
    formats: ["QRCode"],
  });
  console.log(readResults);
  console.log(readResults[0].text === text);
}
