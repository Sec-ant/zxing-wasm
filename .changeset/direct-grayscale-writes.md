---
"zxing-wasm": patch
---

Reduce temporary memory allocations and speed up `ImageData` decoding by writing grayscale pixels directly into WASM memory.
