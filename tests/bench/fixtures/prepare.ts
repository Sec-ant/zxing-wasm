/**
 * Generate benchmark test fixtures from the wikipedia QR code sample.
 *
 * Produces PNG/JPEG/BMP/GIF at 720p, 1080p, and 4K resolutions,
 * plus a no-barcode image and a short video clip.
 *
 * Usage: pnpm tsx tests/bench/fixtures/prepare.ts
 */

import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const srcImage = resolve(__dirname, "../../samples/qrcode/wikipedia.png");

const resolutions = [
  { name: "720p", width: 1280, height: 720 },
  { name: "1080p", width: 1920, height: 1080 },
  { name: "4k", width: 3840, height: 2160 },
] as const;

async function generateFixtures() {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  for (const { name, width, height } of resolutions) {
    // QR code size: 40% of smaller dimension, centered
    const qrSize = Math.round(Math.min(width, height) * 0.4);

    // Create white background with centered QR code
    const resizedQr = await sharp(srcImage)
      .resize(qrSize, qrSize, { fit: "fill" })
      .toBuffer();

    const composite = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).composite([
      {
        input: resizedQr,
        left: Math.round((width - qrSize) / 2),
        top: Math.round((height - qrSize) / 2),
      },
    ]);

    // PNG
    const pngPath = resolve(outDir, `qrcode-${name}.png`);
    await composite.clone().png().toFile(pngPath);
    console.log(`  ✓ ${pngPath}`);

    // JPEG
    const jpegPath = resolve(outDir, `qrcode-${name}.jpg`);
    await composite.clone().jpeg({ quality: 85 }).toFile(jpegPath);
    console.log(`  ✓ ${jpegPath}`);

    // BMP - sharp doesn't directly support BMP, use raw + manual header
    // Instead, use TIFF as a lossless alternative that stb_image supports
    // Actually stb_image supports BMP. Let's use raw pixel approach.
    const rawBuf = await composite
      .clone()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const bmpBuf = createBMP(
      rawBuf.data,
      rawBuf.info.width,
      rawBuf.info.height,
      rawBuf.info.channels,
    );
    const bmpPath = resolve(outDir, `qrcode-${name}.bmp`);
    await writeFile(bmpPath, bmpBuf);
    console.log(`  ✓ ${bmpPath}`);

    // GIF - sharp supports GIF output
    const gifPath = resolve(outDir, `qrcode-${name}.gif`);
    await composite.clone().gif().toFile(gifPath);
    console.log(`  ✓ ${gifPath}`);
  }

  // No-barcode image (plain white, 1080p)
  const noBarcodePath = resolve(outDir, "no-barcode-1080p.png");
  await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toFile(noBarcodePath);
  console.log(`  ✓ ${noBarcodePath}`);

  console.log("\nDone! All fixtures generated.");
}

/**
 * Create a BMP file buffer from raw RGB pixel data.
 * Uses 24-bit BMP format (no compression).
 */
function createBMP(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number,
): Buffer {
  const rowSize = Math.ceil((width * 3) / 4) * 4; // rows padded to 4-byte boundary
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize; // 14 (file header) + 40 (info header) + pixel data

  const buf = Buffer.alloc(fileSize);

  // BMP file header (14 bytes)
  buf.write("BM", 0); // signature
  buf.writeUInt32LE(fileSize, 2); // file size
  buf.writeUInt32LE(0, 6); // reserved
  buf.writeUInt32LE(54, 10); // pixel data offset

  // DIB header (BITMAPINFOHEADER, 40 bytes)
  buf.writeUInt32LE(40, 14); // header size
  buf.writeInt32LE(width, 18); // width
  buf.writeInt32LE(-height, 22); // height (negative = top-down)
  buf.writeUInt16LE(1, 26); // color planes
  buf.writeUInt16LE(24, 28); // bits per pixel
  buf.writeUInt32LE(0, 30); // compression (none)
  buf.writeUInt32LE(pixelDataSize, 34); // image size
  buf.writeInt32LE(2835, 38); // x pixels per meter (72 DPI)
  buf.writeInt32LE(2835, 42); // y pixels per meter
  buf.writeUInt32LE(0, 46); // colors in palette
  buf.writeUInt32LE(0, 50); // important colors

  // Pixel data (BMP uses BGR order)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcOffset = (y * width + x) * channels;
      const dstOffset = 54 + y * rowSize + x * 3;
      buf[dstOffset] = pixels[srcOffset + 2]!; // B
      buf[dstOffset + 1] = pixels[srcOffset + 1]!; // G
      buf[dstOffset + 2] = pixels[srcOffset]!; // R
    }
  }

  return buf;
}

generateFixtures().catch((e) => {
  console.error(e);
  process.exit(1);
});
