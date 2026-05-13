import { useEffect, useRef, useState } from "react";

import { cn } from "../../../../lib/cn";

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17 19 7.5" />
    </svg>
  );
}

export function CopyButton({
  value,
  disabled,
  label = "Copy",
  copiedLabel = "Copied",
  className,
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Browser denied clipboard access — silently ignore for now.
    }
  };

  const isEmpty = !value || !String(value).trim();

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || isEmpty}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[11px] font-medium text-muted transition",
        "hover:border-ink/20 hover:text-ink",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted",
        className
      )}
      aria-live="polite"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
