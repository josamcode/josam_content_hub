import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { ContentCard } from "../components/ContentCard";
import { ContentFilters } from "../components/ContentFilters";
import { ContentLibrarySkeleton } from "../components/ContentLibrarySkeleton";
import { Pagination } from "../components/Pagination";
import { useContentItems } from "../hooks/useContentItems";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const PAGE_SIZE = 12;

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  category: "",
  platform: "",
  page: 1,
};

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        Couldn't load content
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

export function ContentLibraryPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const queryFilters = useMemo(
    () => ({
      page: filters.page,
      limit: PAGE_SIZE,
      status: filters.status || undefined,
      category: filters.category || undefined,
      platform: filters.platform || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [filters.page, filters.status, filters.category, filters.platform, debouncedSearch]
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useContentItems(queryFilters);

  const updateFilter = useCallback((partial) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      // Any filter change (except page itself) resets pagination to page 1
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
  const meta = data?.meta || { page: filters.page, limit: PAGE_SIZE, total: 0, totalPages: 0 };
  const hasFilters = Boolean(
    filters.search || filters.status || filters.category || filters.platform
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Library"
        title="Content Library"
        subtitle="Every idea, draft and finished piece — in one quiet place."
        actions={
          <Button as={Link} to="/content/new" variant="primary" size="md">
            <PlusIcon />
            New Content
          </Button>
        }
      />

      <ContentFilters
        search={filters.search}
        status={filters.status}
        category={filters.category}
        platform={filters.platform}
        onChange={updateFilter}
        onReset={resetFilters}
        isFetching={isFetching && !isLoading}
      />

      {isLoading ? (
        <ContentLibrarySkeleton count={6} />
      ) : isError ? (
        <ErrorState
          message={extractErrorMessage(
            error,
            "We couldn't reach the API just now."
          )}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Nothing matches those filters" : "No content yet"}
          description={
            hasFilters
              ? "Try widening your search or clearing a filter or two."
              : "Start with an idea — even a rough one. You can refine it later."
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : (
              <Button as={Link} to="/content/new" variant="primary" size="md">
                <PlusIcon />
                Create your first item
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>

          <Pagination
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
