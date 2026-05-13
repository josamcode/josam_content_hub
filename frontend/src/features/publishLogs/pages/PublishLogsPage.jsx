import { useCallback, useMemo, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { PublishLogFilters } from "../components/PublishLogFilters";
import { PublishLogPagination } from "../components/PublishLogPagination";
import { PublishLogSkeleton } from "../components/PublishLogSkeleton";
import { PublishLogTable } from "../components/PublishLogTable";
import { usePublishAttempts } from "../hooks/usePublishAttempts";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS = {
  page: 1,
  platform: "",
  status: "",
  from: "",
  to: "",
};

function ErrorBlock({ message, onRetry }) {
  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        Couldn't load publish logs
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

export function PublishLogsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const queryFilters = useMemo(
    () => ({
      page: filters.page,
      limit: PAGE_SIZE,
      platform: filters.platform || undefined,
      status: filters.status || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [filters]
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    usePublishAttempts(queryFilters);

  const updateFilter = useCallback((partial) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      if (!("page" in partial)) {
        next.page = 1;
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const items = data?.items || [];
  const meta = data?.meta || {
    page: filters.page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };
  const hasFilters = Boolean(
    filters.platform || filters.status || filters.from || filters.to
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Monitor"
        title="Publish Logs"
        subtitle="Publishing history across platforms."
      />

      <PublishLogFilters
        platform={filters.platform}
        status={filters.status}
        from={filters.from}
        to={filters.to}
        onChange={updateFilter}
        onReset={resetFilters}
        isFetching={isFetching && !isLoading}
      />

      {isLoading ? (
        <PublishLogSkeleton rows={6} />
      ) : isError ? (
        <ErrorBlock
          message={extractErrorMessage(
            error,
            "We couldn't reach the API just now."
          )}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No logs match those filters." : "No publish logs yet."}
          description={
            hasFilters
              ? "Try clearing filters or widening the date range."
              : "Manual completions and future auto-publish attempts will appear here."
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <PublishLogTable attempts={items} />
          <PublishLogPagination
            page={meta.page || filters.page}
            totalPages={meta.totalPages || 0}
            total={meta.total || 0}
            limit={meta.limit || PAGE_SIZE}
            isFetching={isFetching}
            onChange={(nextPage) => updateFilter({ page: nextPage })}
          />
        </>
      )}
    </div>
  );
}
