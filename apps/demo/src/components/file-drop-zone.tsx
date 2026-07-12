import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import IconLoaderCircle from "~icons/lucide/loader-circle";
import IconScanLine from "~icons/lucide/scan-line";
import {
  type FileSource,
  filesFromTransfer,
  imageUrlsFromTransfer,
} from "../lib/files";

function canCapturePaste(activeElement: Element | null): boolean {
  if (!(activeElement instanceof HTMLElement)) {
    return true;
  }

  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement
  ) {
    return false;
  }

  if (activeElement.isContentEditable) {
    return false;
  }

  if (
    activeElement.closest(
      "[contenteditable], [contenteditable=''], [contenteditable='true']",
    )
  ) {
    return false;
  }

  const role = activeElement.getAttribute("role");
  if (
    role === "textbox" ||
    role === "combobox" ||
    role === "searchbox" ||
    role === "listbox" ||
    role === "option" ||
    role === "menuitem" ||
    role === "checkbox" ||
    role === "radio" ||
    role === "button"
  ) {
    return false;
  }

  if (
    activeElement.closest(
      "[role='textbox'], [role='combobox'], [role='searchbox'], [role='listbox'], [role='option'], [role='menuitem'], [role='checkbox'], [role='radio'], [role='button']",
    ) !== null
  ) {
    return false;
  }

  return activeElement.closest("button") === null;
}

export function FileDropZone({
  disabled,
  onFiles,
  onImageUrls,
  onError,
}: {
  disabled: boolean;
  onFiles: (files: File[], source: FileSource) => void;
  onImageUrls: (urls: string[]) => Promise<void>;
  onError: (description: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResolvingDrop, setIsResolvingDrop] = useState(false);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const isDisabled = disabled || isResolvingDrop;

  const selectFiles = (
    event: ChangeEvent<HTMLInputElement>,
    source: FileSource,
  ) => {
    onFiles(Array.from(event.target.files ?? []), source);
    event.target.value = "";
  };

  const openFilePicker = useCallback(() => {
    if (isDisabled) {
      return;
    }
    fileInputRef.current?.click();
  }, [isDisabled]);

  const dropFiles = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (isDisabled) {
      return;
    }

    const files = await filesFromTransfer(event.dataTransfer);
    if (files.length > 0) {
      onFiles(files, "drop");
      return;
    }

    const imageUrls = imageUrlsFromTransfer(event.dataTransfer);
    if (imageUrls.length === 0) {
      onError(
        "No image content detected in this drop. Try an image file or image URL.",
      );
      return;
    }

    setIsResolvingDrop(true);
    try {
      await onImageUrls(imageUrls);
    } catch {
      onError(
        "This drop contains image URL(s), but the browser could not load them.",
      );
    } finally {
      setIsResolvingDrop(false);
    }
  };

  useEffect(() => {
    const onPaste = async (event: globalThis.ClipboardEvent) => {
      const activeElement = document.activeElement;
      if (isDisabled || !canCapturePaste(activeElement)) {
        return;
      }
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      const files = await filesFromTransfer(clipboardData);
      if (files.length > 0) {
        onFiles(files, "paste");
        return;
      }

      const imageUrls = imageUrlsFromTransfer(clipboardData);
      if (imageUrls.length === 0) {
        onError("Clipboard content is not a readable image source.");
        return;
      }

      setIsResolvingDrop(true);
      try {
        await onImageUrls(imageUrls);
      } catch {
        onError(
          "This clipboard content has image URL(s), but the browser could not load them.",
        );
      } finally {
        setIsResolvingDrop(false);
      }
    };

    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("paste", onPaste);
    };
  }, [isDisabled, onFiles, onImageUrls, onError]);

  return (
    <section
      aria-label="Image upload area"
      tabIndex={isDisabled ? -1 : 0}
      className={`relative overflow-hidden rounded-2xl border border-dashed p-4 transition focus-within:ring-2 focus-within:ring-(--signal) sm:p-5 ${
        isDragging
          ? "border-(--signal) bg-(--signal-soft)"
          : "border-(--line) bg-(--paper-deep)/55 hover:border-(--signal) hover:bg-(--paper-deep)"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDisabled) {
          dragDepthRef.current += 1;
          setIsDragging(true);
        }
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDisabled) {
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) {
            setIsDragging(false);
          }
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDisabled) {
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={dropFiles}
      onKeyDown={(event) => {
        if (isDisabled) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFilePicker();
        }
      }}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, input")) {
          return;
        }
        openFilePicker();
      }}
    >
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--ink) text-(--paper)">
            {isResolvingDrop ? (
              <IconLoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
            ) : (
              <IconScanLine aria-hidden="true" className="size-5" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-(--ink)">
              {isResolvingDrop
                ? "Fetching the dropped image..."
                : "Drop images, paste, or choose files."}
            </p>
            <p className="mt-1 text-xs leading-5 text-(--muted)">
              {isResolvingDrop
                ? "Trying browser-provided image sources."
                : "You can also paste an image URL directly."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            className="flex min-h-11 cursor-pointer items-center rounded-lg bg-(--ink) px-4 text-sm font-semibold text-(--paper) transition-colors hover:bg-(--ink)/85 hover:text-(--paper) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus) disabled:cursor-not-allowed disabled:bg-(--muted) disabled:text-(--paper)/55"
            disabled={isDisabled}
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose files
          </button>
          <button
            className="min-h-11 cursor-pointer rounded-lg border border-(--line) bg-(--paper) px-4 text-sm font-semibold text-(--ink) transition-colors hover:bg-(--paper-deep) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus) disabled:cursor-not-allowed disabled:text-(--muted)"
            disabled={isDisabled}
            type="button"
            onClick={() => folderInputRef.current?.click()}
          >
            Choose folder
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        accept="image/*"
        className="sr-only"
        multiple
        type="file"
        onChange={(event) => selectFiles(event, "upload")}
      />
      <input
        ref={(element) => {
          folderInputRef.current = element;
          element?.setAttribute("webkitdirectory", "");
          element?.setAttribute("directory", "");
        }}
        className="sr-only"
        multiple
        type="file"
        onChange={(event) => selectFiles(event, "folder")}
      />
    </section>
  );
}
