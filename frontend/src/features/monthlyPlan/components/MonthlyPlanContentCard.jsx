import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";
import {
  formatCategory,
  formatPlatform,
  formatStatus,
  statusTone,
} from "../../../lib/format";
import { ContentThumbnail } from "../../content/components/ContentThumbnail";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

function PlatformDot({ platform }) {
  return (
    <span
      title={formatPlatform(platform)}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-ink"
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", PLATFORM_DOT[platform] || "bg-muted")}
      />
      {formatPlatform(platform)}
    </span>
  );
}

function ArrowIcon() {
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
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

function formatScheduleDate(iso, timezone, locale) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    const dateStr = new Intl.DateTimeFormat(locale, {
      timeZone: timezone || "UTC",
      month: "short",
      day: "numeric",
    }).format(date);
    const timeStr = new Intl.DateTimeFormat(locale, {
      timeZone: timezone || "UTC",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
    return `${dateStr} · ${timeStr}`;
  } catch {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
}

function ScheduleInfo({ schedules, locale }) {
  const { t } = useTranslation(["common", "pages", "status"]);
  if (!schedules || schedules.length === 0) return null;

  const first = schedules[0];
  const dateLabel = formatScheduleDate(first.scheduledAt, first.timezone, locale);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-canvas p-2.5">
      {dateLabel && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink">
          <CalendarIcon />
          {dateLabel}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {first.platform && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                PLATFORM_DOT[first.platform] || "bg-muted"
              )}
            />
            {formatPlatform(first.platform)}
          </span>
        )}
        {first.publishMode && (
          <span className="text-[10px] text-muted">
            ·{" "}
            {t(`calendar.publishModes.${first.publishMode}`, {
              ns: "pages",
              defaultValue: first.publishMode,
            })}
          </span>
        )}
      </div>
      {schedules.length > 1 && (
        <p className="text-[10px] text-muted">
          {t("monthlyPlan.card.plusMore", {
            ns: "pages",
            count: schedules.length - 1,
          })}
        </p>
      )}
    </div>
  );
}

export function MonthlyPlanContentCard({ item }) {
  const { t, i18n } = useTranslation(["common", "pages", "status"]);
  const locale = i18n.resolvedLanguage || i18n.language;
  const platforms = Array.isArray(item.platforms) ? item.platforms : [];
  const schedules = item._schedules;

  return (
    <Card
      padding="none"
      className="group flex h-full flex-col overflow-hidden transition hover:border-ink/20"
    >
      <ContentThumbnail title={item.title} category={item.category} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={statusTone(item.status)}>
            {formatStatus(item.status, t)}
          </Badge>
          <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
            {formatCategory(item.category, t)}
          </span>
        </div>

        <h3 className="flex-1 font-display text-lg leading-snug text-ink">
          {item.title || t("untitled", { ns: "common" })}
        </h3>

        {schedules && schedules.length > 0 && (
          <ScheduleInfo schedules={schedules} locale={locale} />
        )}

        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((platform) => (
              <PlatformDot key={platform} platform={platform} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
          <Link
            to={`/content/${item.id}`}
            className="inline-flex items-center gap-1 font-medium text-ink transition group-hover:gap-2 hover:text-accent"
          >
            {t("monthlyPlan.card.openContent", { ns: "pages" })}
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </Card>
  );
}
