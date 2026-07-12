import { Tooltip } from "@base-ui/react/tooltip";
import { useEffect, useState } from "react";
import {
  collapseAllNested,
  defaultStyles,
  JsonView,
} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import type { ReadResult } from "zxing-wasm/reader";
import { type FileSource, formatBytes } from "../lib/files";
import { CopyButton } from "./copy-button";

export type QueueStatus =
  | "queued"
  | "scanning"
  | "complete"
  | "empty"
  | "error";

export interface QueueItem {
  id: string;
  file: File;
  source: FileSource;
  status: QueueStatus;
  previewUrl?: string;
  results?: ReadResult[];
  decodeDuration?: number;
  error?: string;
}

const statusClassName: Record<QueueStatus, string> = {
  queued: "border-transparent bg-(--muted) text-(--paper)",
  scanning: "border-transparent bg-(--warning) text-(--on-status)",
  complete: "border-transparent bg-(--success) text-(--on-status)",
  empty: "border-transparent bg-(--muted) text-(--paper)",
  error: "border-transparent bg-(--danger) text-(--on-status)",
};

const jsonViewStyles = {
  ...defaultStyles,
  basicChildStyle: `${defaultStyles.basicChildStyle} min-w-0 break-all whitespace-pre-wrap py-0.5`,
  container:
    "min-w-0 max-w-full overflow-x-auto font-(family-name:--mono) text-xs leading-5 text-(--ink)",
  childFieldsContainer: `${defaultStyles.childFieldsContainer} max-w-full pl-2`,
  clickableLabel: `${defaultStyles.clickableLabel} cursor-pointer !text-(--ink) hover:!text-(--signal)`,
  collapseIcon: `${defaultStyles.collapseIcon} mr-1 inline-flex w-3.5 shrink-0 cursor-pointer items-center justify-center text-center !text-(--muted)`,
  collapsedContent: "text-(--muted)",
  expandIcon: `${defaultStyles.expandIcon} mr-1 inline-flex w-3.5 shrink-0 cursor-pointer items-center justify-center text-center !text-(--muted)`,
  label: `${defaultStyles.label} !text-(--ink)`,
  numberValue: "!text-(--signal)",
  punctuation: `${defaultStyles.punctuation} !text-(--muted)`,
  stringValue: `${defaultStyles.stringValue} !text-(--ink) break-all whitespace-pre-wrap`,
};

