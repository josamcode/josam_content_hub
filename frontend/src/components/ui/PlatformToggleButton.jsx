import { cn } from "../../lib/cn";
import { PlatformIcon } from "./PlatformIcon";

const PLATFORM_LABELS = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
};

const PLATFORM_ACCENTS = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  tiktok: "bg-zinc-900",
  facebook: "bg-sky-500",
};

const sizes = {
  sm: {
    button: "h-9 px-3 text-xs gap-2",
    icon: "h-6 w-6",
    iconInner: "h-3.5 w-3.5",
  },
  md: {
    button: "h-11 px-3.5 text-sm gap-2.5",
    icon: "h-7 w-7",
    iconInner: "h-4 w-4",
  },
};

export function PlatformToggleButton({
  platform,
  selected = false,
  onClick,
  disabled = false,
  size = "md",
  label,
  className,
}) {
  const sz = sizes[size] || sizes.md;
  const displayLabel = label || PLATFORM_LABELS[platform] || platform;
  const accent = PLATFORM_ACCENTS[platform] || "bg-muted";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      aria-label={displayLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center justify-start rounded-lg border bg-surface font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        sz.button,
        selected
          ? "border-ink/40 bg-canvas text-ink shadow-[0_1px_0_rgba(20,20,20,0.04)]"
          : "border-border text-ink/80 hover:border-ink/20 hover:bg-canvas/60",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full text-white transition",
          sz.icon,
          selected ? accent : "bg-muted/60 group-hover:bg-muted"
        )}
      >
        <PlatformIcon platform={platform} className={sz.iconInner} />
      </span>
      <span className="truncate">{displayLabel}</span>
    </button>
  );
}
