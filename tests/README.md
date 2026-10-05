# Blackbox Test Fixtures

The blackbox suites cover every upstream sample directory containing images
under `zxing-cpp/test/samples`. The consistency test reads the case-sensitive Git
tree and compares it with the configured directories. The only excluded
directory, `databarLtd-1`, contains just `!defaults.toml`; the test asserts that
exact file list so new images cannot be silently excluded. Its lowercase
counterpart, `databarltd-1`, contains images and is covered.

## What is asserted

The snapshot suite tests each image with every configured reader mode and
rotation. It records comparisons with `*.txt`, `*.result.txt`, and `*.bin`
companions in directory summaries and snapshots every returned result.

Entries marked `upstreamContract` use the upstream TOML expectations instead.
They inherit `!defaults.toml`, resolve companion files, and honor upstream
mode, rotation, reader-option, and known-missing settings. Required symbols
are matched individually by format, text, and symbology identifier, including
multiple symbols in one image. The `none-*` datasets assert zero detections.
These assertions are independent of snapshot updates.

The additional YAML fixture is a complete `ReadResult` contract represented in
YAML rather than JSON. It preserves validity, errors, format, text, payload
hashes, all position vertices, rotation and its deprecated orientation alias, flags, structured-append data,
symbol data, and metadata exactly as the previous JSON snapshots did.

The WASM wrapper decodes byte inputs with `stb_image`, which does not support
WebP. Before blackbox decoding, WebP fixtures are therefore rasterized to PNG
with `@napi-rs/canvas`. This supplies zxing-cpp with the same pixels that its
native blackbox runner obtains through libwebp, so a container-format gap
cannot be mistaken for a barcode-reading regression.

For snapshot entries there is one YAML file per input image, plus one directory
summary. This keeps review diffs focused while retaining the full
`(image, mode, rotation)` test matrix.

## Updating after a zxing-cpp change

1. Initialize or update the `zxing-cpp` submodule.
2. Run `pnpm test` and inspect changes caused by new samples or changed decoder
   behavior.
3. If those changes are expected, run `pnpm test --update`.
4. Review and stage the resulting YAML fixtures with the submodule update.

Do not update fixtures solely to hide a failure. Investigate upstream contract
failures against the sample expectations and C++ runner; updating snapshots
does not change those assertions. Add or migrate test entries when upstream
adds, renames, or merges sample directories.
