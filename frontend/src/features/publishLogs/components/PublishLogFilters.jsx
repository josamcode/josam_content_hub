import { Button } from "../../../components/ui/Button";
import { DatePicker } from "../../../components/ui/DatePicker";
import { Select } from "../../../components/ui/Select";
import { PLATFORMS, formatPlatform, formatStatus } from "../../../lib/format";
import { ATTEMPT_STATUSES } from "../lib/attemptStatus";

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  ...PLATFORMS.map((value) => ({ value, label: formatPlatform(value) })),
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...ATTEMPT_STATUSES.map((value) => ({ value, label: formatStatus(value) })),
];

export function PublishLogFilters({
  platform,
  status,
  from,
  to,
  onChange,
  onReset,
  isFetching,
}) {
  const hasAny = Boolean(platform || status || from || to);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
        <DatePicker
          label="From"
          value={from}
          onChange={(e) => onChange({ from: e.target.value })}
          max={to || undefined}
        />
        <DatePicker
          label="To"
          value={to}
          onChange={(e) => onChange({ to: e.target.value })}
          min={from || undefined}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {isFetching ? "Refreshing logs…" : "Filters apply automatically"}
        </p>
        {hasAny && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
