import { useCallback, useState } from "react";
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

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  ...PLATFORMS.map((value) => ({ value, label: formatPlatform(value) })),
];

function ErrorBlock({ message, onRetry }) {
  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        Couldn't load reminders
      </p>
      <p className="mt-2 text-sm text-ink">{message}</p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Card>
  );
}

export function RemindersPage() {
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [platform, setPlatform] = useState("");

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
        eyebrow="Execute"
        title="Reminders"
        subtitle="Manual publishing tasks for scheduled content."
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-end md:justify-between md:p-5">
        <ReminderTabs value={range} onChange={setRange} />
        <div className="flex items-center gap-3">
          <div className="min-w-[14rem]">
            <Select
              label="Platform"
              value={platform}
              onChange={handlePlatformChange}
              options={PLATFORM_OPTIONS}
            />
          </div>
        </div>
      </div>

      {isFetching && !isLoading && (
        <p className="-mt-4 text-[11px] uppercase tracking-[0.16em] text-muted">
          Refreshing reminders…
        </p>
      )}

      {isLoading ? (
        <ReminderListSkeleton count={3} />
      ) : isError ? (
        <ErrorBlock
          message={extractErrorMessage(
            error,
            "We couldn't reach the API just now."
          )}
          onRetry={() => refetch()}
        />
      ) : reminders.length === 0 ? (
        <EmptyState
          title="No reminders here."
          description="Schedule a platform post manually to create a reminder."
          action={
            <Button as={Link} to="/content" variant="primary" size="md">
              Go to library
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
