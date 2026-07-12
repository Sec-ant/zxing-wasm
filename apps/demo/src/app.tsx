import { Toast } from "@base-ui/react/toast";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultReaderOptions,
  type ReaderOptions,
  ZXING_CPP_COMMIT,
  ZXING_WASM_VERSION,
} from "zxing-wasm/reader";
import IconBookOpen from "~icons/lucide/book-open";
import IconX from "~icons/lucide/x";
import { FileDropZone } from "./components/file-drop-zone";
import { ReaderOptionsPanel } from "./components/reader-options";
import { RemoteImageForm } from "./components/remote-image-form";
import { type QueueItem, ScanResults } from "./components/scan-results";
import { scanImageFile } from "./lib/decode";
import {
  createItemId,
  type FileSource,
  fileFromUrl,
  firstImageFileFromUrls,
} from "./lib/files";

type CompleteReaderOptions = Required<ReaderOptions>;
type ThemeMode = "dark" | "light" | "system";

const optionsDefaults = { ...defaultReaderOptions };
const themeModes: ThemeMode[] = ["system", "light", "dark"];

function DemoToasts() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal>
      <Toast.Viewport className="pointer-events-none fixed right-4 bottom-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-2">
        {toasts.map((toast) => (
          <Toast.Root
            className="pointer-events-auto rounded-xl border border-(--signal) bg-(--paper) shadow-xl shadow-black/15 transition-[opacity,transform] duration-150 data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0"
            key={toast.id}
            toast={toast}
          >
            <Toast.Content className="flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <Toast.Title className="text-sm font-semibold text-(--ink)">
                  {toast.title}
                </Toast.Title>
                <Toast.Description className="mt-1 text-xs leading-5 text-(--muted)">
                  {toast.description}
                </Toast.Description>
              </div>
              <Toast.Close
                aria-label="Dismiss notification"
                className="grid size-7 shrink-0 place-items-center rounded-md text-(--muted) outline-none hover:bg-(--paper-deep) hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--signal)"
              >
                <IconX aria-hidden="true" className="size-4" />
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function DemoApp() {
  const toastManager = Toast.useToastManager();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [options, setOptions] =
    useState<CompleteReaderOptions>(optionsDefaults);
  const [isScanning, setIsScanning] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const storedTheme = localStorage.getItem("zxing-wasm-demo-theme");
    return storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : "system";
  });
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (themeMode === "system") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = themeMode;
    }
    localStorage.setItem("zxing-wasm-demo-theme", themeMode);
  }, [themeMode]);

  const updateItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const scanItem = useCallback(
    async (item: QueueItem) => {
      updateItem(item.id, { error: undefined, status: "scanning" });
      try {
        const { decodeDuration, results } = await scanImageFile(
          item.file,
          options,
        );
        const validResults = results.filter((result) => result.isValid);
        const decodeError = results.find((result) => !result.isValid)?.error;
        updateItem(item.id, {
          decodeDuration,
          error: decodeError || undefined,
          results,
          status:
            validResults.length > 0
              ? "complete"
              : decodeError
                ? "error"
                : "empty",
        });
      } catch (reason) {
        updateItem(item.id, {
          error: reason instanceof Error ? reason.message : String(reason),
          status: "error",
        });
      }
    },
    [options, updateItem],
  );

  const queueFiles = useCallback(
    async (files: File[], source: FileSource) => {
      const seen = new Set(
        itemsRef.current.map(
          (item) =>
            `${item.file.name}/${item.file.size}/${item.file.lastModified}`,
        ),
      );
      const queued = files
        .filter((file) => file.size > 0)
        .filter(
          (file) => !seen.has(`${file.name}/${file.size}/${file.lastModified}`),
        )
        .map<QueueItem>((file) => ({
          id: createItemId(file),
          file,
          source,
          status: "queued",
          previewUrl: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        }));
      if (queued.length === 0) {
        return;
      }

      setItems((current) => [...queued, ...current]);
      setIsScanning(true);
      try {
        for (const item of queued) {
          await scanItem(item);
        }
      } finally {
        setIsScanning(false);
      }
    },
    [scanItem],
  );

  const patchOptions = <K extends keyof CompleteReaderOptions>(
    key: K,
    value: CompleteReaderOptions[K],
  ) => {
    setOptions((current) => ({ ...current, [key]: value }));
  };

  const clearItems = () => {
    for (const item of items) {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }
    setItems([]);
  };

  const removeItem = (id: string) => {
    const removed = items.find((item) => item.id === id);
    if (removed?.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const rescanAll = async () => {
    setIsScanning(true);
    try {
      for (const item of items) {
        await scanItem(item);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const scanRemoteImage = async (url: string) => {
    await queueFiles([await fileFromUrl(url)], "url");
  };

  const scanDroppedImage = async (urls: string[]) => {
    await queueFiles([await firstImageFileFromUrls(urls)], "url");
  };

  return (
    <main className="min-h-screen text-(--ink)">
      <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-(--line) bg-(--paper) px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 bg-(--signal)" />
          <span className="font-(family-name:--mono) text-xs font-semibold tracking-wide text-(--ink)">
            ZXing WASM reader
          </span>
          <span className="hidden text-xs text-(--muted) sm:inline">
            Scan an image, inspect its decoded symbols.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/docs/"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-(--muted) outline-none transition hover:bg-(--paper-deep) hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--signal)"
          >
            <IconBookOpen aria-hidden="true" className="size-3.5" />
            Docs
          </a>
          <fieldset
            aria-label="Color theme"
            className="flex rounded-lg border border-(--line) bg-(--paper-deep) p-0.5"
          >
            {themeModes.map((mode) => (
              <button
                aria-pressed={themeMode === mode}
                className={`min-h-7 cursor-pointer rounded-md px-2 text-[10px] font-semibold capitalize transition ${
                  themeMode === mode
                    ? "bg-(--paper) text-(--ink) shadow-sm"
                    : "text-(--muted) hover:text-(--ink)"
                }`}
                key={mode}
                type="button"
                onClick={() => setThemeMode(mode)}
              >
                {mode}
              </button>
            ))}
          </fieldset>
          <span className="hidden font-(family-name:--mono) text-[10px] tabular-nums text-(--muted) md:inline">
            wasm {ZXING_WASM_VERSION}{" "}
            <span className="mx-1 text-(--line)">/</span> cpp{" "}
            {ZXING_CPP_COMMIT.slice(0, 7)}
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-375 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)]">
        <ReaderOptionsPanel
          options={options}
          onChange={patchOptions}
          onReset={() => setOptions({ ...optionsDefaults })}
        />
        <div className="min-w-0 p-4 sm:p-6 lg:py-7 lg:pr-5 lg:pl-8 xl:pr-7 xl:pl-10">
          <FileDropZone
            disabled={isScanning}
            onError={(description) =>
              toastManager.add({
                description,
                priority: "high",
                timeout: 6000,
                title: "Could not scan dropped image",
                type: "error",
              })
            }
            onFiles={queueFiles}
            onImageUrls={scanDroppedImage}
          />
          <RemoteImageForm disabled={isScanning} onSubmit={scanRemoteImage} />
          <ScanResults
            isScanning={isScanning}
            items={items}
            onClear={clearItems}
            onRemove={removeItem}
            onRescan={() => void rescanAll()}
            onRescanItem={(item) => void scanItem(item)}
          />
        </div>
      </div>
      <DemoToasts />
    </main>
  );
}

export function App() {
  return (
    <Toast.Provider limit={3} timeout={7000}>
      <DemoApp />
    </Toast.Provider>
  );
}
