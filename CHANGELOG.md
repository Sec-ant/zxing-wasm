# zxing-wasm

## 1.3.4

### Patch Changes

- 1a9a372: Bump `zxing-cpp` to `579650a` to fix incorrect PDF417 position info.

## 1.3.3

### Patch Changes

- 0709489: Bump `zxing-cpp` to `cd9bba3` to fix an ITF detection regression.

## 1.3.2

### Patch Changes

- 4b0ca08: Bump zxing-cpp to [`308f820`](https://github.com/zxing-cpp/zxing-cpp/commit/308f82077dd82979c9df1f82a8ff264dcf0d6371) and improve DataBar detection rate.

## 1.3.1

### Patch Changes

- 999335b: Bump zxing-cpp to [`8fb2f81`](https://github.com/zxing-cpp/zxing-cpp/commit/8fb2f81841de9161c813e6473a0e48f62c2ff2b8) to support shorter ITF symbols.

## 1.3.0

### Minor Changes

- 925e12f: Add reader support for `DataBarLimited`.

## 1.2.15

### Patch Changes

- fa87128: Fix webassembly exception handling. Increase success rate.
- f1eef5c: Bump zxing-cpp to `81407a0` to fix reader options not being passed to the internal reader if `isPure` is set.

## 1.2.14

### Patch Changes

- aad8899: Patch emscripten to mitigate DOM Clobbering vulnerability.

## 1.2.13

### Patch Changes

- 650c295: DOM Clobbering security patch.

## 1.2.12

### Patch Changes

- 2228845: Bump `zxing-cpp` and switch to `pnpm`, `renovate`.

## 1.2.11

### Patch Changes

- d3c92ee:
  - Always use `.js` as the chunk filename extension.
  - Bump zxing-cpp to `986f785`
  - Bump dependencies

## 1.2.10

### Patch Changes

- 0a43b27: Bump zxing-cpp to `d0c1f34`

## 1.2.9

### Patch Changes

- 01e8878: Bump zxing-cpp to `441132c`

## 1.2.8

### Patch Changes

- 2fc9bec: Bump zxing-cpp to 4bbc1db

## 1.2.7

### Patch Changes

- 308d165: Bump zxing-cpp to 9ca0684

## 1.2.6

### Patch Changes

- a2339d3: Bump zxing-cpp to [`b58682b`](https://github.com/zxing-cpp/zxing-cpp/commit/b58682b90ff082cee8d946c73f8852574478fb09).

## 1.2.5

### Patch Changes

- 4358969: Fix WebAssembly instantiation issue in electron.

## 1.2.5-rc.0

### Patch Changes

- 4358969: Fix WebAssembly instantiation issue in electron.

## 1.2.4

### Patch Changes

- f749591: Bump zxing-cpp to `b3aff4a`:

  - Deprecate `validateCode39CheckSum`, `validateITFCheckSum` and `returnCodabarStartEnd`. Related commits from upstream: [`fc8f32d`](https://github.com/zxing-cpp/zxing-cpp/commit/fc8f32d7db00060b3aab24338c08ab792cef0bfd), [`b3fe574`](https://github.com/zxing-cpp/zxing-cpp/commit/b3fe5744b2a0ac554efa70635a087c5ff3342c42), [`d636c6d`](https://github.com/zxing-cpp/zxing-cpp/commit/d636c6d8a054fe5d794e9ed57159a5230ad6ebf5) [`68c97c7`](https://github.com/zxing-cpp/zxing-cpp/commit/68c97c744f2fe1ead3677dd106020530d44d7180), [`2f3c72c`](https://github.com/zxing-cpp/zxing-cpp/commit/2f3c72cccea22a60d41b31c185aba1ea5425d6bb).
  - Reduce WASM binaries size. Related commits from upstream: [`6741403`](https://github.com/zxing-cpp/zxing-cpp/commit/67414033f8cc28d7152c3cdf2bb1562078b03c4f), [`1fa0070`](https://github.com/zxing-cpp/zxing-cpp/commit/1fa0070450437badab7ae6dcb1c1e80d7911d8e7), [`b3aff4a`](https://github.com/zxing-cpp/zxing-cpp/commit/b3aff4a98b03e056a244ca385a8221c50d67e352).
  - Other fixes and improvements from upstream.

## 1.2.3

### Patch Changes

- de36dce: reset zxing-cpp to b152afd

  - `validateITFCheckSum`, `tryCode39ExtendedMode` and `validateCode39CheckSum` are deprecated in [later commits](https://github.com/zxing-cpp/zxing-cpp/commits/master/?since=2024-01-26).

## 1.2.2

### Patch Changes

- 02f0386: Bump zxing-cpp to b3fe574
