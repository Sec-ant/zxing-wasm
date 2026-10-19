import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { runInNewContext } from "node:vm";
import { describe, expect, test, vi } from "vitest";
import type * as ZXing from "../src/full/index.js";

// These tests exercise built packages and require Node.js, Bun and Deno.
describe.runIf(process.env.ZXING_TEST_RUNTIME)("package runtimes", () => {
  test.each(["node", "bun", "deno"])(
    "%s loads ESM and CJS packages",
    async (runtime) => {
      const fixture = fileURLToPath(
        new URL("fixtures/runtime.mjs", import.meta.url),
      );
      const args = runtime === "deno" ? ["run", "-A", fixture] : [fixture];
      const { stdout } = await promisify(execFile)(runtime, args, {
        timeout: 30_000,
      });
      const results = JSON.parse(stdout) as Array<{
        format: string;
        mode: string;
        texts: string[];
        error: string;
        imageSize: number;
        width: number;
      }>;
      expect(results).toHaveLength(14);
      for (const result of results) {
        expect(result.texts, `${result.format}: ${result.mode}`).toEqual([
          "http://en.m.wikipedia.org",
        ]);
        expect(result.error).toBe("");
        expect(result.imageSize).toBeGreaterThan(0);
        expect(result.width).toBeGreaterThan(0);
      }
    },
    35_000,
  );

  test("Mini Program initializes through WXWebAssembly and reads/writes", async () => {
    const bytes = await readFile(
      new URL("../src/full/zxing_full.wasm", import.meta.url),
    );
    const module = { exports: {} as typeof ZXing };
    const instantiate = vi.fn(
      async (_path: string, imports: WebAssembly.Imports) =>
        WebAssembly.instantiate(bytes, imports),
    );
    runInNewContext(
      await readFile(
        new URL("../dist/miniprogram/index.js", import.meta.url),
        "utf8",
      ),
      {
        module,
        exports: module.exports,
        WXWebAssembly: Object.assign(Object.create(WebAssembly), {
          instantiate,
        }),
        WebAssembly: undefined,
        Blob: undefined,
        fetch: undefined,
        console,
      },
    );
    const api = module.exports;
    await api.prepareZXingModule({
      overrides: {
        instantiateWasm(imports, receive) {
          void instantiate("zxing_full.wasm", imports).then(({ instance }) =>
            receive(instance),
          );
          return {};
        },
      },
      fireImmediately: true,
    });
    const image = await readFile(
      new URL("samples/qrcode/wikipedia.png", import.meta.url),
    );
    expect((await api.readBarcodes(image)).map(({ text }) => text)).toEqual([
      "http://en.m.wikipedia.org",
    ]);
    const result = await api.writeBarcode("runtime test", { format: "QRCode" });
    expect(result.error).toBe("");
    expect(result.image!.size).toBeGreaterThan(0);
    expect(result.symbol!.width).toBeGreaterThan(0);
    expect(instantiate).toHaveBeenCalledExactlyOnceWith(
      "zxing_full.wasm",
      expect.any(Object),
    );
    api.purgeZXingModule();
  });
});
