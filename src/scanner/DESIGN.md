# `zxing-wasm/scanner` — Technical Design

## Overview

A framework-agnostic barcode scanning API built on **async generators** (pull model). Exposed as the `zxing-wasm/scanner` ESM-only subpath export.

The core insight: a scan loop is fundamentally a **sequence of frames that arrive over time** — exactly what async iteration was designed for. Instead of a push-based loop with callbacks, the consumer pulls results at their own pace via `for await...of`. Backpressure is inherent: if the consumer is slow, scanning slows down. If the consumer `break`s, scanning stops and resources clean up automatically via the generator's `finally` block.

### Relationship with `zxing-wasm/react`

`scanner/` is the lower-level, framework-agnostic primitive. `react/` becomes a thin consumer:

```
zxing-wasm/scanner    — async generator API (no framework dependency)
  ↑
zxing-wasm/react      — React hook wrapping scanner/ with lifecycle management
```

Shared DOM utilities (type guards, canvas creation, dimension extraction) live in `scanner/` and are imported by `react/`.

## API Surface

```ts
import { frames, scan } from "zxing-wasm/scanner";
```

### `frames` — Low-level frame source

```ts
function frames(
  element: ScannerElement,
  options?: FramesOptions,
): AsyncGenerator<ImageData>;
```

Yields `ImageData` from a DOM element, one per visual frame. Handles rAF/rVFC scheduling, video readyState, and pixel extraction internally. Consumer calls `readBarcodes` (or any custom decode) themselves.

Errors from pixel extraction (e.g. SecurityError on tainted canvas) **propagate** — the generator stops. These are persistent errors that won't resolve by retrying.

#### `FramesOptions`

| Option   | Type          | Description                                                         |
| -------- | ------------- | ------------------------------------------------------------------- |
| `signal` | `AbortSignal` | Cancels the generator. Rejects the internal frame wait immediately. |

### `scan` — High-level scan stream

```ts
function scan(
  element: ScannerElement,
  options?: ScanOptions,
): AsyncGenerator<ReadResult[]>;
```

Composes `frames()` with `readBarcodes()` (or Worker decode). Yields `ReadResult[]` per frame — including empty arrays when no barcode is found. Each `yield` corresponds to one processed frame.

Decode errors are **non-fatal**: caught internally, reported via `onError`, and the generator continues to the next frame. Pixel extraction errors from the underlying `frames()` generator **propagate** (fatal).

#### `ScanOptions`

| Option          | Type                       | Description                                                                                  |
| --------------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| `readerOptions` | `ReaderOptions`            | Barcode reader config. Fixed for the lifetime of the generator.                              |
| `wasmBinary`    | `ArrayBuffer`              | Pre-fetched WASM binary. Transferred to Worker (detached) or passed to `prepareZXingModule`. |
| `worker`        | `boolean \| string`        | `undefined`/`false`: main thread. `true`: shared Worker. `string`: keyed Worker.             |
| `signal`        | `AbortSignal`              | Cancels the generator. Passed through to `frames()`.                                         |
| `onError`       | `(error: unknown) => void` | Called on non-fatal decode errors. Without this, decode errors are silently swallowed.       |

### Exported utilities

| Export                  | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `ScannerElement`        | Type: `HTMLImageElement \| HTMLVideoElement \| HTMLCanvasElement` |
| `defaultScanEqualityFn` | Default equality comparator for result dedup (format + text).     |
| `ScanOptions`           | Type for `scan()` options.                                        |
| `FramesOptions`         | Type for `frames()` options.                                      |

## Usage Patterns

### Scan until found

```ts
for await (const results of scan(videoElement, { formats: ["QRCode"] })) {
  if (results.length > 0) {
    console.log(results[0].text);
    break; // generator cleans up automatically
  }
}
```

### Continuous monitoring with dedup

```ts
let prev: ReadResult[] = [];
for await (const results of scan(videoElement, opts)) {
  if (!defaultScanEqualityFn(prev, results)) {
    prev = results;
    handleNewResults(results);
  }
}
```

### Consumer-controlled throttling

```ts
for await (const results of scan(videoElement, opts)) {
  handleResults(results);
  await sleep(100); // ~10fps max
}
```

### Worker decode

```ts
for await (const results of scan(videoElement, { worker: true })) {
  // Worker setup/teardown is internal — transparent to consumer
}
```

