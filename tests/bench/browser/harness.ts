/* ------------------------------------------------------------------ */
/*  Simple benchmark harness for browser context                       */
/* ------------------------------------------------------------------ */

export interface BenchResult {
  group: string;
  name: string;
  mean: number;
  min: number;
  max: number;
  p75: number;
  p99: number;
  hz: number;
  samples: number;
}

function percentile(sorted: number[], pct: number): number {
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

export async function benchmark(
  group: string,
  name: string,
  fn: () => Promise<void> | void,
  { warmup = 10, iterations = 50 } = {},
): Promise<BenchResult> {
  // Warmup
  for (let i = 0; i < warmup; i++) await fn();

  // Timed runs
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const mean = sum / times.length;

  return {
    group,
    name,
    mean,
    min: times[0]!,
    max: times[times.length - 1]!,
    p75: percentile(times, 75),
    p99: percentile(times, 99),
    hz: 1000 / mean,
    samples: times.length,
  };
}
