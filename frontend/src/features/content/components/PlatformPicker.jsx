import { cn } from "../../../lib/cn";
import { PLATFORMS, formatPlatform } from "../../../lib/format";

const PLATFORM_ACCENTS = {
  youtube: { dot: "bg-rose-500", ring: "ring-rose-300" },
  instagram: { dot: "bg-fuchsia-500", ring: "ring-fuchsia-300" },
  facebook: { dot: "bg-sky-500", ring: "ring-sky-300" },
  tiktok: { dot: "bg-zinc-900", ring: "ring-zinc-400" },
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17 19 7.5" />
    </svg>
  );
}

function PlatformToggle({ platform, checked, onToggle }) {
  const accent = PLATFORM_ACCENTS[platform] || {};

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onToggle(platform)}
      className={cn(
        "group relative flex items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        checked
          ? "border-ink/40 bg-canvas shadow-[0_1px_0_rgba(20,20,20,0.04)]"
          : "border-border hover:border-ink/20 hover:bg-canvas/60"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-white",
            accent.dot || "bg-muted"
          )}
          aria-hidden="true"
        >
          <span className="text-[11px] font-semibold leading-none">
            {formatPlatform(platform).charAt(0)}
          </span>
        </span>
        <div>
          <p className="text-sm font-medium text-ink">
            {formatPlatform(platform)}
          </p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {checked ? "Selected" : "Tap to include"}
          </p>
        </div>
      </div>

      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md border transition",
          checked
            ? "border-ink bg-ink text-canvas"
            : "border-border bg-surface text-transparent"
        )}
        aria-hidden="true"
      >
        <CheckIcon />
      </span>
    </button>
  );
}

export function PlatformPicker({ value = [], onChange, error, hint }) {
  const selected = new Set(value);

  const toggle = (platform) => {
    if (selected.has(platform)) {
      onChange(value.filter((p) => p !== platform));
    } else {
      onChange([...value, platform]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Target platforms
        </span>
        <span className="text-[11px] tabular-nums text-muted">
          {value.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <PlatformToggle
            key={platform}
            platform={platform}
            checked={selected.has(platform)}
            onToggle={toggle}
          />
        ))}
      </div>

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
