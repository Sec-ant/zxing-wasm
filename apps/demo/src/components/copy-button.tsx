import { useEffect, useRef, useState } from "react";

type CopyButtonProps = {
  copiedLabel: string;
  idleLabel: string;
  timeoutMs?: number;
  value: string;
  onAfterCopy?: () => void;
  className?: string;
};

export function CopyButton({
  className,
  copiedLabel,
  idleLabel,
  timeoutMs = 1200,
  value,
  onAfterCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
    }, timeoutMs);

    onAfterCopy?.();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button className={className} type="button" onClick={() => void copy()}>
      {copied ? copiedLabel : idleLabel}
    </button>
  );
}
