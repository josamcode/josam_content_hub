import { forwardRef, useId } from "react";

import { cn } from "../../lib/cn";

export const Textarea = forwardRef(function Textarea(
  {
    label,
    hint,
    error,
    id,
    className,
    rows = 4,
    counter,
    value,
    ...props
  },
  ref
) {
  const autoId = useId();
  const textareaId = id || autoId;
  const currentLength =
    typeof value === "string" ? value.length : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {(label || counter) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="text-xs font-medium uppercase tracking-wide text-muted"
            >
              {label}
            </label>
          )}
          {counter && typeof currentLength === "number" && (
            <span className="text-[11px] tabular-nums text-muted">
              {currentLength}
              {typeof counter === "number" ? ` / ${counter}` : ""}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "rounded-lg border bg-surface px-3 py-2 transition",
          "border-border focus-within:border-ink/30 focus-within:ring-2 focus-within:ring-accent/15",
          error &&
            "border-danger/60 focus-within:border-danger focus-within:ring-danger/20"
        )}
      >
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          value={value}
          className={cn(
            "w-full resize-y bg-transparent text-sm leading-relaxed text-ink placeholder:text-muted/70 focus:outline-none",
            className
          )}
          {...props}
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
