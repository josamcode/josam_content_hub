import { useTranslation } from "react-i18next";

import { EmptyState } from "../../../components/ui/EmptyState";
import { PlatformBadge } from "./PlatformBadge";
import { cn } from "../../../lib/cn";
import { formatDateTime, formatRelative, formatTime } from "../utils";

function ReminderRow({ reminder, variant }) {
  const { t, i18n } = useTranslation("pages");
  const locale = i18n.resolvedLanguage || i18n.language;
  const isOverdue = variant === "overdue";
  return (
    <li
      className={cn(
        "flex items-start gap-3 py-3 first:pt-0 last:pb-0",
        isOverdue && "rounded-md"
      )}
    >
      <div
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          isOverdue ? "bg-rose-500" : "bg-accent"
        )}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p
          className={cn(
            "truncate text-sm",
            isOverdue ? "font-medium text-ink" : "text-ink"
          )}
        >
          {reminder.title}
        </p>
        <p className="truncate text-xs text-muted">{reminder.contentTitle}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <PlatformBadge platform={reminder.platform} />
          <span
            className={cn(
              "text-[11px]",
              isOverdue ? "font-medium text-rose-700" : "text-muted"
            )}
          >
            {isOverdue
              ? t("dashboard.reminders.wasDue", {
                  time: formatRelative(reminder.remindAt, locale),
                })
              : t("dashboard.reminders.timeWithRelative", {
                  time: formatTime(reminder.remindAt, locale),
                  relative: formatRelative(reminder.remindAt, locale),
                })}
          </span>
        </div>
      </div>
      <time
        className={cn(
          "shrink-0 text-[11px]",
          isOverdue ? "text-rose-700" : "text-muted"
        )}
        dateTime={reminder.remindAt}
      >
        {formatDateTime(reminder.remindAt, locale)}
      </time>
    </li>
  );
}

export function ReminderList({ reminders = [], variant = "today" }) {
  const { t } = useTranslation("pages");

  if (!reminders.length) {
    return (
      <EmptyState
        title={
          variant === "overdue"
            ? t("dashboard.empty.nothingOverdue.title")
            : t("dashboard.empty.noRemindersToday.title")
        }
        description={
          variant === "overdue"
            ? t("dashboard.empty.nothingOverdue.description")
            : t("dashboard.empty.noRemindersToday.description")
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {reminders.map((reminder) => (
        <ReminderRow
          key={reminder.id}
          reminder={reminder}
          variant={variant}
        />
      ))}
    </ul>
  );
}
