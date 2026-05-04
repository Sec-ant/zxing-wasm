---
"zxing-wasm": patch
---

Bump `zxing-cpp` submodule from [`b304f665`](https://github.com/zxing-cpp/zxing-cpp/commit/b304f665) to [`1681c2e7`](https://github.com/zxing-cpp/zxing-cpp/commit/1681c2e7) (43 commits) and refresh dev dependencies.

Notable upstream improvements pulled in:

- **DataMatrix detector**: timing-pattern-based correction for deformed symbols, LocalGrid-based alignment evaluation, better dimension estimation.
- **Aztec detector**: timing-pattern parsing, more forgiving `isTimingPatternCross`, finer LocalGrid adjustment, more robust mode-message parsing.
- **QR detector**: fixes for a `TraceLine` deadlock (#1087) and undefined behavior in `CenterOfRing`; better small-symbol throughput.
- **Crash/UB fixes**: PDF417 heap-buffer-overflows, AZDecoder crash on empty Structured Append, ODCode39 `DecodeCode32` exception, DataBar `out_of_range`.

User-visible effects: one previously undetected Aztec sample (`aztec-2/20.png`) is now decoded across all rotations; corner positions of many barcodes shift by 1–2 pixels and `symbol.data` hashes change accordingly. Decoded `text` and `bytes` are bit-identical for every previously-passing test.
