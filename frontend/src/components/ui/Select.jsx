import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "../../lib/cn";

function ChevronIcon({ open }) {
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
      className={cn("transition-transform", open && "rotate-180")}
    >
      <path d="m6 9 6 6 6-6" />
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

function setRef(ref, node) {
  if (typeof ref === "function") {
    ref(node);
  } else if (ref && typeof ref === "object") {
    ref.current = node;
  }
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
    onBlur,
    name,
    disabled,
    required,
  },
  ref
) {
  const autoId = useId();
  const triggerId = id || autoId;
  const listboxId = `${triggerId}-listbox`;

  const triggerRef = useRef(null);
  const listboxRef = useRef(null);
  const optionRefs = useRef([]);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedIndex = useMemo(
    () => options.findIndex((opt) => opt.value === value),
    [options, value]
  );

  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const displayLabel = selectedOption?.label ?? placeholder ?? "";
  const isPlaceholder = !selectedOption;

  const emit = useCallback(
    (nextValue) => {
      if (typeof onChange === "function") {
        onChange({ target: { value: nextValue, name } });
      }
    },
    [onChange, name]
  );

  const closeAndBlur = useCallback(() => {
    setOpen((prev) => {
      if (prev && typeof onBlur === "function") {
        onBlur({ target: { value, name } });
      }
      return false;
    });
  }, [onBlur, name, value]);

  // Outside click closes
  useEffect(() => {
    if (!open) return undefined;

    function handleDocClick(event) {
      const trigger = triggerRef.current;
      const listbox = listboxRef.current;
      if (
        trigger &&
        !trigger.contains(event.target) &&
        listbox &&
        !listbox.contains(event.target)
      ) {
        closeAndBlur();
      }
    }

    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [open, closeAndBlur]);

  // When opening, initialize the active index to the current selection (or 0)
  useEffect(() => {
    if (open) {
      const initial = selectedIndex >= 0 ? selectedIndex : 0;
      setActiveIndex(initial);
    } else {
      setActiveIndex(-1);
    }
  }, [open, selectedIndex]);

  // Keep the active option in view as it changes
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = optionRefs.current[activeIndex];
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  const selectIndex = (index) => {
    if (index < 0 || index >= options.length) return;
    const opt = options[index];
    if (!opt) return;
    emit(opt.value);
    closeAndBlur();
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
    }
    if (!open) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndBlur();
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown") {
      setActiveIndex((i) => Math.min(options.length - 1, (i < 0 ? -1 : i) + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      setActiveIndex((i) => Math.max(0, (i < 0 ? options.length : i) - 1));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectIndex(activeIndex);
      return;
    }
    if (event.key === "Tab") {
      closeAndBlur();
    }
  };

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
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
          }}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-left text-sm transition",
            "border-border hover:border-ink/20",
            "focus:outline-none focus-visible:border-ink/30 focus-visible:ring-2 focus-visible:ring-accent/15",
            open && "border-ink/30 ring-2 ring-accent/15",
            error && "border-danger/60 focus-visible:border-danger focus-visible:ring-danger/20",
            disabled && "cursor-not-allowed opacity-60",
            className
          )}
        >
          <span
            className={cn(
              "truncate",
              isPlaceholder ? "text-muted" : "text-ink"
            )}
          >
            {displayLabel}
          </span>
          <span className="shrink-0 text-muted">
            <ChevronIcon open={open} />
          </span>
        </button>

        {open && (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={label ? triggerId : undefined}
            className={cn(
              "absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg",
              "ring-1 ring-ink/5"
            )}
          >
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">No options</li>
            ) : (
              options.map((opt, index) => {
                const isSelected = opt.value === value;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={`${opt.value}-${index}`}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => {
                      // Prevent the trigger from losing focus before click fires.
                      event.preventDefault();
                    }}
                    onClick={() => selectIndex(index)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition",
                      isActive
                        ? "bg-canvas text-ink"
                        : "text-ink hover:bg-canvas",
                      isSelected && "font-medium"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <span className="shrink-0 text-accent">
                        <CheckIcon />
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
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