function hexPreview(bytes: Uint8Array) {
  const preview = [...bytes.slice(0, 48)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
  return `${preview}${bytes.length > 48 ? " ..." : ""}`;
}

type Point = {
  x: number;
  y: number;
};

function getResultCorners(result: ReadResult): Point[] {
  const { bottomLeft, bottomRight, topLeft, topRight } = result.position;
  return [topLeft, topRight, bottomRight, bottomLeft];
}

function formatCornerText(result: ReadResult) {
  const corners = [
    ["TL", result.position.topLeft],
    ["TR", result.position.topRight],
    ["BR", result.position.bottomRight],
    ["BL", result.position.bottomLeft],
  ] as const;
  return corners
    .map(([label, point]) => `${label}: ${formatCornerPoint(point)}`)
    .join("\n");
}

function formatCornerPoint(point: { x: number; y: number }) {
  return `${point.x.toFixed(0)},${point.y.toFixed(0)}`;
}

type ResultGeometry = {
  scaledPoints: Point[];
  pointsText: string;
  cornerPoints: { x: number; y: number }[];
};

function getResultGeometry(
  result: ReadResult,
  renderWidth: number,
  renderHeight: number,
  sourceWidth: number,
  sourceHeight: number,
): ResultGeometry {
  const { bottomLeft, bottomRight, topLeft, topRight } = result.position;
  const scaleX = sourceWidth === 0 ? 1 : renderWidth / sourceWidth;
  const scaleY = sourceHeight === 0 ? 1 : renderHeight / sourceHeight;

  const scaledPoints = getResultCorners(result).map((point) => ({
    x: point.x * scaleX,
    y: point.y * scaleY,
  }));

  return {
    scaledPoints,
    pointsText: scaledPoints.map(({ x, y }) => `${x},${y}`).join(" "),
    cornerPoints: [
      { x: topLeft.x * scaleX, y: topLeft.y * scaleY },
      { x: topRight.x * scaleX, y: topRight.y * scaleY },
      { x: bottomRight.x * scaleX, y: bottomRight.y * scaleY },
      { x: bottomLeft.x * scaleX, y: bottomLeft.y * scaleY },
    ],
  };
}

function ResultOutline({
  index,
  result,
  renderHeight,
  renderWidth,
  sourceHeight,
  sourceWidth,
}: {
  index: number;
  result: ReadResult;
  renderHeight: number;
  renderWidth: number;
  sourceHeight: number;
  sourceWidth: number;
}) {
  const { pointsText, cornerPoints } = getResultGeometry(
    result,
    renderWidth,
    renderHeight,
    sourceWidth,
    sourceHeight,
  );

  const outlineColor = "var(--danger)";
  const focusColor = "var(--warning)";

  return (
    <g>
      <polygon
        className="pointer-events-none"
        fill="none"
        points={pointsText}
        stroke={outlineColor}
        strokeDasharray="8 4"
        strokeWidth="2.8"
        vectorEffect="non-scaling-stroke"
      />
      <Tooltip.Root disableHoverablePopup>
        <Tooltip.Trigger
          render={
            <polygon
              aria-label={`Show corners for result ${index + 1}`}
              fill="none"
              points={pointsText}
              stroke="transparent"
              strokeWidth="14"
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: "stroke" }}
            />
          }
        />
        <Tooltip.Portal>
          <Tooltip.Positioner
            align="start"
            collisionPadding={12}
            side="top"
            sideOffset={8}
            className="z-140"
          >
            <Tooltip.Popup className="z-141 max-w-72 rounded-lg border border-(--line) bg-(--paper) px-2.5 py-2 text-left text-xs leading-5 text-(--ink) shadow-lg shadow-black/15">
              <p className="font-semibold">Detected corners</p>
              <p className="mt-1 whitespace-pre-wrap text-(--muted)">
                {formatCornerText(result)}
              </p>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      {cornerPoints.map((point, pointIndex) => {
        const label = ["TL", "TR", "BR", "BL"][pointIndex] ?? "";
        return (
          <g key={`${label}-label`}>
            <line
              className="pointer-events-none"
              opacity={0.4}
              stroke={focusColor}
              strokeWidth="1.5"
              x1={point.x - 10}
              x2={point.x + 10}
              y1={point.y - 10}
              y2={point.y + 10}
            />
            <line
              className="pointer-events-none"
              opacity={0.4}
              stroke={focusColor}
              strokeWidth="1.5"
              x1={point.x - 10}
              x2={point.x + 10}
              y1={point.y + 10}
              y2={point.y - 10}
            />
            {point.x >= 0 &&
            point.y >= 0 &&
            point.x <= renderWidth &&
            point.y <= renderHeight ? (
              <g aria-label={`${label} corner`}>
                <circle
                  className="pointer-events-none"
                  cx={point.x}
                  cy={point.y}
                  fill="var(--paper)"
                  r="4.6"
                  stroke={focusColor}
                  strokeWidth="1.5"
                />
                <circle
                  className="pointer-events-none"
                  cx={point.x}
                  cy={point.y}
                  fill={outlineColor}
                  r="2.4"
                />
              </g>
            ) : null}
          </g>
        );
      })}
      <text
        className="pointer-events-none"
        fill="var(--paper)"
        fontFamily="var(--mono)"
        fontSize="11"
        fontWeight="700"
        paintOrder="stroke"
        stroke={focusColor}
        strokeLinejoin="round"
        strokeWidth="5"
        x={cornerPoints[0].x + 8}
        y={cornerPoints[0].y + 14}
      >
        {index + 1}
      </text>
    </g>
  );
}

