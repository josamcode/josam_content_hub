import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";
import { formatScheduledAtInTimezone } from "../../../lib/datetime";
import {
  formatPlatform,
  formatRelative,
  formatStatus,
  statusTone,
} from "../../../lib/format";
import { CopyTextButton } from "./CopyTextButton";
import { ManualCompleteForm } from "./ManualCompleteForm";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

function formatHashtagsForCopy(values) {
  if (!Array.isArray(values) || values.length === 0) return "";
  return values
    .map((value) => {
      const trimmed = String(value || "").trim();
      if (!trimmed) return null;
      return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    })
    .filter(Boolean)
    .join(" ");
}

function PlatformChip({ platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-ink">
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          PLATFORM_DOT[platform] || "bg-muted"
        )}
      />
      {formatPlatform(platform)}
    </span>
  );
}

export function ReminderCard({ reminder }) {
  const { t, i18n } = useTranslation(["common", "pages", "status"]);
  const platformPost = reminder.platformPost || {};
  const contentItem = reminder.contentItem || {};
  const schedule = reminder.schedule || {};
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";

  const timezone = schedule.timezone || "Africa/Cairo";
  const isOverdue =
    reminder.status === "pending" && new Date(reminder.remindAt) < new Date();
  const showForm = reminder.status === "pending" && Boolean(platformPost.id);

  const hashtags = Array.isArray(platformPost.hashtags)
    ? platformPost.hashtags
    : [];
  const hashtagsCopyValue = formatHashtagsForCopy(hashtags);

  return (
    <Card
      padding="none"
      className={cn(
        "overflow-hidden border-s-[3px]",
        isOverdue ? "border-s-rose-500" : "border-s-transparent"
      )}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformChip platform={platformPost.platform} />
            <Badge tone={statusTone(reminder.status)}>
              {formatStatus(reminder.status, t)}
            </Badge>
            {platformPost.status && (
              <Badge tone={statusTone(platformPost.status)}>
                {t("reminders.card.postStatus", {
                  ns: "pages",
                  status: formatStatus(platformPost.status, t),
                })}
              </Badge>
            )}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                {t("reminders.tabs.overdue", { ns: "pages" })}
              </span>
            )}
          </div>
          <div className="text-end">
            <p className="text-sm text-ink">
              {formatScheduledAtInTimezone(reminder.remindAt, timezone)}
            </p>
            <p className="text-[11px] text-muted">
              {timezone} - {formatRelative(reminder.remindAt, locale)}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="font-display text-xl leading-snug text-ink line-clamp-2">
            {reminder.title || t("reminders.card.titleFallback", { ns: "pages" })}
          </h3>
          {contentItem.title && (
            <p className="mt-1 text-sm text-muted">
              {t("reminders.card.from", { ns: "pages" })}{" "}
              <Link
                to={`/content/${contentItem.id}`}
                className="font-medium text-ink hover:underline"
              >
                {contentItem.title}
              </Link>
            </p>
          )}
        </div>

        {platformPost.caption ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("reminders.card.caption", { ns: "pages" })}
              </span>
              <CopyTextButton
                value={platformPost.caption}
                label={t("reminders.actions.copyCaption", { ns: "pages" })}
                copiedLabel={t("reminders.actions.copied", { ns: "pages" })}
              />
            </div>
            <p className="whitespace-pre-wrap rounded-lg border border-border bg-canvas/60 p-3 text-sm leading-relaxed text-ink line-clamp-6">
              {platformPost.caption}
            </p>
          </div>
        ) : null}

        {hashtags.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("reminders.card.hashtags", { ns: "pages" })}
              </span>
              <CopyTextButton
                value={hashtagsCopyValue}
                label={t("reminders.actions.copyHashtags", { ns: "pages" })}
                copiedLabel={t("reminders.actions.copied", { ns: "pages" })}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="inline-flex items-center rounded-full border border-border bg-canvas px-2 py-0.5 text-[12px] text-ink"
                >
                  {String(tag).startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {contentItem.id ? (
            <Button
              as={Link}
              to={`/content/${contentItem.id}`}
              variant="outline"
              size="sm"
            >
              {t("openContent", { ns: "common" })}
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t("openContent", { ns: "common" })}
            </Button>
          )}
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-canvas/40 p-4">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("reminders.card.markPublishedTitle", { ns: "pages" })}
            </p>
            <ManualCompleteForm
              platformPostId={platformPost.id}
              scheduleId={schedule.id}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
