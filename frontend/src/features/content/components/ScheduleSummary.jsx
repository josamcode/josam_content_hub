import { Badge } from "../../../components/ui/Badge";
import { cn } from "../../../lib/cn";
import { formatScheduledAtInTimezone } from "../../../lib/datetime";
import {
  formatPlatform,
  formatRelative,
  formatStatus,
  statusTone,
} from "../../../lib/format";

const REMINDER_MODES = new Set(["manual", "reminder"]);

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
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

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ScheduleSummary({ schedule, className }) {
  if (!schedule) return null;

  const expectsReminder =
    schedule.reminder !== undefined
      ? Boolean(schedule.reminder)
      : REMINDER_MODES.has(schedule.publishMode);

  const reminderStatus = schedule.reminder?.status;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-canvas/60 p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-ink"
        >
          <CalendarIcon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base text-ink">
              {formatScheduledAtInTimezone(
                schedule.scheduledAt,
                schedule.timezone
              )}
            </p>
            <Badge tone={statusTone(schedule.status)}>
              {formatStatus(schedule.status)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            {schedule.timezone} · {formatRelative(schedule.scheduledAt)}
            {schedule.platform ? ` · ${formatPlatform(schedule.platform)}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
          Publish mode · {schedule.publishMode || "manual"}
        </span>
        {expectsReminder && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
            <BellIcon />
            Reminder {reminderStatus ? formatStatus(reminderStatus).toLowerCase() : "scheduled"}
          </span>
        )}
      </div>
    </div>
  );
}
