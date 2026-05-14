import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Select } from "../../../components/ui/Select";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { PLATFORMS, formatPlatform } from "../../../lib/format";
import { ReminderCard } from "../components/ReminderCard";
import { ReminderListSkeleton } from "../components/ReminderListSkeleton";
import { ReminderTabs } from "../components/ReminderTabs";
import { useReminders } from "../hooks/useReminders";

const DEFAULT_RANGE = "today";

function ErrorBlock({ message, onRetry }) {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        {t("reminders.error.title", { ns: "pages" })}
      </p>
      <p className="mt-2 text-sm text-ink">{message}</p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("tryAgain", { ns: "common" })}
        </Button>
      </div>
    </Card>
  );
}

export function RemindersPage() {
  const { t } = useTranslation(["common", "pages"]);
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [platform, setPlatform] = useState("");

  const platformOptions = useMemo(
    () => [
      {
        value: "",
        label: t("reminders.filters.allPlatforms", { ns: "pages" }),
      },
      ...PLATFORMS.map((value) => ({ value, label: formatPlatform(value) })),
    ],
    [t]
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useReminders({
      range,
      platform: platform || undefined,
    });

  const reminders = data || [];

  const handlePlatformChange = useCallback((event) => {
    setPlatform(event.target.value);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("reminders.eyebrow", { ns: "pages" })}
        title={t("reminders.title", { ns: "pages" })}
        subtitle={t("reminders.subtitle", { ns: "pages" })}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-end md:justify-between md:p-5">
        <ReminderTabs value={range} onChange={setRange} />
        <div className="flex items-center gap-3">
          <div className="min-w-[14rem]">
            <Select
              label={t("platform", { ns: "common" })}
              value={platform}
              onChange={handlePlatformChange}
              options={platformOptions}
            />
          </div>
        </div>
      </div>

      {isFetching && !isLoading && (
        <p className="-mt-4 text-[11px] uppercase tracking-[0.16em] text-muted">
          {t("reminders.refreshing", { ns: "pages" })}
        </p>
      )}

      {isLoading ? (
        <ReminderListSkeleton count={3} />
      ) : isError ? (
        <ErrorBlock
          message={extractErrorMessage(
            error,
            t("reminders.error.fallback", { ns: "pages" })
          )}
          onRetry={() => refetch()}
        />
      ) : reminders.length === 0 ? (
        <EmptyState
          title={t("reminders.empty.title", { ns: "pages" })}
          description={t("reminders.empty.description", { ns: "pages" })}
          action={
            <Button as={Link} to="/content" variant="primary" size="md">
              {t("reminders.actions.goToLibrary", { ns: "pages" })}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {reminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </div>
  );
}
