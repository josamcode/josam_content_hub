import { useMemo } from "react";
import { useTranslation } from "react-i18next";

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

export function MonthlyPlanFilters({
  search,
  status,
  category,
  platform,
  onChange,
  onReset,
  isFetching,
}) {
  const { t } = useTranslation(["common", "pages", "status"]);
  const hasAny = Boolean(search || status || category || platform);

  const statusOptions = useMemo(
    () => [
      {
        value: "",
        label: t("monthlyPlan.filters.anyStatus", { ns: "pages" }),
      },
      ...toOptions(CONTENT_STATUSES, (value) => formatStatus(value, t)),
    ],
    [t]
  );
  const categoryOptions = useMemo(
    () => [
      {
        value: "",
        label: t("monthlyPlan.filters.anyCategory", { ns: "pages" }),
      },
      ...toOptions(CONTENT_CATEGORIES, (value) => formatCategory(value, t)),
    ],
    [t]
  );
  const platformOptions = useMemo(
    () => [
      {
        value: "",
        label: t("monthlyPlan.filters.anyPlatform", { ns: "pages" }),
      },
      ...toOptions(PLATFORMS, formatPlatform),
    ],
    [t]
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Input
          label={t("search", { ns: "common" })}
          placeholder={t("monthlyPlan.filters.searchPlaceholder", { ns: "pages" })}
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
          leftSlot={<SearchIcon />}
        />
        <Select
          label={t("status", { ns: "common" })}
          value={status}
          onChange={(e) => onChange({ status: e.target.value })}
          options={statusOptions}
        />
        <Select
          label={t("category", { ns: "common" })}
          value={category}
          onChange={(e) => onChange({ category: e.target.value })}
          options={categoryOptions}
        />
        <Select
          label={t("platform", { ns: "common" })}
          value={platform}
          onChange={(e) => onChange({ platform: e.target.value })}
          options={platformOptions}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {isFetching
            ? t("monthlyPlan.filters.refreshing", { ns: "pages" })
            : t("monthlyPlan.filters.autoApply", { ns: "pages" })}
        </p>
        {hasAny && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            {t("clearFilters", { ns: "common" })}
          </Button>
        )}
      </div>
    </div>
  );
}
