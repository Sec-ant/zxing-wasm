/**
 * Browser benchmark driver — Playwright + Vite dev server orchestrator.
 *
 * Usage: pnpm tsx tests/bench/browser/driver.ts
 *
 * 1. Starts a Vite dev server (reusing the project's vite.config.ts)
 * 2. Launches headless Chromium via Playwright
 * 3. Navigates to the bench page
 * 4. Waits for benchmarks to complete
 * 5. Collects and prints formatted results
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer, type ViteDevServer } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../..");

interface BenchResult {
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

async function main() {
  let server: ViteDevServer | undefined;

  try {
    // 1. Start Vite dev server
    console.log("Starting Vite dev server...");
    server = await createServer({
      root: projectRoot,
      configFile: resolve(projectRoot, "vite.config.ts"),
      server: {
        port: 0, // auto-pick available port
        strictPort: false,
      },
      logLevel: "warn",
    });
    await server.listen();
    const address = server.httpServer?.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to get Vite dev server address");
    }
    const baseUrl = `http://localhost:${address.port}`;
    console.log(`Vite dev server running at ${baseUrl}`);

    // 2. Launch Chromium
    console.log("Launching Chromium...");
    const browser = await chromium.launch({
      headless: true,
      args: ["--disable-gpu", "--no-sandbox", "--disable-setuid-sandbox"],
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Forward console messages
    page.on("console", (msg) => {
      const type = msg.type();
      if (type === "log" || type === "info") {
        console.log(`  [browser] ${msg.text()}`);
      } else if (type === "error" || type === "warning") {
        console.error(`  [browser:${type}] ${msg.text()}`);
      }
    });

    // Forward page errors
    page.on("pageerror", (err) => {
      console.error(`  [browser:pageerror] ${err.message}`);
    });

    // 3. Navigate to bench page
    const benchUrl = `${baseUrl}/tests/bench/browser/bench.html`;
    console.log(`Navigating to ${benchUrl}`);
    await page.goto(benchUrl, { waitUntil: "domcontentloaded" });

    // 4. Wait for benchmarks to complete (timeout: 10 minutes)
    console.log("Waiting for benchmarks to complete (timeout: 10m)...\n");
    await page.waitForFunction(
      () => (window as any).__BENCH_DONE__ === true,
      undefined,
      { timeout: 600_000, polling: 1000 },
    );

    // 5. Collect results
    const error = await page.evaluate(() => (window as any).__BENCH_ERROR__);
    if (error) {
      console.error(`\nBenchmark error: ${error}`);
      process.exit(1);
    }

    const results: BenchResult[] = await page.evaluate(
      () => (window as any).__BENCH_RESULTS__,
    );

    // 6. Print formatted results
    console.log("\n" + "=".repeat(90));
    console.log("BROWSER BENCHMARK RESULTS");
    console.log("=".repeat(90));

    // Group results
    const groups = new Map<string, BenchResult[]>();
    for (const r of results) {
      if (!groups.has(r.group)) groups.set(r.group, []);
      groups.get(r.group)!.push(r);
    }

    for (const [group, items] of groups) {
      console.log(`\n${group}`);
      console.log("-".repeat(80));
      console.log(
        `${"Name".padEnd(44)} ${"Mean".padStart(10)} ${"Min".padStart(10)} ${"P75".padStart(10)} ${"P99".padStart(10)}`,
      );
      console.log("-".repeat(80));
      for (const r of items) {
        console.log(
          `${r.name.padEnd(44)} ${fmt(r.mean).padStart(10)} ${fmt(r.min).padStart(10)} ${fmt(r.p75).padStart(10)} ${fmt(r.p99).padStart(10)}`,
        );
      }
    }

    console.log("\n" + "=".repeat(90));
    console.log(`Total: ${results.length} benchmarks completed.\n`);

    // 7. Also output JSON for programmatic consumption
    const jsonPath = resolve(__dirname, "results.json");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(jsonPath, JSON.stringify(results, null, 2));
    console.log(`JSON results saved to ${jsonPath}`);

    // Cleanup
    await browser.close();
  } catch (err) {
    console.error("Driver error:", err);
    process.exit(1);
  } finally {
    if (server) {
      await server.close();
    }
  }
}

function fmt(ms: number): string {
  if (ms < 0.01) return `${(ms * 1000).toFixed(1)} µs`;
  if (ms < 1) return `${ms.toFixed(3)} ms`;
  return `${ms.toFixed(2)} ms`;
}

main();
