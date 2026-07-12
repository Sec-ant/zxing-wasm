# zxing-wasm

pnpm workspace repository for the published [zxing-wasm](./packages/zxing-wasm) WebAssembly barcode library, its API documentation toolchain, and local demo applications.

## Workspace layout

| Path                                           | Purpose                                                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| [`packages/zxing-wasm`](./packages/zxing-wasm) | Public npm package, native source, tests, benchmarks, and WASM build        |
| [`apps/demo`](./apps/demo)                     | Private Vite demo consuming the published package API through `workspace:*` |
| [`tooling/typedoc`](./tooling/typedoc)         | Private TypeDoc toolchain using TypeScript 6                                |
| [`tooling/tsconfig`](./tooling/tsconfig)       | Shared TypeScript compiler configuration                                    |
| [`vendor/zxing-cpp`](./vendor/zxing-cpp)       | Pinned ZXing-C++ git submodule                                              |

## Development

```bash
git clone --recurse-submodules https://github.com/Sec-ant/zxing-wasm
cd zxing-wasm
pnpm install --frozen-lockfile
```

`pnpm build` builds the published package and API documentation. `pnpm build:all` additionally initializes the submodule and compiles the three WASM targets, which requires CMake and Emscripten 5.0.4.

```bash
pnpm check
pnpm build
pnpm build:all
pnpm test
pnpm demo:dev
pnpm demo:build
pnpm docs:build
```

Generated API documentation is written to `artifacts/docs`. See the [package README](./packages/zxing-wasm/README.md) for consumer API usage, supported formats, and publishing details.