function AnnotatedImage({
  large = false,
  results,
  src,
}: {
  large?: boolean;
  results: ReadResult[];
  src: string;
}) {
  const [dimensions, setDimensions] = useState<{
    naturalHeight: number;
    naturalWidth: number;
    renderHeight: number;
    renderWidth: number;
  }>();

  return (
    <span
      className={`relative inline-block max-w-full ${large ? "max-h-[75vh]" : "max-h-28"}`}
    >
      <img
        alt=""
        className={`block max-w-full object-contain ${large ? "max-h-[75vh]" : "max-h-28"}`}
        src={src}
        onLoad={(event) =>
          setDimensions({
            naturalHeight: event.currentTarget.naturalHeight,
            naturalWidth: event.currentTarget.naturalWidth,
            renderHeight: event.currentTarget.getBoundingClientRect().height,
            renderWidth: event.currentTarget.getBoundingClientRect().width,
          })
        }
      />
      {dimensions ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
          viewBox={`0 0 ${dimensions.renderWidth} ${dimensions.renderHeight}`}
        >
          {results.map((result, index) => (
            <ResultOutline
              index={index}
              key={`${result.format}-${result.text}-${result.position.topLeft.x}-${result.position.topLeft.y}`}
              result={result}
              renderHeight={dimensions.renderHeight}
              renderWidth={dimensions.renderWidth}
              sourceHeight={dimensions.naturalHeight}
              sourceWidth={dimensions.naturalWidth}
            />
          ))}
        </svg>
      ) : null}
    </span>
  );
}