### Custom decode pipeline via `frames()`

```ts
import { frames } from "zxing-wasm/scanner";
import { readBarcodes } from "zxing-wasm/reader";

for await (const imageData of frames(videoElement)) {
  const results = await readBarcodes(imageData, customOptions);
  // full control over decode, error handling, etc.
}
```

### AbortSignal cancellation

```ts
const ac = new AbortController();
setTimeout(() => ac.abort(), 5000); // 5s timeout

try {
  for await (const results of scan(videoElement, { signal: ac.signal })) {
    if (results.length > 0) return results;
  }
} catch (e) {
  if (e instanceof DOMException && e.name === "AbortError") {
    // Timed out — expected
  } else {
    throw e;
  }
}
```

### Async generator combinators

Combinators compose naturally because the API is just `AsyncGenerator`:

```ts
async function* skipEmpty(source: AsyncIterable<ReadResult[]>) {
  for await (const results of source) {
    if (results.length > 0) yield results;
  }
}

async function* dedupe(
  source: AsyncIterable<ReadResult[]>,
  eq: (a: ReadResult[], b: ReadResult[]) => boolean,
) {
  let prev: ReadResult[] = [];
  for await (const next of source) {
    if (!eq(prev, next)) {
      prev = next;
      yield next;
    }
  }
}

// Composition:
for await (const results of dedupe(skipEmpty(scan(video, opts)), eq)) {
  console.log("New barcode:", results);
}
```

## Design Decisions

### Pull model vs Push model

