import { beforeAll, describe, test } from "vitest";
import { rgbaToGrayscale } from "../../../src/grayscale.js";

// Compare direct WASM writes with the previous temporary-array and copy path.
function temporaryGrayscale(data: Uint8ClampedArray) {
  const luminance = new Uint8Array(data.length / 4);
  for (let i = 0; i < luminance.length; i++) {
    const offset = i * 4;
    luminance[i] =
      (306 * data[offset]! +
        601 * data[offset + 1]! +
        117 * data[offset + 2]! +
        512) >>
      10;
  }
  return luminance;
}

for (const [name, width, height] of [
  ["720p", 1280, 720],
  ["1080p", 1920, 1080],
] as const) {
  describe(name, () => {
    let rgba: Uint8ClampedArray;
    let destination: Uint8Array;
    beforeAll(() => {
      rgba = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < rgba.length; i++) rgba[i] = (i * 37 + (i >> 5)) & 255;
      const memory = new WebAssembly.Memory({
        initial: Math.ceil((width * height) / 65536),
      });
      destination = new Uint8Array(memory.buffer, 0, width * height);
    });
    test("temporary array and heap copy", async ({ bench }) => {
      await bench("temporary array and heap copy", () => {
        destination.set(temporaryGrayscale(rgba));
      }).run({ iterations: 100, warmupIterations: 20 });
    });
    test("direct heap write", async ({ bench }) => {
      await bench("direct heap write", () => {
        rgbaToGrayscale(rgba, destination);
      }).run({ iterations: 100, warmupIterations: 20 });
    });
  });
}
