---
"zxing-wasm": patch
---

Prevent out-of-bounds memory access when decoding very wide images with `tryDenoise` and `tryDownscale` enabled.
