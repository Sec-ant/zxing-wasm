---
"zxing-wasm": patch
---

Fix WASM memory leaks by releasing C++ result vectors after `readBarcodes` finishes, including when result conversion throws.
