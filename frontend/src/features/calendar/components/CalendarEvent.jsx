import { useTranslation } from "react-i18next";

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
  success: "border-s-emerald-500",
  warning: "border-s-amber-500",
  danger: "border-s-rose-500",
  accent: "border-s-accent",
  neutral: "border-s-muted",
};

export function CalendarEvent({ event, onClick, compact = true }) {
  const { t, i18n } = useTranslation(["common", "status"]);
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
  const tone =
    PLATFORM_TONE[event.platform] || "border-border bg-surface text-ink";
  const dot = PLATFORM_DOT[event.platform] || "bg-muted";
  const statusBorder =
    STATUS_BORDER[statusTone(event.status)] || STATUS_BORDER.neutral;
  const statusLabel = formatStatus(event.status, t);
  const title = event.contentTitle || t("untitled", { ns: "common" });

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      title={`${title} - ${formatPlatform(event.platform)} - ${statusLabel}`}
      className={cn(
        "w-full rounded-md border border-s-[3px] px-2 py-1 text-start text-[11px] transition",
        "hover:shadow-[0_1px_0_rgba(20,20,20,0.04)] hover:-translate-y-[0.5px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        tone,
        statusBorder
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)}
        />
        <span className="font-medium tabular-nums">
          {timeInTimezone(event.scheduledAt, event.timezone, locale)}
        </span>
        {!compact && (
          <span className="ms-auto text-[10px] uppercase tracking-[0.14em] opacity-70">
            {statusLabel}
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate font-medium text-ink">{title}</p>
    </button>
  );
}
