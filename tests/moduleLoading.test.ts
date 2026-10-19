import { readFile } from "node:fs/promises";
import { afterEach, expect, test, vi } from "vitest";
import { prepareZXingModule, purgeZXingModule } from "../src/reader/index.js";

const bytes = await readFile(
  new URL("../src/reader/zxing_reader.wasm", import.meta.url),
);
const binary = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.byteLength,
);

afterEach(() => {
  purgeZXingModule();
  vi.unstubAllGlobals();
});

test("preInit runs before fetching through the official loader", async () => {
  const events: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      events.push("fetch");
      return new Response(binary, {
        headers: { "Content-Type": "application/wasm" },
      });
    }),
  );
  await prepareZXingModule({
    overrides: {
      locateFile: () => "https://example.test/reader.wasm",
      preInit: [
        () => {
          events.push("preInit");
        },
      ],
      onRuntimeInitialized: () => {
        events.push("ready");
      },
    },
    fireImmediately: true,
  });
  expect(events).toEqual(["preInit", "fetch", "ready"]);
});

test("invalid wasm calls onAbort and rejects", async () => {
  const onAbort = vi.fn();
  const promise = prepareZXingModule({
    overrides: {
      wasmBinary: new Uint8Array([1, 2, 3]).buffer,
      onAbort,
      printErr: () => {},
    },
    fireImmediately: true,
  });
  await expect(promise).rejects.toBeInstanceOf(WebAssembly.RuntimeError);
  expect(onAbort).toHaveBeenCalledOnce();
});

test("official instantiateWasm hook supports asynchronous initialization", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const module = await prepareZXingModule({
    overrides: {
      instantiateWasm(imports, receive) {
        void WebAssembly.instantiate(binary, imports).then(({ instance }) =>
          receive(instance),
        );
        return {};
      },
    },
    fireImmediately: true,
  });
  expect(module.HEAPU8.byteLength).toBeGreaterThan(bytes.length);
  expect(fetch).not.toHaveBeenCalled();
});
