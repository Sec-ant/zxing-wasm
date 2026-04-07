# `zxing-wasm/react` — Technical Design

## Overview

A React hook (`useScanner`) that monitors DOM elements (`<img>`, `<video>`, `<canvas>`) for real-time barcode scanning. Exposed as the `zxing-wasm/react` ESM-only subpath export.

## API Surface

```ts
import { useScanner } from "zxing-wasm/react";

const { ref, start, stop, scanning } = useScanner(options);
```

### `UseScannerOptions`

| Option          | Type                              | Reactive   | Description                                                                                                 |
| --------------- | --------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `readerOptions` | `ReaderOptions`                   | latest-ref | Barcode reader config. Applied at next scan, no restart.                                                    |
| `wasmBinary`    | `ArrayBuffer`                     | no         | Pre-fetched WASM binary. Used once at loop creation.                                                        |
| `worker`        | `boolean \| string`               | structural | `false`/`undefined`: main thread. `true`: shared Worker. `string`: keyed Worker. Change recreates the loop. |
| `interval`      | `number`                          | latest-ref | Minimum ms between scans. 0 = as fast as possible.                                                          |
| `onScan`        | `(results: ReadResult[]) => void` | latest-ref | Called when results change (gated by `equalityFn`).                                                         |
| `onFrame`       | `(results: ReadResult[]) => void` | latest-ref | Called every processed frame.                                                                               |
| `onError`       | `(error: unknown) => void`        | latest-ref | Called on scan errors.                                                                                      |
| `equalityFn`    | `(prev, next) => boolean`         | latest-ref | Zustand-style comparator. `true` = equal, suppress `onScan`.                                                |

### `UseScannerReturn`

| Field      | Type                          | Stable | Description                                             |
| ---------- | ----------------------------- | ------ | ------------------------------------------------------- |
| `ref`      | `RefCallback<ScannerElement>` | yes    | Callback ref — bind to a DOM element.                   |
| `start`    | `() => void`                  | yes    | Start scanning. No-op if already running or no element. |
| `stop`     | `() => void`                  | yes    | Pause scanning. Resources kept for fast resume.         |
| `scanning` | `boolean`                     | no     | Whether the loop is currently active.                   |

## Design Decisions

### No `autoStart`

`ref(element)` only stores the element. Scanning starts only when the user explicitly calls `start()`. This avoids surprising side effects and gives full control over timing (e.g., wait for `<video>` to be playing, or `<img>` to finish loading).

### No `results` in return

Results are delivered via callbacks (`onScan`, `onFrame`), not stored in hook state. This avoids unnecessary re-renders on every frame and lets the consumer decide what to do with results.

### Stable identities via `useCallback` + ref indirection

All functions (`handleResults`, `destroyLoop`, `createLoop`, `start`, `stop`, `ref`) are wrapped with `useCallback(fn, [])` so the function body is created only once. The three internal helpers are additionally stored in refs (`handleResultsRef`, `destroyLoopRef`, `createLoopRef`), and all callers go through `xxxRef.current()`:

```ts
const handleResults = useCallback((scanResults) => {
  /* reads optionsRef, prevResultsRef */
}, []);
const handleResultsRef = useRef(handleResults);
handleResultsRef.current = handleResults;
```

This gives two benefits:

1. **No dependency chains** — `start`, `stop`, `ref`, and effects all have `[]` deps (except the `worker` effect which depends on `[worker]`). No cascading invalidations.
2. **biome compatible** — biome has hardcoded special handling for `useRef`, knowing `.current` accesses don't need to be dependencies. This cannot be extended to custom hooks.

All mutable state is read through `useRef` inside the callbacks, so they always see the latest values without being recreated.

### `onScan` gating via `equalityFn`

Same convention as zustand's `equalityFn`:

- Called with `(prevResults, nextResults)`
- Returns `true` → results are "equal" → `onScan` is NOT fired
- Returns `false` → results changed → `onScan` fires

Default equality: compare `format + text` content (sorted), ignoring position changes.

### Structural vs. latest-ref options

- **Structural**: `worker` — changing this recreates the decode pipeline (Worker ↔ main thread switch).
- **Latest-ref**: everything else — changes are picked up at the next scan iteration without any restart. This avoids unnecessary loop destruction/recreation for common config tweaks.

## Architecture

