import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import {
  formatDateTime,
  formatPlatform,
  formatRelative,
  formatStatus,
  statusTone,
} from "../../../lib/format";

function pickPlatform(schedule) {
  return (
    schedule.platform ||
    schedule.platformPost?.platform ||
    "—"
  );
}

export function ScheduleSummary({ schedules = [] }) {
  if (!schedules.length) {
    return (
      <EmptyState
        title="No schedules yet"
        description="Once a platform version is scheduled, you'll see it summarized here."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {schedules.map((schedule) => {
        const platform = pickPlatform(schedule);
        return (
          <li
            key={schedule.id}
            className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm text-ink">
                {formatPlatform(platform)} ·{" "}
                <span className="text-muted">
                  {schedule.publishMode || "auto"}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {formatDateTime(schedule.scheduledAt)} ·{" "}
                {formatRelative(schedule.scheduledAt)}
              </p>
            </div>
            <Badge tone={statusTone(schedule.status)}>
              {formatStatus(schedule.status)}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
