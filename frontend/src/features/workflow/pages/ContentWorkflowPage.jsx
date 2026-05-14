import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { useContentItems } from "../../content/hooks/useContentItems";
import { useDebouncedValue } from "../../content/hooks/useDebouncedValue";
import { WorkflowColumn } from "../components/WorkflowColumn";
import { WorkflowFilters } from "../components/WorkflowFilters";
import { WorkflowSkeleton } from "../components/WorkflowSkeleton";
import {
  PRIMARY_WORKFLOW_STATUSES,
  SECONDARY_WORKFLOW_STATUSES,
  groupItemsByStatus,
} from "../lib/workflow";

const BOARD_LIMIT = 100;

const DEFAULT_FILTERS = {
  search: "",
  category: "",
  platform: "",
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
        Couldn't load workflow
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

export function ContentWorkflowPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showSecondary, setShowSecondary] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const queryFilters = useMemo(
    () => ({
      page: 1,
      limit: BOARD_LIMIT,
      category: filters.category || undefined,
      platform: filters.platform || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [filters.category, filters.platform, debouncedSearch]
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useContentItems(queryFilters);

  const updateFilter = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const items = data?.items || [];
  const meta = data?.meta || { total: 0, page: 1, limit: BOARD_LIMIT };

  const visibleStatuses = useMemo(
    () =>
      showSecondary
        ? [...PRIMARY_WORKFLOW_STATUSES, ...SECONDARY_WORKFLOW_STATUSES]
        : PRIMARY_WORKFLOW_STATUSES,
    [showSecondary]
  );

  const visibleItems = useMemo(() => {
    if (showSecondary) return items;
    return items.filter((item) =>
      PRIMARY_WORKFLOW_STATUSES.includes(item.status)
    );
  }, [items, showSecondary]);

  const grouped = useMemo(
    () => groupItemsByStatus(visibleItems, visibleStatuses),
    [visibleItems, visibleStatuses]
  );

  const totalVisible = visibleItems.length;
  const hasFilters = Boolean(
    filters.search || filters.category || filters.platform
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Workflow"
        title="Workflow Board"
        subtitle="Track every content item from idea to published."
        actions={
          <Button as={Link} to="/content/new" variant="primary" size="md">
            <PlusIcon />
            New Content
          </Button>
        }
      />

      <WorkflowFilters
        search={filters.search}
        category={filters.category}
        platform={filters.platform}
        showSecondary={showSecondary}
        onChange={updateFilter}
        onReset={resetFilters}
        onToggleSecondary={() => setShowSecondary((v) => !v)}
        isFetching={isFetching && !isLoading}
      />

      {isLoading ? (
        <WorkflowSkeleton columns={5} />
      ) : isError ? (
        <ErrorState
          message={extractErrorMessage(
            error,
            "We couldn't reach the API just now."
          )}
          onRetry={() => refetch()}
        />
      ) : totalVisible === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "Nothing matches those filters"
              : "No content in this workflow yet"
          }
          description={
            hasFilters
              ? "Try widening your search or clearing a filter or two."
              : "Create a content item to start moving it through production."
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
          <div className="flex gap-3 overflow-x-auto pb-2">
            {visibleStatuses.map((status) => (
              <WorkflowColumn
                key={status}
                status={status}
                items={grouped.get(status) || []}
              />
            ))}
          </div>

          {meta.total > items.length && (
            <p className="text-center text-[11px] uppercase tracking-[0.16em] text-muted">
              Showing the first {items.length} of {meta.total} items. Use filters
              to narrow the board.
            </p>
          )}
        </>
      )}
    </div>
  );
}
