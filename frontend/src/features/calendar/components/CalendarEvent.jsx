import { cn } from "../../../lib/cn";
import { formatPlatform, formatStatus, statusTone } from "../../../lib/format";
import { timeInTimezone } from "../lib/calendarMath";

const PLATFORM_TONE = {
  youtube: "border-rose-200 bg-rose-50 text-rose-900",
  instagram: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  facebook: "border-sky-200 bg-sky-50 text-sky-900",
  tiktok: "border-zinc-300 bg-zinc-100 text-zinc-900",
};

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

const STATUS_BORDER = {
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  danger: "border-l-rose-500",
  accent: "border-l-accent",
  neutral: "border-l-muted",
};

export function CalendarEvent({ event, onClick, compact = true }) {
  const tone = PLATFORM_TONE[event.platform] || "border-border bg-surface text-ink";
  const dot = PLATFORM_DOT[event.platform] || "bg-muted";
  const statusBorder = STATUS_BORDER[statusTone(event.status)] || STATUS_BORDER.neutral;

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      title={`${event.contentTitle} · ${formatPlatform(event.platform)} · ${formatStatus(event.status)}`}
      className={cn(
        "w-full rounded-md border border-l-[3px] px-2 py-1 text-left text-[11px] transition",
        "hover:shadow-[0_1px_0_rgba(20,20,20,0.04)] hover:-translate-y-[0.5px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        tone,
        statusBorder
      )}
    >
      <div className="flex items-center gap-1.5">
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
        <span className="font-medium tabular-nums">
          {timeInTimezone(event.scheduledAt, event.timezone)}
        </span>
        {!compact && (
          <span className="ml-auto text-[10px] uppercase tracking-[0.14em] opacity-70">
            {formatStatus(event.status)}
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate font-medium text-ink">
        {event.contentTitle || "Untitled"}
      </p>
    </button>
  );
}
