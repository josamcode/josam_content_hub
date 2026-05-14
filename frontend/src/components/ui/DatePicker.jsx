import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "../../lib/cn";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseISODate(value) {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function toISODate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function getMonthMatrix(viewDate) {
  const first = startOfMonth(viewDate);
  const startWeekday = first.getDay();
  const gridStart = new Date(
    first.getFullYear(),
    first.getMonth(),
    1 - startWeekday
  );
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(
      new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i
      )
    );
  }
  return days;
}

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

const dayDisplayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
});

function getWeekdayLabels() {
  const ref = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, i) =>
    weekdayFormatter
      .format(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + i))
      .slice(0, 2)
  );
}

function ChevronLeft() {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CalendarIcon() {
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
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

export const DatePicker = forwardRef(function DatePicker(
  {
    id,
    label,
    hint,
    error,
    placeholder = "Select date",
    value,
    onChange,
    onBlur,
    name,
    disabled,
    className,
    min,
    max,
  },
  ref
) {
  const autoId = useId();
  const triggerId = id || autoId;
  const popoverId = `${triggerId}-popover`;

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const selectedDate = useMemo(() => parseISODate(value), [value]);
  const minDate = useMemo(() => parseISODate(min), [min]);
  const maxDate = useMemo(() => parseISODate(max), [max]);

  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    startOfMonth(selectedDate || today)
  );

  useEffect(() => {
    if (open) {
      setViewDate(startOfMonth(selectedDate || today));
    }
  }, [open, selectedDate, today]);

  const weekdays = useMemo(getWeekdayLabels, []);
  const days = useMemo(() => getMonthMatrix(viewDate), [viewDate]);

  const emit = (nextValue) => {
    if (typeof onChange === "function") {
      onChange({ target: { value: nextValue, name, type: "date" } });
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

  function isOutOfRange(date) {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  function handleSelect(date) {
    if (isOutOfRange(date)) return;
    emit(toISODate(date));
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleClear() {
    emit("");
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleToday() {
    if (isOutOfRange(today)) return;
    emit(toISODate(today));
    setOpen(false);
    triggerRef.current?.focus();
  }

  const displayLabel = selectedDate
    ? dayDisplayFormatter.format(selectedDate)
    : placeholder;

  const isPlaceholder = !selectedDate;

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
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-left text-sm transition",
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
              <CalendarIcon />
            </span>
            <span
              className={cn(
                "truncate",
                isPlaceholder ? "text-muted" : "text-ink"
              )}
            >
              {displayLabel}
            </span>
          </span>
          {selectedDate && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear date"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleClear();
              }}
              className="ml-2 shrink-0 rounded p-0.5 text-muted hover:bg-canvas hover:text-ink"
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M6 18 18 6" />
              </svg>
            </span>
          )}
        </button>

        {open && (
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label="Choose date"
            className="absolute left-0 z-40 mt-1 w-[19rem] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-3 shadow-lg ring-1 ring-ink/5"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewDate((d) => addMonths(d, -1))}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                aria-label="Previous month"
              >
                <ChevronLeft />
              </button>
              <p className="text-sm font-medium text-ink">
                {monthFormatter.format(viewDate)}
              </p>
              <button
                type="button"
                onClick={() => setViewDate((d) => addMonths(d, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                aria-label="Next month"
              >
                <ChevronRight />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
              {weekdays.map((w) => (
                <span key={w} className="py-1">
                  {w}
                </span>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((date) => {
                const inMonth = date.getMonth() === viewDate.getMonth();
                const isToday = isSameDay(date, today);
                const isSelected =
                  selectedDate && isSameDay(date, selectedDate);
                const disabledDay = isOutOfRange(date);
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => handleSelect(date)}
                    disabled={disabledDay}
                    aria-pressed={isSelected || undefined}
                    aria-current={isToday ? "date" : undefined}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-md text-sm transition",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                      !inMonth && "text-muted/60",
                      inMonth && "text-ink",
                      !isSelected && !disabledDay && "hover:bg-canvas",
                      isToday && !isSelected && "ring-1 ring-border",
                      isSelected &&
                        "bg-accent text-white hover:bg-accent/90",
                      disabledDay && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
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
                onClick={handleToday}
                className="rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
              >
                Today
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
