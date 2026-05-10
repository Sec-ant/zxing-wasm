#!/usr/bin/env node
/**
 * Convert a vitest --outputJson bench report into Bencher Metric Format (BMF).
 *
 * Vitest emits a tree of files → groups → benchmarks. Bencher expects a flat
 * map of `{ "<benchmark name>": { "latency": { value, lower_value, upper_value } } }`.
 *
 * Naming: we use `<group label> > <benchmark name>` as the BMF key. The file
 * path prefix is stripped from the group's fullName since it adds noise without
 * helping disambiguate (group labels are already unique across files in this
 * repo). Units stay in milliseconds — Bencher is unit-agnostic and the
 * dashboard scaling works fine with ms.
 *
 * Usage: node scripts/vitest-bench-to-bmf.mjs <input.json> <output.json>
 */
import { readFile, writeFile } from "node:fs/promises";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error(
    "usage: vitest-bench-to-bmf.mjs <vitest-bench.json> <bmf.json>",
  );
  process.exit(1);
}

const raw = JSON.parse(await readFile(inputPath, "utf8"));
const bmf = {};

for (const file of raw.files ?? []) {
  for (const group of file.groups ?? []) {
    // Strip leading "<filepath> > " from fullName so the benchmark key stays
    // stable across local runs and CI runs (where absolute paths differ).
    const groupLabel = group.fullName.includes(" > ")
      ? group.fullName.slice(group.fullName.indexOf(" > ") + 3)
      : group.fullName;

    for (const bench of group.benchmarks ?? []) {
      const key = `${groupLabel} > ${bench.name}`;
      // mean ± moe gives Bencher a confidence interval for its t-test
      // threshold. Falls back to min/max if moe is missing.
      const value = bench.mean;
      const moe = bench.moe ?? 0;
      bmf[key] = {
        latency: {
          value,
          lower_value: Math.max(0, value - moe),
          upper_value: value + moe,
        },
      };
    }
  }
}

await writeFile(outputPath, `${JSON.stringify(bmf, null, 2)}\n`);
console.log(
  `Wrote ${Object.keys(bmf).length} benchmark(s) in BMF format → ${outputPath}`,
);
