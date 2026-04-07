# `zxing-wasm/scanner` — Technical Design

## Overview

A framework-agnostic barcode scanning API built on **async generators**. It is exposed as the `zxing-wasm/scanner` subpath export.

The core model is simple: scanning is a sequence of frames that arrive over time. Async iteration models that well:

- `scan()` is the only public scanning stream
- internally, it owns frame scheduling, extraction, decode, cancellation, and cleanup
- `break`, `.return()`, and `AbortSignal` map naturally to cancellation and cleanup

`scanner/` is the lower-level primitive. `react/` becomes a thin lifecycle wrapper around `scan()`.

## API Surface

```ts
import { scan } from "zxing-wasm/scanner";
```

`scan()` is the only public export for scanning streams. `frames()` remains an internal primitive and is documented below because it is still a key part of the design.

### `scan`

```ts
function scan(
  element: ScannerElement,
  options?: ScanOptions,
): AsyncGenerator<ReadResult[]>;
```

Composes `frames()` with `readBarcodes()` or Worker decode. Each successful decode yields one `ReadResult[]`, including `[]` when no barcode is found.

`scan()` follows native async-iteration error semantics: if decode fails, the generator throws and ends. There is no built-in recovery side channel such as `onError` or `recover`.

#### `ScanOptions`

| Option             | Type                         | Description                                                                                     |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `readerOptions`    | `ReaderOptions \| (() => ReaderOptions)` | Static reader config object, or a getter evaluated per decode for dynamic config.     |
| `wasmBinary`       | `ArrayBuffer`                | Pre-fetched WASM binary. Passed to `prepareZXingModule` or transferred to the Worker on init.   |
| `worker`           | `boolean \| string`          | `undefined` / `false`: main thread. `true`: shared Worker. `string`: keyed Worker.             |
| `signal`           | `AbortSignal`                | Cancels the generator. Passed through to `frames()`.                                            |

### Exported utilities

| Export           | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `ScannerElement` | Type: `HTMLImageElement \| HTMLVideoElement \| HTMLCanvasElement` |
| `ScanOptions`    | Type for `scan()` options.                                        |

## Internal Primitive

### `frames()`

```ts
function frames(
  element: ScannerElement,
  options?: FramesOptions,
): AsyncGenerator<ImageData>;
```

`frames()` is not a public export. It is the internal frame-capture primitive used by `scan()`.

It yields `ImageData` from a DOM element, one visual frame at a time. It owns scheduling (`requestAnimationFrame` / `requestVideoFrameCallback`), video readiness checks, and pixel extraction.

Pixel extraction errors propagate and terminate the generator.

#### `FramesOptions`

| Option   | Type          | Description                                                         |
| -------- | ------------- | ------------------------------------------------------------------- |
| `signal` | `AbortSignal` | Cancels the generator. Rejects any pending frame wait immediately. |

## Usage Patterns

### Scan until found

```ts
for await (const results of scan(videoElement, { readerOptions: { formats: ["QRCode"] } })) {
  if (results.length > 0) {
    console.log(results[0].text);
    break;
  }
}
```

### Dynamic reader options

```ts
let currentReaderOptions: ReaderOptions = { formats: ["QRCode"] };

for await (const results of scan(videoElement, {
  readerOptions: () => currentReaderOptions,
})) {
  // Later:
  // currentReaderOptions = { formats: ["Code128"] };
  console.log(results);
}
```

### AbortSignal cancellation

```ts
const ac = new AbortController();
setTimeout(() => ac.abort(), 5000);

try {
  for await (const results of scan(videoElement, { signal: ac.signal })) {
    if (results.length > 0) return results;
  }
} catch (e) {
  if (e instanceof DOMException && e.name === "AbortError") {
    // expected timeout
  } else {
    throw e;
  }
}
```

## Design Decisions

### Pull model vs push model

| Aspect         | Push (`createScanLoop`)                 | Pull (async generator)                     |
| -------------- | --------------------------------------- | ------------------------------------------ |
| Backpressure   | Implicit completion-based scheduling    | Inherent: no `next()` call means no work   |
| Stop           | Custom `stop()` / `destroy()`           | `break`, `.return()`, or `AbortSignal`     |
| Cleanup        | Manual resource lifecycle               | `finally` block                            |
| Composition    | Callback wiring                         | Generator composition                      |
| Error handling | Callback-based                          | Native `throw` / `try` / `catch`           |
| Throttling     | Internal `interval`                     | Consumer-controlled                        |
| State          | Manual booleans and scheduled handles   | Suspension is language-level               |

