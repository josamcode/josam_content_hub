import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import {
  CONTENT_CATEGORIES,
  PLATFORMS,
  formatCategory,
  formatPlatform,
} from "../../../lib/format";

function toOptions(values, labeler) {
  return values.map((value) => ({ value, label: labeler(value) }));
}

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

export function WorkflowFilters({
  search,
  category,
  platform,
  showSecondary,
  onChange,
  onReset,
  onToggleSecondary,
  isFetching,
}) {
  const hasAny = Boolean(search || category || platform);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
        <Input
          label="Search"
          placeholder="Search title, hook, script or notes"
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
          leftSlot={<SearchIcon />}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {isFetching ? "Refreshing board…" : "Filters apply automatically"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showSecondary ? "subtle" : "ghost"}
            size="sm"
            onClick={onToggleSecondary}
          >
            {showSecondary ? "Hide failed & archived" : "Show failed & archived"}
          </Button>
          {hasAny && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
