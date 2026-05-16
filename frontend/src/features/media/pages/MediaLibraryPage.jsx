import { useMemo, useState } from "react";

import { PageHeader } from "../../../components/shared/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { extractErrorMessage } from "../../../lib/axios";
import { MediaLibraryTable } from "../components/MediaLibraryTable";
import { MediaStorageSummary } from "../components/MediaStorageSummary";
import {
  useMediaLibraryAssets,
  useMediaStorageSummary,
  useScanMediaStorage,
} from "../hooks/useMediaLibrary";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS = {
  page: 1,
  type: "",
  status: "",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "video", label: "Video" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "image", label: "Image" },
  { value: "attachment", label: "Attachment" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "missing", label: "Missing" },
  { value: "deleted", label: "Deleted" },
];

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "fileSizeBytes:desc", label: "Largest first" },
  { value: "fileSizeBytes:asc", label: "Smallest first" },
];

function ErrorBlock({ title, message, onRetry }) {
  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        {title}
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

function MediaLibraryFilters({ filters, onChange, onReset, isFetching }) {
  const sortValue = `${filters.sortBy}:${filters.sortOrder}`;
  const hasFilters = Boolean(filters.type || filters.status || filters.search);

  return (
    <Card padding="md">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          label="Search"
          placeholder="File name, MIME type, or content title"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
        <Select
          label="Type"
          value={filters.type}
          onChange={(event) => onChange({ type: event.target.value })}
          options={TYPE_OPTIONS}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value })}
          options={STATUS_OPTIONS}
        />
        <Select
          label="Sort"
          value={sortValue}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(":");
            onChange({ sortBy, sortOrder });
          }}
          options={SORT_OPTIONS}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {isFetching ? "Refreshing results..." : "Filters apply automatically"}
        </p>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function Pagination({ meta, page, isFetching, onChange }) {
  const totalPages = Math.max(1, Number(meta.totalPages) || 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const total = Number(meta.total) || 0;
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted">
        {total === 0 ? "No results" : `Showing ${start}-${end} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev || isFetching}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-ink">
          Page <strong className="font-semibold">{page}</strong>{" "}
          <span className="text-muted">of {totalPages}</span>
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext || isFetching}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function MediaLibraryPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [scanResult, setScanResult] = useState(null);

  const queryFilters = useMemo(
    () => ({
      page: filters.page,
      limit: PAGE_SIZE,
      type: filters.type || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }),
    [filters]
  );

  const summaryQuery = useMediaStorageSummary();
  const assetsQuery = useMediaLibraryAssets(queryFilters);
  const scanMutation = useScanMediaStorage({
    onSuccess: (data) => setScanResult(data),
  });

  const updateFilter = (partial) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      if (!("page" in partial)) {
        next.page = 1;
      }
      return next;
    });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const items = assetsQuery.data?.items || [];
  const meta = assetsQuery.data?.meta || {
    page: filters.page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };
  const hasFilters = Boolean(filters.type || filters.status || filters.search);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Storage"
        title="Media Library"
        subtitle="Inspect uploaded media, storage usage, missing files, and cleanup candidates."
        actions={
          <Button
            variant="outline"
            loading={scanMutation.isPending}
            onClick={() => scanMutation.mutate()}
          >
            {scanMutation.isPending ? "Scanning" : "Scan storage"}
          </Button>
        }
      />

      {summaryQuery.isError ? (
        <ErrorBlock
          title="Couldn't load storage summary"
          message={extractErrorMessage(summaryQuery.error, "Unexpected error.")}
          onRetry={() => summaryQuery.refetch()}
        />
      ) : (
        <MediaStorageSummary
          summary={summaryQuery.data}
          isLoading={summaryQuery.isLoading}
        />
      )}

      {scanResult ? (
        <Card padding="md" className="border-amber-200 bg-amber-50">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-900">
            Scan result
          </p>
          <p className="mt-2 text-sm text-ink">
            Checked {scanResult.checkedDbMediaCount || 0} DB records. Marked{" "}
            {scanResult.markedMissingCount || 0} missing, restored{" "}
            {scanResult.restoredActiveCount || 0}, found{" "}
            {scanResult.orphanFileCount || 0} orphan files. No physical files
            were deleted.
          </p>
        </Card>
      ) : null}

      <MediaLibraryFilters
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
        isFetching={assetsQuery.isFetching && !assetsQuery.isLoading}
      />

      {assetsQuery.isLoading ? (
        <Card padding="lg" className="flex items-center justify-center py-16">
          <p className="text-sm text-muted">Loading media...</p>
        </Card>
      ) : assetsQuery.isError ? (
        <ErrorBlock
          title="Couldn't load media"
          message={extractErrorMessage(assetsQuery.error, "Unexpected error.")}
          onRetry={() => assetsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No media matches those filters" : "No media yet"}
          description={
            hasFilters
              ? "Clear a filter or widen the search."
              : "Uploaded files will appear here."
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
          <MediaLibraryTable assets={items} />
          <Pagination
            meta={meta}
            page={meta.page || filters.page}
            isFetching={assetsQuery.isFetching}
            onChange={(page) => updateFilter({ page })}
          />
        </>
      )}
    </div>
  );
}