The existing push loop is already completion-based: decode finishes, then the next frame is scheduled. Async generators express the same sequencing directly, without a hand-written state machine.

### No built-in interval

`scanner/` does not provide an `interval` option. In a pull model, pacing is already under consumer control:

```ts
for await (const results of scan(videoElement, opts)) {
  handle(results);
  await sleep(100);
}
```

Adding a second timing mechanism inside `scan()` would overlap with that control and make the stream harder to reason about.

### `scan()` keeps native async-iteration error semantics

`scan()` does not swallow decode errors and does not expose `onError` / `recover`.

Rationale:

1. It keeps the primitive easy to understand. Successful decode yields a value; failure throws.
2. It preserves the normal async-iteration contract. A thrown error terminates the iterator.
3. It avoids mixing two protocols in one API surface: yielded scan results and out-of-band error callbacks.

If a higher-level consumer wants to surface errors without crashing an app, it should catch them outside `scan()` and decide whether to restart scanning explicitly.

### `readerOptions` supports object or getter

Rationale:

1. The React wrapper wants to remain a thin consumer of `scan()`.
2. Reading one getter per frame is cheap.
3. A single `readerOptions` entry is simpler than exposing both `readerOptions` and `getReaderOptions`.
4. Plain object input keeps the common static case ergonomic.

`readerOptions` is interpreted as:

- object: fixed configuration for the lifetime of the generator
- function: dynamic getter evaluated on each decode

Relying on mutating a shared options object in place is intentionally not part of the contract. If callers need dynamic behavior, they should pass a getter explicitly.

### Error tiers

There are still two kinds of operational failures, but both are fatal at the `scan()` level:

1. **Frame extraction errors** from internal frame capture
   - Example: `SecurityError` from a tainted canvas
   - These propagate immediately

2. **Decode errors** from `readBarcodes()` / Worker decode
   - These also propagate immediately

`scan()` does not reinterpret either category. The wrapper layer may choose to catch them and notify the user, but the generator itself ends.

### Cleanup via `finally`

Generator `finally` blocks run when:

- the consumer `break`s
- the consumer calls `.return()`
- `AbortSignal` aborts and the rejection escapes
- the generator throws

Resources cleaned up in `finally`:

- extraction resources: zero the internal canvas dimensions
- decode resources: release Worker-backed decoder resources

### Static images

For `<img>` elements, the internal frame loop extracts a new `ImageData` on each animation frame even if the pixels are unchanged.

Rationale:

1. The source `src` may still change dynamically.
2. The common one-shot case just `break`s after the first successful result.
3. Adding image-change detection increases complexity for limited payoff.

### Video frame dedup

For `<video>` elements on the rAF fallback path, the internal frame loop compares `currentTime` and skips duplicates. When `requestVideoFrameCallback` is available, that dedup is unnecessary because callbacks already correspond to new video frames.

### Video readyState gate

Internal frame capture skips extraction when `video.readyState < 2`. Metadata alone is not enough to guarantee usable current-frame pixels.

### Canvas direct-read optimization

When the source element is a 2D `HTMLCanvasElement`, internal frame capture reads from the source canvas directly via `getImageData()` and skips the intermediate extraction canvas. It falls back to the intermediate-canvas path for WebGL, transferred, or otherwise non-2D canvases.

### WASM preloading

`scan()` eagerly starts decoder setup before the first yielded value:

- main thread: `prepareZXingModule({ fireImmediately: true })`
- Worker mode: `acquireWorker()` posts `init`

This overlaps module initialization with the first few frame waits.

### Keyed Worker ownership

`worker: true` uses the shared default Worker. `worker: string` uses a keyed Worker pool.

For a keyed Worker, `wasmBinary` is part of the Worker's initialization identity:

- the first acquirer may provide `wasmBinary`
- later acquirers for the same key must reuse that initialized Worker
- providing another `wasmBinary` for the same key is an error

If different binaries need to coexist, they must use different Worker keys.

## Architecture

