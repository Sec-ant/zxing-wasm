#!/usr/bin/env node
/**
 * Convert a Vitest JSON report into Bencher Metric Format (BMF).
 *
 * Vitest emits files → test cases → benchmark groups → tasks. Bencher expects a flat
 * map of `{ "<benchmark name>": { "latency-ms": { value, lower_value, upper_value } } }`.
 *
 * Naming: the Vitest benchmark group's full name is used as the BMF key.
 *
 * Units: vitest reports `mean`/`moe` in **milliseconds** (tinybench convention),
 * so metrics are written to the custom Bencher `latency-ms` measure. This keeps
 * GitHub PR comments readable (`milliseconds (ms)`) instead of using Bencher's
 * built-in `latency` measure, which is labelled `nanoseconds (ns)`.
 *
 * Usage: node scripts/vitest-bench-to-bmf.mjs <input.json> <output.json>
 */
import { readFile, writeFile } from "node:fs/promises";

const LATENCY_MEASURE = "latency-ms";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error(
    "usage: vitest-bench-to-bmf.mjs <vitest-bench.json> <bmf.json>",
  );
  process.exit(1);
}

const raw = JSON.parse(await readFile(inputPath, "utf8"));
const bmf = {};

for (const file of raw.testResults ?? []) {
  for (const testCase of file.assertionResults ?? []) {
    for (const group of testCase.benchmarks ?? []) {
      for (const bench of group.tasks ?? []) {
        const baseKey =
          group.tasks.length === 1
            ? group.name
            : `${group.name} > ${bench.name}`;
        // Guard against duplicate keys: silent overwrite would lose metrics.
        // Group + bench names are unique by construction in this repo, but
        // append " (n)" if that ever stops being true.
        let key = baseKey;
        for (let n = 1; Object.hasOwn(bmf, key); n++) {
          key = `${baseKey} (${n})`;
        }
        // mean ± moe gives Bencher a confidence interval for its t-test
        // threshold. A zero-width interval is used if moe is missing.
        const value = bench.latency.mean;
        const moe = bench.latency.moe ?? 0;
        bmf[key] = {
          [LATENCY_MEASURE]: {
            value,
            lower_value: Math.max(0, value - moe),
            upper_value: value + moe,
          },
        };
      }
    }
  }
}

await writeFile(outputPath, `${JSON.stringify(bmf, null, 2)}\n`);
console.log(
  `Wrote ${Object.keys(bmf).length} benchmark(s) in BMF format → ${outputPath}`,
);
