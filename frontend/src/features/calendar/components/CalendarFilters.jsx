import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Select } from "../../../components/ui/Select";
import { PLATFORMS, formatPlatform, formatStatus } from "../../../lib/format";

const STATUSES = [
  "scheduled",
  "manual_pending",
  "manual_done",
  "cancelled",
  "failed",
];

export function CalendarFilters({ platform, status, onChange, isFetching }) {
  const { t } = useTranslation(["common", "pages", "status"]);
  const platformOptions = useMemo(
    () => [
      {
        value: "",
        label: t("calendar.filters.allPlatforms", { ns: "pages" }),
      },
      ...PLATFORMS.map((value) => ({ value, label: formatPlatform(value) })),
    ],
    [t]
  );
  const statusOptions = useMemo(
    () => [
      {
        value: "",
        label: t("calendar.filters.allStatuses", { ns: "pages" }),
      },
      ...STATUSES.map((value) => ({ value, label: formatStatus(value, t) })),
    ],
    [t]
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-end md:p-5">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label={t("platform", { ns: "common" })}
          value={platform}
          onChange={(e) => onChange({ platform: e.target.value })}
          options={platformOptions}
        />
        <Select
          label={t("status", { ns: "common" })}
          value={status}
          onChange={(e) => onChange({ status: e.target.value })}
          options={statusOptions}
        />
      </div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted md:ps-4">
        {isFetching
          ? t("calendar.filters.refreshing", { ns: "pages" })
          : t("calendar.filters.autoApply", { ns: "pages" })}
      </p>
    </div>
  );
}