```
useScanner (hook)
  ├── helpers.ts          — ScannerElement type, getDimensions(), defaultScanEqualityFn()
  ├── scanLoop.ts         — createScanLoop() factory — rAF/rVFC scheduling, pixel extraction, decode dispatch
  ├── workerDecode.ts     — acquireWorker(), releaseWorker(), createWorkerDecode() — keyed Worker pool
  ├── scanner-worker.ts   — Worker entry point — receives ImageData, calls readBarcodes()
  └── index.ts            — public re-exports (useScanner, UseScannerOptions, UseScannerReturn, ScannerElement)
```

### `createScanLoop(options): ScanLoop`

Closure-based factory (no class). Encapsulates:

- **Pixel extraction**: `OffscreenCanvas` (fallback: `HTMLCanvasElement`) with `willReadFrequently: true`
- **Scheduling**: `requestVideoFrameCallback` for `<video>` elements (when available), `requestAnimationFrame` for all others
- **Completion-based scheduling**: next frame is scheduled only after the previous decode completes (prevents queue buildup with slow decoders)
- **Interval throttling**: `performance.now()` based, checked before pixel extraction
- **Video frame dedup**: `currentTime` check for `<video>` with rAF fallback (rVFC already handles this)

### `createWorkerDecode(workerKey?, wasmBinary?): WorkerDecode`

Creates a decode function that sends `ImageData` buffers to a Worker via `postMessage` with Transferable. Returns `{ decode, destroy }`.

### Worker pool (`acquireWorker` / `releaseWorker`)

- Keyed by string (or default key for `worker: true`)
- Reference counted — Worker is `terminate()`d when last consumer releases
- `wasmBinary` is sent via `postMessage` with transfer on first acquire (buffer is detached)
- Subsequent acquirers share the already-initialized Worker

### Worker URL handling

```ts
const scannerWorkerURL = new URL(
  import.meta.env.DEV ? "./scanner-worker.ts" : "./scanner-worker.js",
  import.meta.url,
);
```

The `import.meta.env.DEV` conditional is necessary to prevent Rolldown from detecting the static `new URL(literal, import.meta.url)` pattern and incorrectly inlining the Worker as a data-URL in library mode. In production, dead-code elimination produces `"./scanner-worker.js"`. In dev, `.ts` resolves via Vite's dev server.

## Lifecycle

```
1. ref(element)     → store element, do NOT start scanning
2. start()          → lazy-create loop (if needed) → loop.start() → setScanning(true)
3. [scanning...]    → rAF/rVFC → extractPixels → decode → onResults → schedule next
4. stop()           → loop.stop() → setScanning(false), loop kept alive for resume
5. start()          → loop.start() (reuse existing loop)
6. ref(null)        → destroyLoop() → setScanning(false), release all resources
7. unmount          → destroyLoop() + clear element ref
```

### Structural option change (`worker`)

When `worker` changes between renders:

1. If a loop exists and was running → destroy it → create new loop with new decoder → start
2. If a loop exists but was stopped → destroy it → next `start()` creates fresh
3. If no loop exists → no-op

### Eager WASM preloading

On mount (and when `worker` changes):

- **Main thread mode**: calls `prepareZXingModule({ fireImmediately: true })` — triggers async WASM fetch/compile without blocking
- **Worker mode**: calls `acquireWorker()` — creates Worker and sends `init` message with optional `wasmBinary`

This ensures WASM is ready (or loading) by the time the user calls `start()`.

## Build

- **ESM only** — no CJS or IIFE build for `react/` entries
- `react` is externalized in Vite library build
- `react >=18` as optional `peerDependency`
- Build outputs: `dist/es/react/index.js`, `dist/es/react/scanner-worker.js`
- `scripts/build-cjs.ts` and `scripts/build-iife.ts` filter out `react/` entries

## Testing

Browser integration tests only (Vitest browser mode + Playwright):

- Main thread scan from `<img>`
- Worker mode scan from `<img>`
- Ref detach stops scanning
- `equalityFn` gates `onScan` (fires once despite multiple frames)

No Node unit tests — the internal modules (`scanLoop`, `workerDecode`, `helpers`) rely heavily on browser APIs (`OffscreenCanvas`, `requestAnimationFrame`, `Worker`, etc.) and are adequately covered by the integration tests.
