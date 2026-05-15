import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { DatePicker } from "../../../components/ui/DatePicker";
import { Select } from "../../../components/ui/Select";
import { PLATFORMS, formatPlatform } from "../../../lib/format";
import { ATTEMPT_STATUSES, attemptStatusLabel } from "../lib/attemptStatus";

export function PublishLogFilters({
  platform,
  status,
  from,
  to,
  onChange,
  onReset,
  isFetching,
}) {
  const { t } = useTranslation(["common", "pages"]);
  const hasAny = Boolean(platform || status || from || to);

  const platformOptions = useMemo(
    () => [
      {
        value: "",
        label: t("publishLogs.filters.allPlatforms", { ns: "pages" }),
      },
      ...PLATFORMS.map((value) => ({ value, label: formatPlatform(value) })),
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      {
        value: "",
        label: t("publishLogs.filters.allStatuses", { ns: "pages" }),
      },
      ...ATTEMPT_STATUSES.map((value) => ({
        value,
        label: attemptStatusLabel(value, t),
      })),
    ],
    [t]
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
        <DatePicker
          label={t("publishLogs.filters.from", { ns: "pages" })}
          value={from}
          onChange={(e) => onChange({ from: e.target.value })}
          max={to || undefined}
        />
        <DatePicker
          label={t("publishLogs.filters.to", { ns: "pages" })}
          value={to}
          onChange={(e) => onChange({ to: e.target.value })}
          min={from || undefined}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {isFetching
            ? t("publishLogs.filters.refreshing", { ns: "pages" })
            : t("publishLogs.filters.autoApply", { ns: "pages" })}
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
