---
"zxing-wasm": patch
---

- Bump `zxing-cpp` to `559471a`, also bump other deps;
- Bump emscripten to v4.0.7, adjust compiling/linking flags and patch scripts;
- Increase stack size to fix writer issues in #211 and #215 and add tests for them;
