/** @internal Converts RGBA to luminance using ZXing-C++'s RGBToLum formula. */
export function rgbaToGrayscale(data: Uint8ClampedArray, lum: Uint8Array) {
  const pixelCount = data.byteLength >> 2;
  // Bounded inner loops avoid a long-running V8 tiering slowdown observed
  // with a single frame-sized loop writing into WebAssembly memory.
  for (let start = 0; start < pixelCount; start += 1024) {
    const end = Math.min(start + 1024, pixelCount);
    for (let i = start; i < end; i++) {
      const offset = i << 2;
      lum[i] =
        (306 * data[offset]! +
          601 * data[offset + 1]! +
          117 * data[offset + 2]! +
          0x200) >>
        10;
    }
  }
}