```
src/scanner/
  ├── helpers.ts           — ScannerElement, type guards, canvas helpers,
  │                          dimensions
  ├── nextFrame.ts         — wait for the next scheduled frame
  ├── frames.ts            — internal frame stream primitive
  ├── scan.ts              — scan() async generator + decoder setup
  ├── workerDecode.ts      — keyed Worker pool + Worker decode wrapper
  ├── scanner-worker.ts    — internal Worker entry
  └── index.ts             — public re-exports

src/react/
  ├── useScanner.ts        — hook that runs scan() inside React lifecycle
  └── index.ts             — public re-exports
```

`react/` depends on `scanner/`, never the reverse.

## Implementation Sketches

### `nextFrame()`

```ts
interface FrameScheduler {
  request(cb: () => void): number;
  cancel(id: number): void;
}

function nextFrame(
  scheduler: FrameScheduler,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    let id: number;

    const onAbort = () => {
      scheduler.cancel(id);
      reject(signal!.reason);
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    const onFrame = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    };

    id = scheduler.request(onFrame);
  });
}
```

### Internal `frames()`

```ts
async function* frames(
  element: ScannerElement,
  options?: FramesOptions,
): AsyncGenerator<ImageData> {
  const signal = options?.signal;
  const isVideo = isHTMLVideoElement(element);
  const useRVFC = isVideo && "requestVideoFrameCallback" in element;
  const scheduler: FrameScheduler = useRVFC
    ? {
        request: (cb) =>
          (element as HTMLVideoElement).requestVideoFrameCallback(() => cb()),
        cancel: (id) =>
          (element as HTMLVideoElement).cancelVideoFrameCallback(id),
      }
    : {
        request: (cb) => requestAnimationFrame(() => cb()),
        cancel: (id) => cancelAnimationFrame(id),
      };
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
      await nextFrame(scheduler, signal);

      if (isVideo && !useRVFC) {
        const ct = (element as HTMLVideoElement).currentTime;
        if (ct === lastCurrentTime) continue;
        lastCurrentTime = ct;
      }

      if (isVideo && (element as HTMLVideoElement).readyState < 2) continue;

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

### `scan()`

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
  } = options ?? {};

  const resolveReaderOptions =
    typeof readerOptions === "function"
      ? readerOptions
      : () => readerOptions;

  let decode: DecodeFn;
  let cleanupDecode: (() => void) | undefined;

  if (worker === true || typeof worker === "string") {
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
      yield await decode(imageData, resolveReaderOptions());
    }
  } finally {
    cleanupDecode?.();
  }
}
```

## React Integration

`useScanner()` should consume `scan()` directly rather than rebuilding its own decode loop on top of `frames()`.

### Hook option model

- **Structural options**: `worker`, `wasmBinary`
  - changing them ends the current scan session and starts a new one if needed
- **Latest-ref options**: `readerOptions`, `onScan`, `onFrame`, `onError`, `equalityFn`
  - they are read through refs during iteration

`readerOptions` stays latest-ref in the hook by passing a getter into `scan()`:

```ts
readerOptions: () => optionsRef.current.readerOptions ?? {},
```

Result dedup is a React-layer concern. `useScanner()` may keep `equalityFn` and a React-local `defaultScanEqualityFn`, but `scanner/` itself does not expose or depend on any result equality policy.

### Fatal error handling in the hook

`scan()` itself throws. `useScanner()` catches that error, calls `onError`, and ends the current session. Recovery, if desired, is explicit: start a new session.

### Run-token race protection

The hook should use a token identity rather than a numeric generation counter. Each running scan session gets a unique token object. Async completion paths only mutate hook state if their token is still current.

```ts
const runTokenRef = useRef<object | null>(null);
const abortRef = useRef<AbortController | null>(null);

const start = useCallback(() => {
  if (!elementRef.current || runTokenRef.current) return;

  const token = {};
  const ac = new AbortController();

  runTokenRef.current = token;
  abortRef.current = ac;
  setScanning(true);

  (async () => {
    try {
      for await (const results of scan(elementRef.current!, {
        signal: ac.signal,
        worker: workerRef.current,
        wasmBinary: wasmBinaryRef.current,
        readerOptions: () => optionsRef.current.readerOptions ?? {},
      })) {
        if (runTokenRef.current !== token) return;

        optionsRef.current.onFrame?.(results);

        const eq = optionsRef.current.equalityFn ?? defaultScanEqualityFn;
        if (!eq(prevResultsRef.current, results)) {
          prevResultsRef.current = results;
          optionsRef.current.onScan?.(results);
        }
      }
    } catch (error) {
      if (runTokenRef.current !== token) return;
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        optionsRef.current.onError?.(error);
      }
    } finally {
      if (runTokenRef.current !== token) return;
      runTokenRef.current = null;
      abortRef.current = null;
      prevResultsRef.current = EMPTY_RESULTS;
      setScanning(false);
    }
  })();
}, []);

const stop = useCallback(() => {
  runTokenRef.current = null;
  abortRef.current?.abort();
  abortRef.current = null;
  prevResultsRef.current = EMPTY_RESULTS;
  setScanning(false);
}, []);
```

