import { forwardRef, useId, useRef, useState } from "react";

import { cn } from "../../lib/cn";

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M6 18 18 6" />
    </svg>
  );
}

function normalizeRaw(raw, { prefix } = {}) {
  let value = raw.trim();
  if (!value) return null;
  if (prefix && value.startsWith(prefix)) {
    value = value.slice(prefix.length).trim();
  }
  return value.length > 0 ? value : null;
}

function splitChunks(raw) {
  return raw
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export const TagInput = forwardRef(function TagInput(
  {
    label,
    hint,
    error,
    id,
    value = [],
    onChange,
    placeholder = "Type and press Enter",
    prefix,
    maxTags,
    className,
  },
  _ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  const addMany = (raws) => {
    const next = [...value];
    const seen = new Set(value);
    for (const raw of raws) {
      const clean = normalizeRaw(raw, { prefix });
      if (!clean) continue;
      if (seen.has(clean)) continue;
      if (maxTags && next.length >= maxTags) break;
      next.push(clean);
      seen.add(clean);
    }
    if (next.length !== value.length) {
      onChange(next);
    }
  };

  const commitDraft = () => {
    if (!draft.trim()) return;
    addMany(splitChunks(draft));
    setDraft("");
  };

  const removeAt = (index) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Tab" && draft.trim()) {
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  const handlePaste = (event) => {
    const text = event.clipboardData?.getData("text");
    if (text && /[\s,]/.test(text)) {
      event.preventDefault();
      addMany(splitChunks(text));
      setDraft("");
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {(label || maxTags) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="text-xs font-medium uppercase tracking-wide text-muted"
            >
              {label}
            </label>
          )}
          <span className="text-[11px] tabular-nums text-muted">
            {value.length}
            {maxTags ? ` / ${maxTags}` : ""}
          </span>
        </div>
      )}
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-surface px-2 py-1.5 transition",
          "border-border focus-within:border-ink/30 focus-within:ring-2 focus-within:ring-accent/15",
          error &&
            "border-danger/60 focus-within:border-danger focus-within:ring-danger/20",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((entry, index) => (
          <span
            key={`${entry}-${index}`}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-canvas px-2 py-0.5 text-[12px] text-ink"
          >
            <span>
              {prefix}
              {entry}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeAt(index);
              }}
              className="flex h-4 w-4 items-center justify-center rounded-full text-muted hover:bg-border hover:text-ink"
              aria-label={`Remove ${entry}`}
            >
              <XIcon />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={commitDraft}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[8ch] bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
        />
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
});