function ImagePreview({ item }: { item: QueueItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const results = item.results?.filter((result) => result.isValid) ?? [];

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  if (!item.previewUrl) {
    return <span className="text-xs text-(--muted)">No preview</span>;
  }

  return (
    <>
      <button
        type="button"
        aria-label={`View original ${item.file.name}`}
        className="group relative flex size-full cursor-zoom-in items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-(--signal)"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <AnnotatedImage results={results} src={item.previewUrl} />
        <span className="absolute bottom-1 rounded bg-(--ink)/65 px-1.5 py-0.5 text-[10px] font-semibold text-(--paper) opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          View original
        </span>
      </button>
      {isOpen ? (
        <div
          aria-label={`Original image for ${item.file.name}`}
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-(--paper)/82 p-4"
          role="dialog"
          onPointerDown={(event) => {
            if (event.currentTarget === event.target) {
              setIsOpen(false);
            }
          }}
        >
          <div className="relative max-h-full max-w-[min(96vw,1100px)] overflow-auto rounded-2xl bg-(--paper) p-3 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-(--ink)">
                  {item.file.name}
                </p>
                <p className="text-xs text-(--muted)">
                  {results.length} detection{results.length === 1 ? "" : "s"}{" "}
                  outlined
                </p>
              </div>
              <button
                className="min-h-9 rounded-lg border border-(--line) px-3 text-xs font-semibold text-(--ink) hover:bg-(--paper-deep)"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex justify-center rounded-xl bg-(--paper-deep) p-2">
              <AnnotatedImage large results={results} src={item.previewUrl} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ResultCard({ index, result }: { index: number; result: ReadResult }) {
  const isBinary = result.contentType === "Binary";
  const chip = (value: string) => (
    <span className="rounded-full border border-(--line) bg-(--paper-deep) px-2 py-1 text-xs text-(--ink)">
      {value}
    </span>
  );
  const textValue = result.text;
  const jsonValue = JSON.stringify(result, null, 2);
  const copyTextLabel = isBinary ? "Copy decoded text" : "Copy text";

  return (
    <article className="self-start rounded-xl border border-(--line) bg-(--paper) p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-(--signal) font-(family-name:--mono) text-[11px] font-semibold text-(--paper)">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-(--ink)">
              Result {index + 1}
            </p>
            <p className="text-xs text-(--muted)">
              Parsed barcode payload from detection area
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-(--signal)/35 bg-(--signal-soft) px-2.5 py-1 font-(family-name:--mono) text-[11px] font-semibold text-(--signal-deep)">
            {result.format}
          </span>
          <span className="rounded-full border border-(--line) bg-(--paper-deep) px-2 py-1 text-xs text-(--ink)">
            {isBinary ? "Binary" : "Text"} payload
          </span>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-(--line) bg-(--paper-deep)/55 px-2.5 py-2">
          <p className="text-[11px] font-medium tracking-wide text-(--muted)">
            Content type
          </p>
          <p className="mt-0.5 font-(family-name:--mono) text-xs text-(--ink)">
            {result.contentType}
          </p>
        </div>
        <div className="rounded-lg border border-(--line) bg-(--paper-deep)/55 px-2.5 py-2">
          <p className="text-[11px] font-medium tracking-wide text-(--muted)">
            Orientation
          </p>
          <p className="mt-0.5 font-(family-name:--mono) text-xs text-(--ink)">
            {result.orientation}°
          </p>
        </div>
        <div className="rounded-lg border border-(--line) bg-(--paper-deep)/55 px-2.5 py-2">
          <p className="text-[11px] font-medium tracking-wide text-(--muted)">
            Payload
          </p>
          <p className="mt-0.5 font-(family-name:--mono) text-xs text-(--ink)">
            {isBinary
              ? `${result.bytes.length} bytes`
              : `${result.text.length} chars`}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        {result.symbologyIdentifier
          ? chip(`Symbology: ${result.symbologyIdentifier}`)
          : null}
        {result.hasECI ? chip("ECI enabled") : null}
        {result.isMirrored ? chip("Mirrored") : null}
        {result.isInverted ? chip("Inverted") : null}
      </div>

      <div className="mt-2 flex gap-2">
        <CopyButton
          className="min-h-8 cursor-pointer rounded-md border border-(--line) bg-(--paper) px-2.5 text-xs font-semibold text-(--action) transition hover:bg-(--paper-deep) hover:text-(--action) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--signal)"
          copiedLabel="Copied text"
          idleLabel={copyTextLabel}
          value={textValue}
        />
        <CopyButton
          className="min-h-8 cursor-pointer rounded-md border border-(--line) bg-(--paper) px-2.5 text-xs font-semibold text-(--action-deep) transition hover:bg-(--paper-deep) hover:text-(--action-deep) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--signal)"
          copiedLabel="Copied JSON"
          idleLabel="Copy JSON"
          value={jsonValue}
        />
      </div>
      <pre className="mt-3 max-w-full break-all overflow-x-auto rounded-lg border border-(--line) bg-(--code-bg) p-3.5 font-(family-name:--mono) text-xs leading-5 whitespace-pre-wrap text-(--code-fg)">
        {isBinary ? hexPreview(result.bytes) : result.text || "(empty result)"}
      </pre>
      {isBinary ? (
        <p className="mt-2 text-xs leading-5 text-(--muted)">
          Binary payload: {result.bytes.length} bytes.
        </p>
      ) : null}

      <details className="mt-3 rounded-lg border border-(--line) bg-(--paper-deep)/55 p-2.5">
        <summary className="cursor-pointer text-xs font-medium text-(--muted)">
          Full result object
        </summary>
        <div className="mt-2 overflow-x-auto rounded-md bg-(--paper) p-3">
          <JsonView
            compactTopLevel
            clickToExpandNode
            data={result}
            shouldExpandNode={collapseAllNested}
            style={jsonViewStyles}
          />
        </div>
      </details>
    </article>
  );
}

export function ScanResults({
  isScanning,
  items,
  onClear,
  onRemove,
  onRescan,
  onRescanItem,
}: {
  isScanning: boolean;
  items: QueueItem[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onRescan: () => void;
  onRescanItem: (item: QueueItem) => void;
}) {
  const sourceLabel: Record<FileSource, string> = {
    drop: "Drop",
    paste: "Paste",
    upload: "Upload",
    folder: "Folder",
    url: "URL",
  };

  return (
    <Tooltip.Provider closeDelay={0} delay={180} timeout={700}>
      <section className="mt-5 border-t border-(--ink) pt-4" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-(--ink)">
                Scan queue
              </h2>
              <span className="rounded-full border border-(--line) bg-(--paper-deep) px-2 py-0.5 font-(family-name:--mono) text-[11px] font-semibold text-(--muted)">
                {items.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-(--muted)">
              {items.length === 0
                ? "Add an image to start testing the reader."
                : `${items.length} file${items.length === 1 ? "" : "s"} in this session.`}
            </p>
          </div>
          {items.length > 0 ? (
            <div className="flex gap-1 text-sm">
              <button
                className="min-h-9 rounded-lg px-2.5 font-semibold text-(--action) transition hover:bg-(--paper-deep) hover:text-(--action-deep)"
                disabled={isScanning}
                type="button"
                onClick={onRescan}
              >
                Rescan all ({items.length})
              </button>
              <button
                className="min-h-9 rounded-lg px-2.5 font-semibold text-(--danger) transition hover:bg-(--paper-deep) hover:text-(--danger-deep)"
                type="button"
                onClick={onClear}
              >
                Clear queue
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 border-t border-(--line) pt-3">
          {items.map((item) => {
            const validResults =
              item.results?.filter((result) => result.isValid) ?? [];
            return (
              <article
                className="grid min-w-0 content-start gap-3 rounded-xl border border-(--line) bg-(--paper) p-3 transition hover:border-(--muted) hover:bg-(--paper-deep)/25 sm:grid-cols-[6.5rem_minmax(0,1fr)]"
                key={item.id}
              >
                <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg border border-(--line) bg-(--paper-deep)">
                  <ImagePreview item={item} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3
                        className="truncate text-sm font-semibold text-(--ink)"
                        title={item.file.name}
                      >
                        {item.file.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-(--muted)">
                        <span className="grid min-h-7 min-w-0 grid-cols-[auto_1fr] items-center gap-x-1 rounded-full border border-(--line) bg-(--paper) px-2">
                          <span className="font-medium text-(--ink)">Size</span>
                          <span className="font-(family-name:--mono) tabular-nums">
                            {formatBytes(item.file.size)}
                          </span>
                        </span>
                        <span className="grid min-h-7 min-w-0 grid-cols-[auto_1fr] items-center gap-x-1 rounded-full border border-(--line) bg-(--paper) px-2">
                          <span className="font-medium text-(--ink)">
                            Source
                          </span>
                          <span>{sourceLabel[item.source]}</span>
                        </span>
                        {item.decodeDuration !== undefined ? (
                          <span className="rounded-full border border-(--line) bg-(--paper) px-2 py-0.5 font-(family-name:--mono) text-[10px] text-(--ink)">
                            decode {item.decodeDuration.toFixed(1)} ms
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 font-(family-name:--mono) text-[10px] font-semibold uppercase ${statusClassName[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      className="min-h-8 rounded-md px-2 text-xs font-semibold text-(--action) transition hover:bg-(--paper-deep) hover:text-(--action-deep) disabled:cursor-not-allowed disabled:text-(--muted)"
                      disabled={isScanning}
                      type="button"
                      onClick={() => onRescanItem(item)}
                    >
                      Rescan file
                    </button>
                    <button
                      aria-label={`Remove ${item.file.name}`}
                      className="min-h-8 rounded-md px-2 text-xs font-semibold text-(--danger) transition hover:bg-(--paper-deep) hover:text-(--danger-deep)"
                      type="button"
                      onClick={() => onRemove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="min-w-0 sm:col-span-2">
                  {item.status === "scanning" ? (
                    <div className="h-1 overflow-hidden rounded bg-(--paper-deep)">
                      <div className="h-full w-2/3 animate-pulse bg-(--warning)" />
                    </div>
                  ) : null}
                  {item.status === "error" ? (
                    <p className="rounded-lg border border-(--danger)/30 bg-(--danger-soft) p-2.5 text-sm leading-6 text-(--danger-deep)">
                      {item.error}
                    </p>
                  ) : null}
                  {item.status === "empty" ? (
                    <p className="text-sm text-(--muted)">
                      No barcode found with the current options.
                    </p>
                  ) : null}
                  <div
                    className={`grid gap-3 ${validResults.length > 1 ? "xl:grid-cols-2" : ""}`}
                  >
                    {validResults.map((result, index) => (
                      <ResultCard
                        index={index}
                        key={`${item.id}-${result.format}-${result.text}-${result.orientation}-${result.position.topLeft.x}-${result.position.topLeft.y}`}
                        result={result}
                      />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Tooltip.Provider>
  );
}