This prevents stale `finally` blocks from an older run from clearing state for a newer run.

## Lifecycle

### `scan()`

```
1. create generator
2. setup decode pipeline
3. wait for frame
4. extract pixels
5. decode
6. yield results
7. repeat until break / abort / throw
8. run finally cleanup
```

### `useScanner()`

```
1. ref(element) stores the element
2. start() creates a run token and AbortController
3. hook consumes scan(element, ...)
4. stop(), ref detach, or structural option change aborts the current run
5. current run settles and finally cleanup only wins if its token is still current
```

## Build

- `scanner/index` should ship as `ES + CJS`
- `react/index` should ship as `ES + CJS`
- `reader` / `writer` / `full` may continue shipping `ES + CJS + IIFE`
- `scanner-worker` is an internal build artifact owned by `scanner/`, not a public API surface
- there should be exactly one scanner Worker entry in the package architecture

`react/` must not own a separate Worker. It should always reuse the Worker pipeline defined in `scanner/`.

### External dependencies

- `scanner/` has no framework dependencies
- `react/` must externalize React runtime dependencies in both ES and CJS builds
- expected externals:
  - `react`
  - `react/jsx-runtime`

Package-local subpaths such as `zxing-wasm/reader`, `zxing-wasm/full`, and `zxing-wasm/scanner` are not external dependencies. They are part of the package's own published surface and should be built and referenced as internal outputs.

### Worker artifact

`scanner/scanner-worker` should be built as an internal browser Worker artifact used by `scanner/index`.

This artifact exists for runtime loading, not as a user-facing entry point. Users choose worker mode through `scan(..., { worker })`; they do not configure Worker construction directly.

### IIFE policy

`scanner` does not need to ship an IIFE build by default.

Rationale:

1. Worker-backed scanning is owned internally by the library.
2. Hiding Worker construction from consumers is more important than forcing IIFE support.
3. `reader` / `writer` / `full` remain the more natural targets for standalone script-tag usage.

### Package exports

```jsonc
{
  "./scanner": {
    "import": "./dist/es/scanner/index.js",
    "require": "./dist/cjs/scanner/index.js",
    "default": "./dist/es/scanner/index.js"
  }
}
```

The same release update should also include:

- `typesVersions`
- TypeDoc entry points
- demo aliases / path mappings

## Testing

Browser integration tests should cover:

1. `scan()` decodes from `<img>` on main thread
2. `scan()` decodes from `<img>` in Worker mode
3. `scan()` throws on decode failure
4. `scan()` propagates frame extraction `SecurityError` for tainted canvas, if testable
5. `scan()` respects `AbortSignal`
6. `useScanner()` catches fatal scan errors, calls `onError`, and ends the current session
7. `useScanner()` handles rapid stop/start without stale cleanup races

## Migration Plan

### Phase 1: create `scanner/`

- `src/scanner/helpers.ts`
- `src/scanner/nextFrame.ts`
- `src/scanner/frames.ts`
- `src/scanner/scan.ts`
- `src/scanner/workerDecode.ts`
- `src/scanner/scanner-worker.ts`
- `src/scanner/index.ts`

### Phase 2: refactor `react/`

- rewrite `react/useScanner.ts` to consume `scan()`
- move shared helpers into `scanner/`
- delete `react/scanLoop.ts`
- delete `react/workerDecode.ts`
- delete `react/scanner-worker.ts`

### Phase 3: update build and publishing

- add `scanner/` Vite entries
- build `scanner/index` as ES + CJS
- build `react/index` as ES + CJS
- externalize `react` and `react/jsx-runtime` in ES + CJS builds
- add `./scanner` export
- update `typesVersions`
- update TypeDoc entry points
- update demo aliases / path mappings

### Phase 4: tests

- add standalone browser tests for `scanner/`
- adapt `react/` browser tests to the new internals
