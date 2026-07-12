import { type FormEvent, useState } from "react";

export function RemoteImageForm({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string>();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    try {
      await onSubmit(url);
      setUrl("");
    } catch (reason) {
      setError(`${reason instanceof Error ? reason.message : String(reason)}`);
    }
  };

  return (
    <form
      className="mt-3 grid gap-2 rounded-xl border border-(--line) bg-(--paper-deep)/45 p-3 sm:grid-cols-[1fr_auto]"
      onSubmit={submit}
    >
      <label className="grid gap-1 text-xs font-medium text-(--muted)">
        Image URL
        <input
          className="min-h-11 rounded-lg border border-(--line) bg-(--paper) px-3 text-sm text-(--ink) outline-none transition focus:border-(--signal) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--signal)_16%,transparent)]"
          disabled={disabled}
          inputMode="url"
          placeholder="https://example.com/barcode.webp"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
      </label>
      <button
        className="min-h-11 self-end rounded-lg border border-(--line) bg-(--paper) px-4 text-sm font-semibold text-(--ink) transition hover:border-(--ink) disabled:cursor-not-allowed disabled:text-(--muted)"
        disabled={disabled || url.length === 0}
        type="submit"
      >
        Fetch and scan
      </button>
      {error ? (
        <p className="text-xs leading-5 text-(--danger) sm:col-span-2">
          {error}
        </p>
      ) : null}
    </form>
  );
}
