import { forwardRef, useId } from "react";

import { cn } from "../../lib/cn";

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    id,
    className,
    options = [],
    placeholder,
    value,
    onChange,
    ...props
  },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium uppercase tracking-wide text-muted"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "relative flex items-center rounded-lg border bg-surface transition",
          "border-border focus-within:border-ink/30 focus-within:ring-2 focus-within:ring-accent/15",
          error && "border-danger/60 focus-within:border-danger focus-within:ring-danger/20"
        )}
      >
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          className={cn(
            "h-10 w-full appearance-none bg-transparent pl-3 pr-8 text-sm text-ink focus:outline-none",
            (value === "" || value === undefined) && placeholder && "text-muted",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled={props.required}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 text-muted">
          <ChevronIcon />
        </span>
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
});
