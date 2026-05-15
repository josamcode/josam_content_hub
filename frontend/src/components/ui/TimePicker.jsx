import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "../../lib/cn";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseTime(value) {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function formatTime(hour, minute) {
  return `${pad2(hour)}:${pad2(minute)}`;
}

function formatDisplay(value, use12h) {
  const parsed = parseTime(value);
  if (!parsed) return null;
  if (!use12h) {
    return formatTime(parsed.hour, parsed.minute);
  }
  const period = parsed.hour >= 12 ? "PM" : "AM";
  const h12 = parsed.hour % 12 || 12;
  return `${h12}:${pad2(parsed.minute)} ${period}`;
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function setRef(ref, node) {
  if (typeof ref === "function") {
    ref(node);
  } else if (ref && typeof ref === "object") {
    ref.current = node;
  }
}

export const TimePicker = forwardRef(function TimePicker(
  {
    id,
    label,
    hint,
    error,
    placeholder = "Select time",
    value,
    onChange,
    onBlur,
    name,
    disabled,
    className,
    minuteStep = 5,
    use12h = false,
  },
  ref
) {
  const autoId = useId();
  const triggerId = id || autoId;
  const popoverId = `${triggerId}-popover`;

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const hourColRef = useRef(null);
  const minuteColRef = useRef(null);

  const parsed = useMemo(() => parseTime(value), [value]);
  const [open, setOpen] = useState(false);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => {
    const step = Math.max(1, Math.min(30, minuteStep));
    const list = [];
    for (let m = 0; m < 60; m += step) list.push(m);
    if (parsed && !list.includes(parsed.minute)) {
      list.push(parsed.minute);
      list.sort((a, b) => a - b);
    }
    return list;
  }, [minuteStep, parsed]);

  const emit = (nextValue) => {
    if (typeof onChange === "function") {
      onChange({ target: { value: nextValue, name, type: "time" } });
    }
  };

  const close = () => {
    setOpen((prev) => {
      if (prev && typeof onBlur === "function") {
        onBlur({ target: { value: value || "", name } });
      }
      return false;
    });
  };

  useEffect(() => {
    if (!open) return undefined;

    function handleDocClick(event) {
      const trigger = triggerRef.current;
      const pop = popoverRef.current;
      if (
        trigger &&
        !trigger.contains(event.target) &&
        pop &&
        !pop.contains(event.target)
      ) {
        close();
      }
    }

    function handleKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const scrollSelected = (container) => {
      if (!container) return;
      const selected = container.querySelector('[data-selected="true"]');
      if (selected && typeof selected.scrollIntoView === "function") {
        selected.scrollIntoView({ block: "center" });
      }
    };
    requestAnimationFrame(() => {
      scrollSelected(hourColRef.current);
      scrollSelected(minuteColRef.current);
    });
  }, [open, parsed?.hour, parsed?.minute]);

  function selectHour(h) {
    const minute = parsed ? parsed.minute : 0;
    emit(formatTime(h, minute));
  }

  function selectMinute(m) {
    const hour = parsed ? parsed.hour : 0;
    emit(formatTime(hour, m));
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleClear() {
    emit("");
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleNow() {
    const now = new Date();
    const minute = parsed ? parsed.minute : 0;
    const safeMinute =
      minutes.length > 0
        ? minutes.reduce((closest, candidate) =>
            Math.abs(candidate - now.getMinutes()) <
            Math.abs(closest - now.getMinutes())
              ? candidate
              : closest
          )
        : now.getMinutes();
    emit(formatTime(now.getHours(), parsed ? minute : safeMinute));
    setOpen(false);
    triggerRef.current?.focus();
  }

  const displayLabel = formatDisplay(value, use12h) || placeholder;
  const isPlaceholder = !parsed;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={triggerId}
          className="text-xs font-medium uppercase tracking-wide text-muted"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={(node) => {
            triggerRef.current = node;
            setRef(ref, node);
          }}
          type="button"
          id={triggerId}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={popoverId}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
          }}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-start text-sm transition",
            "border-border hover:border-ink/20",
            "focus:outline-none focus-visible:border-ink/30 focus-visible:ring-2 focus-visible:ring-accent/15",
            open && "border-ink/30 ring-2 ring-accent/15",
            error &&
              "border-danger/60 focus-visible:border-danger focus-visible:ring-danger/20",
            disabled && "cursor-not-allowed opacity-60",
            className
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-muted">
              <ClockIcon />
            </span>
            <span
              className={cn(
                "truncate tabular-nums",
                isPlaceholder ? "text-muted" : "text-ink"
              )}
            >
              {displayLabel}
            </span>
          </span>
        </button>

        {open && (
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label="Choose time"
            className="absolute start-0 z-40 mt-1 w-56 rounded-xl border border-border bg-surface p-3 shadow-lg ring-1 ring-ink/5"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                  Hour
                </p>
                <ul
                  ref={hourColRef}
                  className="max-h-48 overflow-y-auto rounded-md border border-border bg-canvas/30"
                >
                  {hours.map((h) => {
                    const isSelected = parsed?.hour === h;
                    return (
                      <li key={h}>
                        <button
                          type="button"
                          data-selected={isSelected || undefined}
                          onClick={() => selectHour(h)}
                          className={cn(
                            "flex w-full items-center justify-center px-2 py-1.5 text-sm tabular-nums transition",
                            "focus:outline-none focus-visible:bg-canvas",
                            isSelected
                              ? "bg-accent text-white"
                              : "text-ink hover:bg-canvas"
                          )}
                        >
                          {use12h ? (h % 12 || 12) : pad2(h)}
                          {use12h && (
                            <span className="ms-1 text-[10px] text-muted/80">
                              {h >= 12 ? "PM" : "AM"}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex flex-col">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                  Minute
                </p>
                <ul
                  ref={minuteColRef}
                  className="max-h-48 overflow-y-auto rounded-md border border-border bg-canvas/30"
                >
                  {minutes.map((m) => {
                    const isSelected = parsed?.minute === m;
                    return (
                      <li key={m}>
                        <button
                          type="button"
                          data-selected={isSelected || undefined}
                          onClick={() => selectMinute(m)}
                          className={cn(
                            "flex w-full items-center justify-center px-2 py-1.5 text-sm tabular-nums transition",
                            "focus:outline-none focus-visible:bg-canvas",
                            isSelected
                              ? "bg-accent text-white"
                              : "text-ink hover:bg-canvas"
                          )}
                        >
                          {pad2(m)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md px-2 py-1 text-xs text-muted hover:bg-canvas hover:text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleNow}
                className="rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
              >
                Now
              </button>
            </div>
          </div>
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
