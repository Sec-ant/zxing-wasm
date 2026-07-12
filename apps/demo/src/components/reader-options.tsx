import { Combobox } from "@base-ui/react/combobox";
import { Select } from "@base-ui/react/select";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  BARCODE_FORMATS,
  BINARIZERS,
  CHARACTER_SETS,
  EAN_ADD_ON_SYMBOLS,
  type ReaderOptions,
  TEXT_MODES,
} from "zxing-wasm/reader";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconPlus from "~icons/lucide/plus";

type CompleteReaderOptions = Required<ReaderOptions>;

function OptionTooltip({
  children,
  description,
  disabled = false,
}: {
  children: ReactElement;
  description: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip.Root disableHoverablePopup disabled={disabled}>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner
          align="start"
          collisionPadding={12}
          side="top"
          sideOffset={8}
        >
          <Tooltip.Popup className="z-50 max-w-72 rounded-lg border border-(--line) bg-(--paper) px-2.5 py-2 text-left text-xs leading-5 text-(--ink) shadow-lg shadow-black/15">
            {description}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function OverflowText({
  className,
  value,
}: {
  className: string;
  value: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const update = () => {
      setIsOverflowing(element.scrollWidth > element.clientWidth);
    };
    update();
    const animationFrame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  });

  const text = (
    <span className={className} ref={ref}>
      {value}
    </span>
  );
  return (
    <OptionTooltip description={value} disabled={!isOverflowing}>
      {text}
    </OptionTooltip>
  );
}

function CheckboxField({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <OptionTooltip description={description}>
      <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-2 outline-none transition hover:border-(--line) hover:bg-(--paper) focus-within:border-(--signal) focus-within:bg-(--paper)">
        <input
          className="peer sr-only"
          checked={checked}
          type="checkbox"
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="grid size-5 shrink-0 place-items-center rounded-md border border-(--ink) bg-(--paper) text-transparent transition peer-checked:border-(--signal) peer-checked:bg-(--signal) peer-checked:text-(--paper) peer-focus-visible:outline-3 peer-focus-visible:outline-[color-mix(in_srgb,var(--signal)_28%,transparent)]">
          <IconCheck
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={2.5}
          />
        </span>
        <span className="block text-[13px] font-semibold leading-4.5 text-(--ink)">
          {label}
        </span>
      </label>
    </OptionTooltip>
  );
}

function Field({
  children,
  description,
  label,
}: {
  children: ReactNode;
  description: string;
  label: string;
}) {
  return (
    <div className="grid min-w-0 gap-1.5 text-xs font-medium text-(--muted)">
      <OptionTooltip description={description}>
        <div className="flex min-h-4 items-center">
          <span className="whitespace-nowrap">{label}</span>
        </div>
      </OptionTooltip>
      {children}
    </div>
  );
}

const inputClassName =
  "min-h-9 w-full rounded-lg border border-(--line) bg-(--paper) px-2.5 text-sm text-(--ink) outline-none transition hover:border-(--muted) focus:border-(--signal) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--signal)_20%,transparent)]";
const selectTriggerClassName =
  "flex min-h-9 min-w-0 w-full items-center justify-between rounded-lg border border-(--line) bg-(--paper) px-2.5 text-left text-sm text-(--ink) outline-none transition hover:border-(--muted) focus:border-(--signal) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--signal)_20%,transparent)]";

type FormatValue = CompleteReaderOptions["formats"][number];

const formatOptions = [...BARCODE_FORMATS] as FormatValue[];

function FormatValueDisplay({ selected }: { selected: FormatValue[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const tooltipText = selected.join(", ");

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const update = () => {
      setIsOverflowing(
        selected.length > 2 || element.scrollWidth > element.clientWidth,
      );
    };
    update();
    const animationFrame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  });

  return (
    <OptionTooltip description={tooltipText} disabled={!isOverflowing}>
      <span
        className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
        ref={ref}
      >
        {selected.slice(0, 2).map((format) => (
          <span
            className="min-w-0 truncate rounded bg-(--paper-deep) px-1.5 py-0.5 font-(family-name:--mono) text-[10px] text-(--ink)"
            key={format}
          >
            {format}
          </span>
        ))}
        {selected.length > 2 ? (
          <span className="shrink-0 text-xs text-(--muted)">
            +{selected.length - 2}
          </span>
        ) : null}
      </span>
    </OptionTooltip>
  );
}

function FormatPicker({
  onValueChange,
  value,
}: {
  onValueChange: (value: FormatValue[]) => void;
  value: FormatValue[];
}) {
  return (
    <Combobox.Root
      items={formatOptions}
      modal={false}
      multiple
      value={value}
      onValueChange={(nextValue) =>
        onValueChange((nextValue ?? []) as FormatValue[])
      }
    >
      <OptionTooltip description="Restrict scanning to specific canonical barcode formats. Leave this empty to search every supported format.">
        <div className="flex items-center">
          <Combobox.Label className="block text-sm font-semibold text-(--ink)">
            Barcode formats
          </Combobox.Label>
        </div>
      </OptionTooltip>
      <Combobox.Trigger className="mt-1.5 flex min-h-9 w-full items-center justify-between rounded-lg border border-(--line) bg-(--paper) px-2.5 text-left text-sm text-(--ink) outline-none transition hover:border-(--muted) focus-visible:border-(--signal) focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--signal)_20%,transparent)]">
        <Combobox.Value>
          {(selected: FormatValue[]) => {
            if (selected.length === 0) {
              return "All supported formats";
            }
            return <FormatValueDisplay selected={selected} />;
          }}
        </Combobox.Value>
        <Combobox.Icon className="ml-3 shrink-0 text-(--muted)">
          <IconChevronDown aria-hidden="true" className="size-3.5" />
        </Combobox.Icon>
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner
          align="start"
          className="w-(--anchor-width)"
          sideOffset={6}
        >
          <Combobox.Popup
            aria-label="Choose barcode formats"
            className="z-50 w-full rounded-xl border border-(--ink) bg-(--paper) p-1.5 shadow-lg shadow-black/10"
          >
            <div className="flex items-center gap-2 border-b border-(--line) px-1 pb-1.5">
              <Combobox.Input
                aria-label="Search barcode formats"
                className="min-h-9 min-w-0 flex-1 bg-transparent px-1 text-sm text-(--ink) outline-none placeholder:text-(--muted)"
                placeholder="Search formats"
              />
              {value.length > 0 ? (
                <Combobox.Clear className="min-h-8 rounded-md border border-(--line) px-2 font-(family-name:--mono) text-[10px] font-semibold text-(--signal) hover:border-(--signal)">
                  Clear
                </Combobox.Clear>
              ) : null}
            </div>
            <Combobox.List className="max-h-72 overflow-y-auto overscroll-contain py-1">
              {(format: FormatValue) => (
                <Combobox.Item
                  key={format}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-(--ink) outline-none data-highlighted:bg-(--paper-deep)"
                  value={format}
                >
                  <span className="grid size-4 place-items-center rounded border border-(--line) text-(--signal)">
                    <Combobox.ItemIndicator>
                      <IconCheck
                        aria-hidden="true"
                        className="size-3"
                        strokeWidth={2.5}
                      />
                    </Combobox.ItemIndicator>
                  </span>
                  {format}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function SelectField<Value extends string>({
  description,
  label,
  onValueChange,
  value,
  values,
}: {
  description: string;
  label: string;
  onValueChange: (value: Value) => void;
  value: Value;
  values: readonly Value[];
}) {
  return (
    <Field description={description} label={label}>
      <Select.Root
        items={values.map((item) => ({ label: item, value: item }))}
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue !== null) {
            onValueChange(nextValue as Value);
          }
        }}
      >
        <Select.Trigger aria-label={label} className={selectTriggerClassName}>
          <Select.Value className="block min-w-0 flex-1 overflow-hidden text-left">
            {(selectedValue: Value | null) => (
              <OverflowText
                className="block min-w-0 w-full truncate"
                key={selectedValue ?? ""}
                value={selectedValue ?? ""}
              />
            )}
          </Select.Value>
          <Select.Icon className="ml-2 shrink-0 text-(--muted)">
            <IconChevronDown aria-hidden="true" className="size-3.5" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            align="start"
            alignItemWithTrigger={false}
            className="w-(--anchor-width)"
            sideOffset={4}
          >
            <Select.Popup className="z-50 max-h-72 w-full overflow-y-auto rounded-xl border border-(--line) bg-(--paper) p-1.5 shadow-lg shadow-black/10">
              <Select.List className="w-full">
                {values.map((item) => (
                  <Select.Item
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-(--ink) outline-none data-highlighted:bg-(--paper-deep)"
                    key={item}
                    value={item}
                  >
                    <Select.ItemText className="min-w-0 w-full flex-1 overflow-hidden">
                      <OverflowText
                        className="block min-w-0 w-full truncate"
                        value={item}
                      />
                    </Select.ItemText>
                    <Select.ItemIndicator className="shrink-0 text-(--signal)">
                      <IconCheck
                        aria-hidden="true"
                        className="size-3.5"
                        strokeWidth={2.5}
                      />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Field>
  );
}

export function ReaderOptionsPanel({
  onChange,
  onReset,
  options,
}: {
  onChange: <K extends keyof CompleteReaderOptions>(
    key: K,
    value: CompleteReaderOptions[K],
  ) => void;
  onReset: () => void;
  options: CompleteReaderOptions;
}) {
  return (
    <Tooltip.Provider closeDelay={0} delay={180} timeout={700}>
      <aside className="border-b border-(--line) bg-(--paper-deep) p-4 lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:overflow-y-auto lg:scrollbar-gutter-stable lg:border-r lg:border-b-0 lg:py-5 lg:pr-2 lg:pl-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-(--ink)">
              Scan settings
            </h2>
            <p className="mt-1 text-xs leading-5 text-(--muted)">
              Changes apply to the next scan.
            </p>
          </div>
          <button
            className="min-h-9 px-2 text-xs font-semibold text-(--signal) outline-none transition hover:bg-(--paper) focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--signal)_24%,transparent)]"
            type="button"
            onClick={onReset}
          >
            Reset
          </button>
        </div>

        <div className="border-y border-(--line) py-4">
          <FormatPicker
            value={options.formats as FormatValue[]}
            onValueChange={(value) => onChange("formats", value)}
          />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-2 gap-y-1.5 border-b border-(--line) py-3">
          <CheckboxField
            checked={options.tryHarder}
            description="Spend more time trying to find a barcode. This favors accuracy over speed."
            label="Try harder"
            onChange={(value) => onChange("tryHarder", value)}
          />
          <CheckboxField
            checked={options.tryRotate}
            description="Also scan images rotated by 90, 180, and 270 degrees."
            label="Try rotated"
            onChange={(value) => onChange("tryRotate", value)}
          />
          <CheckboxField
            checked={options.tryInvert}
            description="Also scan inverted codes when the selected format supports reversed reflectance."
            label="Try inverted"
            onChange={(value) => onChange("tryInvert", value)}
          />
          <CheckboxField
            checked={options.tryDownscale}
            description="Also scan a downscaled version of sufficiently large images."
            label="Try downscale"
            onChange={(value) => onChange("tryDownscale", value)}
          />
        </div>

        <details className="group/details">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-(--ink) outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--signal)_24%,transparent)]">
            Advanced options
            <span className="grid size-6 place-items-center text-(--muted) transition group-open/details:rotate-45">
              <IconPlus aria-hidden="true" className="size-4" />
            </span>
          </summary>
          <div className="grid gap-4 pb-1 pt-1">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-2 gap-y-1.5">
              <CheckboxField
                checked={options.tryDenoise}
                description="Try a morphological denoising pass for 2D symbologies. This option is experimental."
                label="Try denoise"
                onChange={(value) => onChange("tryDenoise", value)}
              />
              <CheckboxField
                checked={options.isPure}
                description="Use only for an image containing one perfectly aligned barcode, typically a generated image."
                label="Pure barcode"
                onChange={(value) => onChange("isPure", value)}
              />
              <CheckboxField
                checked={options.validateOptionalChecksum}
                description="Validate optional checksums where the barcode format supports them, such as Code39 and ITF."
                label="Validate optional checksum"
                onChange={(value) =>
                  onChange("validateOptionalChecksum", value)
                }
              />
              <CheckboxField
                checked={options.returnErrors}
                description="Include barcode candidates with decoding errors, such as checksum failures, in the results."
                label="Return decode errors"
                onChange={(value) => onChange("returnErrors", value)}
              />
              <CheckboxField
                checked={options.tryCode39ExtendedMode}
                description="Deprecated compatibility option. It no longer changes decoding behavior; choose Code39Ext or Code39Std in barcode formats instead."
                label="Code39 extended mode"
                onChange={(value) => onChange("tryCode39ExtendedMode", value)}
              />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-2.5 gap-y-4">
              <SelectField
                description="Choose the grayscale-to-binary thresholding algorithm used before decoding."
                label="Binarizer"
                value={options.binarizer}
                values={BINARIZERS}
                onValueChange={(value) => onChange("binarizer", value)}
              />
              <SelectField
                description="Controls how decoded bytes are rendered into the result text field."
                label="Text mode"
                value={options.textMode}
                values={TEXT_MODES}
                onValueChange={(value) => onChange("textMode", value)}
              />
              <SelectField
                description="Choose a character set when applicable. Unknown lets ZXing auto-detect it."
                label="Character set"
                value={options.characterSet}
                values={CHARACTER_SETS}
                onValueChange={(value) => onChange("characterSet", value)}
              />
              <SelectField
                description="Ignore, read, or require EAN-2 and EAN-5 add-on symbols on EAN and UPC codes."
                label="EAN / UPC add-on"
                value={options.eanAddOnSymbol}
                values={EAN_ADD_ON_SYMBOLS}
                onValueChange={(value) => onChange("eanAddOnSymbol", value)}
              />
              <Field
                description="Start downscaled scanning when the smaller image dimension reaches this pixel threshold."
                label="Downscale threshold"
              >
                <input
                  className={inputClassName}
                  max="65535"
                  min="0"
                  type="number"
                  value={options.downscaleThreshold}
                  onChange={(event) =>
                    onChange("downscaleThreshold", Number(event.target.value))
                  }
                />
              </Field>
              <Field
                description="Scale factor for downscaled scanning. Values 2, 3, and 4 are meaningful."
                label="Downscale factor"
              >
                <input
                  className={inputClassName}
                  max="255"
                  min="0"
                  type="number"
                  value={options.downscaleFactor}
                  onChange={(event) =>
                    onChange("downscaleFactor", Number(event.target.value))
                  }
                />
              </Field>
              <Field
                description="Minimum number of matching scan lines required to accept a linear barcode result."
                label="Minimum line count"
              >
                <input
                  className={inputClassName}
                  max="255"
                  min="0"
                  type="number"
                  value={options.minLineCount}
                  onChange={(event) =>
                    onChange("minLineCount", Number(event.target.value))
                  }
                />
              </Field>
              <Field
                description="Maximum number of barcodes to detect. Set 0 to remove the limit."
                label="Maximum symbols"
              >
                <input
                  className={inputClassName}
                  max="255"
                  min="0"
                  type="number"
                  value={options.maxNumberOfSymbols}
                  onChange={(event) =>
                    onChange("maxNumberOfSymbols", Number(event.target.value))
                  }
                />
              </Field>
            </div>
          </div>
        </details>
      </aside>
    </Tooltip.Provider>
  );
}
