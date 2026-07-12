# Benchmark Summary

> Generated: 2026-03-06T17:01:40.568Z
> Node: v24.12.0
> OS: darwin arm64

## readBarcodes Performance

| Scenario                                           |      mean | median (p50) |       min |       p75 |       p99 | samples |
| :------------------------------------------------- | --------: | -----------: | --------: | --------: | --------: | ------: |
| readBarcodes (default options) / 720p              |  29.58 ms |     29.57 ms |  29.23 ms |  29.64 ms |  30.02 ms |      50 |
| readBarcodes (default options) / 1080p             |  57.08 ms |     56.17 ms |  54.51 ms |  56.63 ms |  77.33 ms |      50 |
| readBarcodes (default options) / 4K                | 188.75 ms |    189.69 ms | 178.89 ms | 190.27 ms | 196.96 ms |      50 |
| readBarcodes (optimized options) / 720p optimized  |   4.06 ms |      4.05 ms |   3.90 ms |   4.09 ms |   4.25 ms |     124 |
| readBarcodes (optimized options) / 1080p optimized |   9.22 ms |      9.21 ms |   9.04 ms |   9.26 ms |   9.46 ms |      55 |
| readBarcodes (optimized options) / 4K optimized    |  37.11 ms |     35.05 ms |  33.68 ms |  36.27 ms |  63.75 ms |      50 |

## WASM Binary Sizes

| Target | Raw (bytes) | Gzip (bytes) |
| :----- | ----------: | -----------: |
| reader |     985,823 |      414,016 |
| writer |     652,500 |      346,040 |
| full   |   1,429,911 |      685,478 |