| Aspect         | Push (current `createScanLoop`)         | Pull (async generator)                     |
| -------------- | --------------------------------------- | ------------------------------------------ |
| Backpressure   | Implicit (completion-based scheduling)  | Inherent (consumer doesn't pull → no work) |
| Stop           | Manual `stop()` / `destroy()`           | `break` or `AbortSignal`                   |
| Cleanup        | Must call `destroy()` explicitly        | `finally` block runs automatically         |
| Composition    | Callback wiring                         | Generator nesting / combinators            |
| Error handling | `onError` callback                      | `try/catch` + `onError` for non-fatal      |
| Throttling     | `interval` config option                | Consumer-controlled (`await sleep()`)      |
| State          | Manual (`running`, `scheduledId`, etc.) | Generator's own suspension state           |

The push model's timing is already completion-based: decode completes → schedule next rAF → rAF fires → extract → decode. The pull model is equivalent: consumer processes result → calls `next()` → generator awaits rAF → rAF fires → extract → yields. **Same timing, different expression.** The generator eliminates the manual state machine (`running`, `scheduledId`, `lastScanTime`) by using language-level suspension.

### Frame timing — bridging rAF/rVFC to promises

The generator needs to "wait for the next frame". This is implemented as a `nextFrame()` helper that returns a promise:

```ts
function nextFrame(
  element: ScannerElement,
  isVideo: boolean,
  useRVFC: boolean,
  signal?: AbortSignal,
): Promise<void>;
```

- **Video with rVFC**: `requestVideoFrameCallback` → resolves on next video frame
- **Everything else**: `requestAnimationFrame` → resolves on next paint frame
- **AbortSignal**: abort listener cancels the pending rAF/rVFC and rejects with `signal.reason`

The abort integration ensures that `signal.abort()` wakes the generator immediately (instead of waiting up to ~16ms for the next rAF).

### No built-in interval

The push model has an `interval` option for minimum ms between scans. The pull model drops this — **the consumer controls the pace**:

```ts
for await (const results of scan(video, opts)) {
  handle(results);
  await sleep(100); // consumer-controlled throttle
}
```

Rationale: in a pull model, the consumer is already in control of timing. Adding a built-in interval creates two overlapping timing mechanisms. Keeping it consumer-side is simpler and more explicit.

### `readerOptions` is fixed per generator

Unlike the React hook where `readerOptions` uses a latest-ref pattern (picked up at next scan without restart), `scan()` takes a fixed `readerOptions` at creation time.

Rationale: a generator is a self-contained stream. Mutating its behavior mid-iteration breaks the mental model. If options need to change, abort the current generator and start a new one. This is explicit and predictable.

The React hook, which wraps `frames()` directly (not `scan()`), retains latest-ref semantics by reading `readerOptions` from a ref on each iteration. See [React Integration](#react-integration).

### Error handling: two tiers

1. **Pixel extraction errors** (from `frames()`): **propagate**. These are typically SecurityError from tainted canvas (cross-origin without CORS). They're persistent — every frame will fail. Propagation stops the generator, letting the consumer handle it via `try/catch`.

2. **Decode errors** (from `readBarcodes` in `scan()`): **non-fatal**. Caught internally, reported via `onError` callback, generator continues. A transient WASM error shouldn't stop an entire scanning session. Without `onError`, decode errors are silently swallowed (the frame yields nothing).

This two-tier model matches the current push implementation's behavior where both are reported via `onError` but scanning continues. The difference is that persistent errors (tier 1) now have proper semantics — they stop the generator instead of firing `onError` on every frame forever.

### Cleanup via `finally`

Generator `finally` blocks run when:

- Consumer `break`s out of `for await`
- Consumer calls `.return()` on the iterator
- AbortSignal fires and the rejection propagates out
- Generator reaches its natural end (never, for `frames()`)

Resources cleaned up in `finally`:

- `frames()`: canvas dimensions zeroed (`canvas.width = 0; canvas.height = 0`)
- `scan()`: Worker released (`releaseWorker()`), decode cleanup

No manual `destroy()` call needed. This eliminates a class of resource leak bugs.

### Static images

For `<img>` elements, the generator yields a new `ImageData` every rAF frame — even though the image content is static. This is intentional:

1. The generator doesn't know if the image's `src` might change via JavaScript
2. For the common "scan once" pattern, the consumer simply `break`s after the first result
3. Adding change detection for images (e.g., tracking `src` attribute) adds complexity without clear benefit

The idiomatic pattern for one-shot scanning is:

```ts
for await (const results of scan(imgElement, opts)) {
  if (results.length > 0) return results;
}
```

Or, without the generator at all — just call `readBarcodes()` directly on an `ImageData`.

### Video frame dedup

For `<video>` elements using the rAF fallback path (no rVFC), the generator checks `video.currentTime` to skip duplicate frames. Same logic as the current push model. When rVFC is available, dedup is unnecessary because rVFC only fires on new video frames.

### Video readyState gate

The generator skips extraction when `video.readyState < 2` (HAVE_NOTHING or HAVE_METADATA). The video has metadata but no frame data — attempting `drawImage` would produce a blank or stale frame. This matches the current push model's behavior.

### Canvas direct read optimization

When the source element is an `HTMLCanvasElement` with a 2d context, pixels are read directly from the source canvas via `sourceCtx.getImageData()` — skipping the intermediate canvas and `drawImage`. Falls back to the intermediate canvas path for WebGL canvases, transferred canvases, or any other case where `getContext("2d")` returns `null`. Same optimization as the current push model.

### WASM preloading

`scan()` eagerly triggers WASM loading at the start of the generator (before the first `yield`):

- **Main thread mode**: calls `prepareZXingModule({ fireImmediately: true })`
- **Worker mode**: calls `acquireWorker()` which sends `init` message to Worker

This ensures WASM is loading in parallel with the first few frame extractions. By the time the first decode is needed, WASM is likely ready (or close to it).

### `ReadableStream` interop

An async generator can be wrapped as a `ReadableStream` with zero effort:

```ts
const stream = ReadableStream.from(scan(videoElement, opts));
```

The reverse (ReadableStream → async generator) requires more ceremony. This makes async generators the more fundamental primitive.

## Architecture

```
src/scanner/
  ├── helpers.ts           — ScannerElement type, cross-realm type guards,
  │                          createCanvas(), getDimensions(), defaultScanEqualityFn()
  ├── nextFrame.ts         — nextFrame() promise helper (rAF/rVFC + AbortSignal)
  ├── frames.ts            — frames() async generator
  ├── scan.ts              — scan() async generator + ScanOptions
  ├── workerDecode.ts      — Worker pool (acquireWorker/releaseWorker) + createWorkerDecode()
  ├── scanner-worker.ts    — Worker entry point
  └── index.ts             — public re-exports

src/react/
  ├── useScanner.ts        — hook wrapping frames() with React lifecycle
  └── index.ts             — public re-exports (imports scanner/ types)
```

### Code sharing with `react/`

Shared DOM utilities move from `src/react/helpers.ts` to `src/scanner/helpers.ts`. The React module imports from `scanner/`:

```ts
// src/react/useScanner.ts
import { frames, type ScannerElement } from "../scanner/helpers.js";
import { frames } from "../scanner/frames.js";
```

`workerDecode.ts` and `scanner-worker.ts` also move to `scanner/` since they're framework-agnostic.

After migration, `src/react/` contains only:

- `useScanner.ts` — the hook itself
- `index.ts` — re-exports

### Dependency direction

```
scanner/helpers.ts  ←  scanner/nextFrame.ts
                    ←  scanner/frames.ts  ←  scanner/scan.ts
                                          ←  react/useScanner.ts
scanner/workerDecode.ts  ←  scanner/scan.ts
                         ←  react/useScanner.ts
scanner/scanner-worker.ts  (standalone Worker entry)
```

No circular dependencies. `react/` depends on `scanner/`, never the reverse.

### `nextFrame()` implementation

```ts
function nextFrame(
  element: ScannerElement,
  isVideo: boolean,
  useRVFC: boolean,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    let id: number;

    const onAbort = () => {
      if (useRVFC) {
        (element as HTMLVideoElement).cancelVideoFrameCallback(id);
      } else {
        cancelAnimationFrame(id);
      }
      reject(signal!.reason);
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    const onFrame = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    };

    if (useRVFC) {
      id = (element as HTMLVideoElement).requestVideoFrameCallback(onFrame);
    } else {
      id = requestAnimationFrame(onFrame);
    }
  });
}
```

Key: `{ once: true }` on the abort listener prevents leaks. When rAF fires first, the abort listener is explicitly removed. When abort fires first, the pending rAF/rVFC is cancelled.

### `frames()` implementation sketch

```ts
async function* frames(
  element: ScannerElement,
  options?: FramesOptions,
): AsyncGenerator<ImageData> {
  const signal = options?.signal;

  const isVideo = isHTMLVideoElement(element);
  const useRVFC = isVideo && "requestVideoFrameCallback" in element;
  const { canvas, ctx } = createCanvas(1, 1);
  const sourceCtx =
    !isVideo && !isHTMLImageElement(element)
      ? ((element as HTMLCanvasElement).getContext(
          "2d",
        ) as CanvasRenderingContext2D | null)
      : null;

  let lastCurrentTime = -1;

  try {
    while (true) {
      await nextFrame(element, isVideo, useRVFC, signal);

      // Video frame dedup (rAF fallback only — rVFC already deduplicates)
      if (isVideo && !useRVFC) {
        const ct = (element as HTMLVideoElement).currentTime;
        if (ct === lastCurrentTime) continue;
        lastCurrentTime = ct;
      }

      // Skip if video has no current frame data
      if (isVideo && (element as HTMLVideoElement).readyState < 2) continue;

      // Extract pixels
      const [w, h] = getDimensions(element);
      if (w === 0 || h === 0) continue;

      if (sourceCtx) {
        yield sourceCtx.getImageData(0, 0, w, h);
        continue;
      }

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.drawImage(element, 0, 0);
      yield ctx.getImageData(0, 0, w, h);
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
```

### `scan()` implementation sketch

```ts
async function* scan(
  element: ScannerElement,
  options?: ScanOptions,
): AsyncGenerator<ReadResult[]> {
  const {
    readerOptions = {},
    worker,
    wasmBinary,
    signal,
    onError,
  } = options ?? {};

  // Setup decode pipeline
  let decode: DecodeFn;
  let cleanupDecode: (() => void) | undefined;

  if (worker !== undefined) {
    const workerKey = typeof worker === "string" ? worker : undefined;
    const wd = createWorkerDecode(workerKey, wasmBinary);
    decode = wd.decode;
    cleanupDecode = wd.destroy;
  } else {
    if (wasmBinary && wasmBinary.byteLength > 0) {
      prepareZXingModule({ overrides: { wasmBinary }, fireImmediately: true });
    } else {
      prepareZXingModule({ fireImmediately: true });
    }
    decode = readBarcodes;
  }

  try {
    for await (const imageData of frames(element, { signal })) {
      try {
        yield await decode(imageData, readerOptions);
      } catch (error) {
        onError?.(error);
        // Non-fatal: continue to next frame
      }
    }
  } finally {
    cleanupDecode?.();
  }
}
```

Note: `scan()` is ~20 lines of logic. The entire decode pipeline setup, error resilience, and cleanup is expressed concisely because the generator's control flow handles the hard parts.

## React Integration

`useScanner()` wraps `frames()` (not `scan()`) to retain latest-ref semantics for `readerOptions`, `onScan`, `onFrame`, `onError`, and `equalityFn`. The hook manages the async iteration in the background via a fire-and-forget async function.

### Sketch

```ts
function useScanner(options: UseScannerOptions = {}): UseScannerReturn {
  const worker = useMemo(/* normalize worker option */);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const elementRef = useRef<ScannerElement | null>(null);
  const acRef = useRef<AbortController | null>(null);
  const decodeRef = useRef<{ fn: DecodeFn; cleanup?: () => void } | null>(null);
  const prevResultsRef = useRef<ReadResult[]>(EMPTY_RESULTS);

  const [scanning, setScanning] = useState(false);

  // --- Decode setup (same pattern as current hook) ---

  const setupDecode = useCallback((): {
    fn: DecodeFn;
    cleanup?: () => void;
  } => {
    const w = workerRef.current;
    if (w !== undefined) {
      const key = typeof w === "string" ? w : undefined;
      const wd = createWorkerDecode(key, optionsRef.current.wasmBinary);
      return { fn: wd.decode, cleanup: wd.destroy };
    }
    // Main thread — preload WASM
    const wasmBinary = optionsRef.current.wasmBinary;
    if (wasmBinary?.byteLength) {
      prepareZXingModule({ overrides: { wasmBinary }, fireImmediately: true });
    } else {
      prepareZXingModule({ fireImmediately: true });
    }
    return { fn: readBarcodes };
  }, []);

  // --- Core iteration (replaces createScanLoop + scheduling state machine) ---

  const start = useCallback(() => {
    if (acRef.current) return; // already running
    const el = elementRef.current;
    if (!el) return; // no element

    const ac = new AbortController();
    acRef.current = ac;
    const decode = setupDecode();
    decodeRef.current = decode;
    setScanning(true);

    (async () => {
      try {
        for await (const imageData of frames(el, { signal: ac.signal })) {
          // Decode with latest readerOptions (latest-ref)
          try {
            const results = await decode.fn(
              imageData,
              optionsRef.current.readerOptions ?? {},
            );

            // onFrame — every processed frame
            optionsRef.current.onFrame?.(results);

            // onScan — gated by equalityFn
            const eq = optionsRef.current.equalityFn ?? defaultScanEqualityFn;
            if (!eq(prevResultsRef.current, results)) {
              prevResultsRef.current = results;
              optionsRef.current.onScan?.(results);
            }
          } catch (error) {
            optionsRef.current.onError?.(error);
          }
        }
      } catch (e) {
        // AbortError is expected from stop()
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          optionsRef.current.onError?.(e);
        }
      } finally {
        decode.cleanup?.();
        decodeRef.current = null;
        acRef.current = null;
        prevResultsRef.current = EMPTY_RESULTS;
        setScanning(false);
      }
    })();
  }, []);

  const stop = useCallback(() => {
    acRef.current?.abort();
    acRef.current = null;
  }, []);

  // ref, worker effect, unmount effect — similar to current hook
  // ...
}
```

### What changes in the hook

| Aspect          | Before (push model)                         | After (pull model)                          |
| --------------- | ------------------------------------------- | ------------------------------------------- |
| Core loop       | `createScanLoop()` factory                  | `for await (of frames())`                   |
| Scheduling      | Manual `scheduleNext()`/`cancelScheduled()` | `nextFrame()` promise in generator          |
| Stop mechanism  | `loop.stop()` sets `running = false`        | `AbortController.abort()`                   |
| Cleanup         | `loop.destroy()` + `decoderDestroy()`       | Generator `finally` + decode cleanup        |
| Internal state  | `running`, `scheduledId`, `lastScanTime`... | Generator suspension (implicit)             |
| Result handling | `onResults` callback from loop              | Inline in `for await` body                  |
| `readerOptions` | Getter `getReaderOptions()` in loop         | `optionsRef.current.readerOptions` per iter |

The hook drops its dependency on `createScanLoop` entirely. `scanLoop.ts` is no longer needed — its logic is absorbed by `frames()` + `nextFrame()`.

## Lifecycle

### Normal scan session

```
1. Consumer creates generator:  scan(element, opts)  or  frames(element, opts)
2. Generator setup:             canvas creation, Worker acquire, WASM preload
3. First iteration:             await nextFrame() → extract pixels → yield
4. Consumer processes result
5. Next iteration:              consumer calls next() → await nextFrame() → ...
6. Consumer breaks:             break / signal.abort()
7. Generator finally:           canvas cleanup, Worker release
```

### Cancellation timing

| Trigger          | Generator state        | Behavior                                                                |
| ---------------- | ---------------------- | ----------------------------------------------------------------------- |
| `break`          | Suspended at `yield`   | `.return()` called → `finally` runs immediately                         |
| `signal.abort()` | At `await nextFrame()` | Promise rejects → `finally` runs immediately                            |
| `signal.abort()` | Suspended at `yield`   | Next `next()` → `nextFrame()` sees aborted signal → rejects immediately |

Maximum cancellation delay: one decode cycle (if abort happens while consumer is processing the current yield). This is acceptable — WASM decoding is not abortable anyway.

### Worker lifecycle in `scan()`

```
scan() starts  →  acquireWorker(key, wasmBinary)  →  refCount++
  ... iteration ...
scan() finally  →  cleanupDecode()  →  releaseWorker(key)  →  refCount--
                                                              if 0: terminate()
```

Multiple `scan()` generators with the same Worker key share one Worker (reference counted). Last one to finish terminates it.

## Build

- **ESM only** — no CJS or IIFE for `scanner/` entries (same as `react/`)
- **No framework dependencies** — `scanner/` has zero external dependencies
- `scripts/build-cjs.ts` and `scripts/build-iife.ts` filter out `scanner/` entries
- Build outputs: `dist/es/scanner/index.js`, `dist/es/scanner/scanner-worker.js`

### Package exports

```jsonc
{
  "./scanner": {
    "import": "./dist/es/scanner/index.js",
    "default": "./dist/es/scanner/index.js",
  },
}
```

### Vite entry points

```ts
// vite.config.ts (added to existing entries)
"scanner/index": "src/scanner/index.ts",
"scanner/scanner-worker": "src/scanner/scanner-worker.ts",
```

### Worker URL handling

Same `import.meta.env.DEV` conditional as current `react/workerDecode.ts` — prevents Rolldown from inlining the Worker as a data URL in library mode.

## Testing

Browser integration tests (Vitest browser mode + Playwright), same pattern as `react/`:

1. **`frames()` yields ImageData from `<img>`** — verify dimensions, non-zero pixel data
2. **`scan()` decodes barcode from `<img>`** — main thread mode
3. **`scan()` with `worker: true`** — Worker mode decode
4. **`scan()` respects AbortSignal** — abort mid-scan, verify generator exits cleanly
5. **`scan()` `onError` on decode failure** — verify non-fatal error handling
6. **`frames()` propagates SecurityError** — tainted canvas scenario (if testable)

## Migration Plan

### Phase 1: Create `scanner/` with new files

- `src/scanner/helpers.ts` — copy from `react/helpers.ts`
- `src/scanner/nextFrame.ts` — new
- `src/scanner/frames.ts` — new
- `src/scanner/scan.ts` — new
- `src/scanner/workerDecode.ts` — copy from `react/workerDecode.ts`
- `src/scanner/scanner-worker.ts` — copy from `react/scanner-worker.ts`
- `src/scanner/index.ts` — new

### Phase 2: Refactor `react/` to import from `scanner/`

- `react/useScanner.ts` — rewrite to use `frames()` instead of `createScanLoop()`
- `react/helpers.ts` — delete (re-export from `scanner/helpers.ts` or import directly)
- `react/scanLoop.ts` — delete
- `react/workerDecode.ts` — delete (import from `scanner/`)
- `react/scanner-worker.ts` — delete (shared with `scanner/`)

### Phase 3: Update build & config

- Add `scanner/` entries to `vite.config.ts`
- Filter `scanner/` from CJS/IIFE builds
- Add `./scanner` to `package.json` exports
- Update `biome.json` if needed
- Update `tsconfig.json` include paths if needed

### Phase 4: Update tests

- Add browser tests for `scanner/` (standalone, no React)
- Update existing `react/` browser tests (should still pass — same behavior, different internals)
