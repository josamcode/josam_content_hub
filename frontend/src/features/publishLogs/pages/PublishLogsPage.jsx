import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

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
  platformPostId: "",
  platform: "",
  status: "",
  from: "",
  to: "",
};

function ErrorBlock({ message, onRetry }) {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        {t("publishLogs.error.title", { ns: "pages" })}
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

export function PublishLogsPage() {
  const { t } = useTranslation(["common", "pages"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    platformPostId: searchParams.get("platformPostId") || "",
    platform: searchParams.get("platform") || "",
    status: searchParams.get("status") || "",
  }));

  const queryFilters = useMemo(
    () => ({
      page: filters.page,
      limit: PAGE_SIZE,
      platformPostId: filters.platformPostId || undefined,
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
    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      if (!("page" in partial)) {
        next.page = 1;
      }
      return next;
    });
  }, [searchParams, setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
    setFilters(DEFAULT_FILTERS);
  }, [setSearchParams]);

  const items = data?.items || [];
  const meta = data?.meta || {
    page: filters.page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };
  const hasFilters = Boolean(
    filters.platformPostId ||
      filters.platform ||
      filters.status ||
      filters.from ||
      filters.to
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("publishLogs.eyebrow", { ns: "pages" })}
        title={t("publishLogs.title", { ns: "pages" })}
        subtitle={t("publishLogs.subtitle", { ns: "pages" })}
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
            t("publishLogs.error.fallback", { ns: "pages" })
          )}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? t("publishLogs.empty.filteredTitle", { ns: "pages" })
              : t("publishLogs.empty.title", { ns: "pages" })
          }
          description={
            hasFilters
              ? t("publishLogs.empty.filteredDescription", { ns: "pages" })
              : t("publishLogs.empty.description", { ns: "pages" })
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                {t("clearFilters", { ns: "common" })}
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
