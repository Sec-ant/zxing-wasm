---
"zxing-wasm": patch
---

Fix unexpected `new URL(..., import.meta.url)` expansion when bundling this package on the consumer side.
