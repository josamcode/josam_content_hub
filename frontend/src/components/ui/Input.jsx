import { forwardRef, useId } from "react";

import { cn } from "../../lib/cn";

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    id,
    className,
    leftSlot,
    rightSlot,
    type = "text",
    ...props
  },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wide text-muted"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-surface px-3 transition",
          "border-border focus-within:border-ink/30 focus-within:ring-2 focus-within:ring-accent/15",
          error && "border-danger/60 focus-within:border-danger focus-within:ring-danger/20"
        )}
      >
        {leftSlot && (
          <span className="shrink-0 text-muted">{leftSlot}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none",
            className
          )}
          {...props}
        />
        {rightSlot && (
          <span className="shrink-0 text-muted">{rightSlot}</span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
});
