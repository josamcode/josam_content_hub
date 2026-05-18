import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/cn";

function RemoveIcon() {
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

export function ArrayFieldEditor({ label, hint, value = [], onChange, placeholder }) {
  const { t } = useTranslation("pages");
  const autoId = useId();
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
    inputRef.current?.focus();
  };

  const removeAt = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={autoId}
            className="text-xs font-medium uppercase tracking-wide text-muted"
          >
            {label}
          </label>
          <span className="text-[11px] tabular-nums text-muted">
            {value.length}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <input
          id={autoId}
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || ""}
          className={cn(
            "flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 transition",
            "border-border focus:border-ink/30 focus:ring-2 focus:ring-accent/15 focus:outline-none"
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={!draft.trim()}
        >
          {t("aiBrandProfile.arrayEditor.add", { defaultValue: "Add" })}
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2.5 py-1 text-[12px] text-ink"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted hover:bg-border hover:text-ink transition"
                aria-label={t("aiBrandProfile.arrayEditor.remove", { defaultValue: "Remove" })}
              >
                <RemoveIcon />
              </button>
            </span>
          ))}
        </div>
      )}

      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
