type _ImageData = typeof globalThis extends { ImageData: unknown }
  ? {}
  : { data: Uint8ClampedArray; width: number; height: number };

interface ImageData extends _ImageData {}
