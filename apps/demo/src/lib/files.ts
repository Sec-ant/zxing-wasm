export type FileSource = "upload" | "folder" | "drop" | "paste" | "url";

interface LegacyDirectoryReader {
  readEntries: (
    success: (entries: LegacyFileEntry[]) => void,
    failure?: (error: DOMException) => void,
  ) => void;
}

interface LegacyFileEntry extends FileSystemEntry {
  file?: (
    success: (file: File) => void,
    failure?: (error: DOMException) => void,
  ) => void;
  createReader?: () => LegacyDirectoryReader;
}

type EntryDataTransferItem = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntry | null;
};

export function createItemId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readEntries(
  reader: LegacyDirectoryReader,
): Promise<LegacyFileEntry[]> {
  const entries: LegacyFileEntry[] = [];
  while (true) {
    const batch = await new Promise<LegacyFileEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (batch.length === 0) {
      return entries;
    }
    entries.push(...batch);
  }
}

async function filesFromEntry(entry: LegacyFileEntry): Promise<File[]> {
  if (entry.isFile && entry.file) {
    return new Promise<File[]>((resolve, reject) => {
      entry.file?.((file) => resolve([file]), reject);
    });
  }
  if (entry.isDirectory && entry.createReader) {
    const entries = await readEntries(entry.createReader());
    return (await Promise.all(entries.map(filesFromEntry))).flat();
  }
  return [];
}

export async function filesFromTransfer(data: DataTransfer): Promise<File[]> {
  const itemFiles = [...data.items]
    .map((item) => item.getAsFile?.())
    .filter((file): file is File => file !== null);
  if (itemFiles.length > 0) {
    return itemFiles;
  }

  const entries = [...data.items]
    .map((item) => (item as EntryDataTransferItem).webkitGetAsEntry?.())
    .filter(
      (entry): entry is FileSystemEntry =>
        entry !== null && entry !== undefined,
    )
    .map((entry) => entry as LegacyFileEntry);
  return entries.length > 0
    ? (await Promise.all(entries.map(filesFromEntry))).flat()
    : [...data.files];
}

function supportedImageUrl(
  value: string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value.trim(), window.location.href);
    return ["data:", "http:", "https:"].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

function urlsFromUriList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function imageUrlsFromHtml(value: string): string[] {
  const document = new DOMParser().parseFromString(value, "text/html");
  return [...document.querySelectorAll("img")].flatMap((image) =>
    ["src", "data-src", "data-original", "data-lazy-src"]
      .map((attribute) => image.getAttribute(attribute))
      .filter((url): url is string => Boolean(url)),
  );
}

function nestedImageUrls(value: string): string[] {
  const url = supportedImageUrl(value);
  if (!url) {
    return [];
  }

  const parsed = new URL(url);
  const nestedUrls = ["imgurl", "mediaurl", "image_url", "image", "src"]
    .map((parameter) => supportedImageUrl(parsed.searchParams.get(parameter)))
    .filter((candidate): candidate is string => candidate !== undefined);

  return [...nestedUrls, url];
}

/**
 * Browsers normally expose a dragged webpage image as a URL, rather than as a
 * File. This is intentionally separate from filesFromTransfer: fetching the
 * URL must still obey the image host's CORS policy.
 */
export function imageUrlsFromTransfer(data: DataTransfer): string[] {
  const candidates = [
    ...imageUrlsFromHtml(data.getData("text/html")),
    ...urlsFromUriList(data.getData("text/x-moz-url-data")),
    ...urlsFromUriList(data.getData("text/x-moz-url")),
    ...urlsFromUriList(data.getData("text/uri-list")),
    ...urlsFromUriList(data.getData("text/plain")),
  ].flatMap(nestedImageUrls);

  return [...new Set(candidates)];
}

export async function fileFromUrl(
  value: string,
  signal?: AbortSignal,
): Promise<File> {
  const url = new URL(value);
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("The URL did not return an image");
  }
  const filename =
    url.protocol === "data:"
      ? "dropped-image"
      : decodeURIComponent(url.pathname.split("/").at(-1) || "remote-image");
  return new File([blob], filename, { type: blob.type });
}

export async function firstImageFileFromUrls(values: string[]): Promise<File> {
  const controller = new AbortController();
  try {
    return await Promise.any(
      values.map((value) => fileFromUrl(value, controller.signal)),
    );
  } finally {
    controller.abort();
  }
}
