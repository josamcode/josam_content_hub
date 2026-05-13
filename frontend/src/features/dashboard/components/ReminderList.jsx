import { EmptyState } from "../../../components/ui/EmptyState";
import { PlatformBadge } from "./PlatformBadge";
import { formatDateTime, formatRelative, formatTime } from "../utils";

function ReminderRow({ reminder, variant }) {
  const isOverdue = variant === "overdue";
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <div
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: isOverdue
            ? "var(--color-danger)"
            : "var(--color-accent)",
        }}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm text-ink">{reminder.title}</p>
        <p className="truncate text-xs text-muted">
          {reminder.contentTitle}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <PlatformBadge platform={reminder.platform} />
          <span className="text-[11px] text-muted">
            {isOverdue
              ? `Was due ${formatRelative(reminder.remindAt)}`
              : `${formatTime(reminder.remindAt)} · ${formatRelative(reminder.remindAt)}`}
          </span>
        </div>
      </div>
      <time
        className="shrink-0 text-[11px] text-muted"
        dateTime={reminder.remindAt}
      >
        {formatDateTime(reminder.remindAt)}
      </time>
    </li>
  );
}

export function ReminderList({ reminders = [], variant = "today" }) {
  if (!reminders.length) {
    return (
      <EmptyState
        title={variant === "overdue" ? "Nothing overdue" : "No reminders today"}
        description={
          variant === "overdue"
            ? "You're caught up — nothing slipped past its window."
            : "A quiet day. Use it to push something forward."
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
