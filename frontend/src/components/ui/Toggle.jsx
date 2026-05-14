import { forwardRef, useId } from "react";

import { cn } from "../../lib/cn";

const sizes = {
  sm: {
    track: "h-5 w-9",
    thumb: "h-4 w-4",
    translate: "translate-x-4",
  },
  md: {
    track: "h-6 w-11",
    thumb: "h-5 w-5",
    translate: "translate-x-5",
  },
};

export const Toggle = forwardRef(function Toggle(
  {
    id,
    checked = false,
    onChange,
    disabled = false,
    label,
    description,
    size = "md",
    name,
    className,
    onLabel,
    offLabel,
    showStateLabel = false,
  },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const dims = sizes[size] || sizes.md;

  function handleChange(event) {
    if (disabled) return;
    if (typeof onChange === "function") {
      onChange(event);
    }
  }

  function handleKeyDown(event) {
    if (disabled) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onChange?.({ target: { checked: !checked, name, type: "checkbox" } });
    }
  }

  const switchEl = (
    <span className="inline-flex items-center gap-2">
      <button
        ref={ref}
        type="button"
        role="switch"
        id={inputId}
        aria-checked={checked}
        aria-label={!label ? (checked ? "On" : "Off") : undefined}
        disabled={disabled}
        onClick={() =>
          handleChange({
            target: { checked: !checked, name, type: "checkbox" },
          })
        }
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          dims.track,
          checked
            ? "border-accent bg-accent"
            : "border-border bg-canvas",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block translate-x-0.5 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform",
            dims.thumb,
            checked && dims.translate
          )}
        />
      </button>
      {showStateLabel && (
        <span className="text-sm text-ink select-none">
          {checked ? onLabel || "On" : offLabel || "Off"}
        </span>
      )}
    </span>
  );

  if (!label && !description) {
    return switchEl;
  }

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex items-center justify-between gap-3",
        disabled && "cursor-not-allowed opacity-80"
      )}
    >
      <span className="flex min-w-0 flex-col">
        {label && (
          <span className="text-sm font-medium text-ink">{label}</span>
        )}
        {description && (
          <span className="text-xs text-muted">{description}</span>
        )}
      </span>
      {switchEl}
    </label>
  );
});
