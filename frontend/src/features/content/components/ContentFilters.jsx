import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import {
  CONTENT_CATEGORIES,
  CONTENT_STATUSES,
  PLATFORMS,
  formatCategory,
  formatPlatform,
  formatStatus,
} from "../../../lib/format";

function toOptions(values, labeler) {
  return values.map((value) => ({ value, label: labeler(value) }));
}

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  ...toOptions(CONTENT_STATUSES, formatStatus),
];
const CATEGORY_OPTIONS = [
  { value: "", label: "Any category" },
  ...toOptions(CONTENT_CATEGORIES, formatCategory),
];
const PLATFORM_OPTIONS = [
  { value: "", label: "Any platform" },
  ...toOptions(PLATFORMS, formatPlatform),
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ContentFilters({
  search,
  status,
  category,
  platform,
  onChange,
  onReset,
  isFetching,
}) {
  const hasAny = Boolean(search || status || category || platform);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Input
          label="Search"
          placeholder="Search title, hook, script or notes"
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
          leftSlot={<SearchIcon />}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => onChange({ status: e.target.value })}
          options={STATUS_OPTIONS}
        />
        <Select
          label="Category"
          value={category}
          onChange={(e) => onChange({ category: e.target.value })}
          options={CATEGORY_OPTIONS}
        />
        <Select
          label="Platform"
          value={platform}
          onChange={(e) => onChange({ platform: e.target.value })}
          options={PLATFORM_OPTIONS}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {isFetching ? "Refreshing results…" : "Filters apply automatically"}
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
