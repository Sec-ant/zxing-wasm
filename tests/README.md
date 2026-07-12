# Blackbox Test Fixtures

The blackbox suite mirrors the sample directories exercised by
`zxing-cpp/test/blackbox/BlackboxTestRunner.cpp`.

## What is asserted

Each upstream image is tested independently with every configured reader mode
and rotation. Its `*.txt`, `*.result.txt`, and `*.bin` companions are compared
using the same format, text, and binary rules as zxing-cpp. The suite also
parses `BlackboxTestRunner.cpp` and asserts the upstream minimum-pass and
maximum-misread threshold for every `(directory, mode, rotation)` combination.

The additional YAML fixture is a complete `ReadResult` contract represented in
YAML rather than JSON. It preserves validity, errors, format, text, payload
hashes, all position vertices, orientation, flags, structured-append data,
symbol data, and metadata exactly as the previous JSON snapshots did.

The WASM wrapper decodes byte inputs with `stb_image`, which does not support
WebP. Before blackbox decoding, WebP fixtures are therefore rasterized to PNG
with `@napi-rs/canvas`. This supplies zxing-cpp with the same pixels that its
native blackbox runner obtains through libwebp, so a container-format gap
cannot be mistaken for a barcode-reading regression.

There is one YAML file per input image, plus one summary fixture for each
upstream sample directory. This keeps review diffs focused while retaining the
full `(image, mode, rotation)` test matrix.

## Updating after a zxing-cpp change

1. Initialize or update the `zxing-cpp` submodule.
2. Run `pnpm test` and inspect changes caused by new samples or changed decoder
   behavior.
3. If those changes are expected, run `pnpm test --update`.
4. Review and stage the resulting YAML fixtures with the submodule update.

Do not update fixtures solely to hide a failure. The direct upstream companion
file assertions and upstream threshold checks are the primary correctness gate.
