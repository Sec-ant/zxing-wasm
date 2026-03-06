---
"zxing-wasm": patch
---

Improve barcode reading performance by moving RGBA→grayscale conversion to JS; add malloc checks; dedupe writer code; avoid redundant copy.
