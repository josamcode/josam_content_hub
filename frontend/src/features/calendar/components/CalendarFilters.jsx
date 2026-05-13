import { Select } from "../../../components/ui/Select";
import { PLATFORMS, formatPlatform, formatStatus } from "../../../lib/format";

const STATUSES = [
  "scheduled",
  "manual_pending",
  "manual_done",
  "cancelled",
  "failed",
];

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  ...PLATFORMS.map((value) => ({ value, label: formatPlatform(value) })),
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...STATUSES.map((value) => ({ value, label: formatStatus(value) })),
];

export function CalendarFilters({ platform, status, onChange, isFetching }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-end md:p-5">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Platform"
          value={platform}
          onChange={(e) => onChange({ platform: e.target.value })}
          options={PLATFORM_OPTIONS}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => onChange({ status: e.target.value })}
          options={STATUS_OPTIONS}
        />
      </div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted md:pl-4">
        {isFetching ? "Refreshing schedule…" : "Filters apply automatically"}
      </p>
    </div>
  );
}
