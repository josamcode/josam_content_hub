import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "../../../components/shared/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { extractErrorMessage } from "../../../lib/axios";
import { MediaAssetCard } from "../components/MediaAssetCard";
import { MediaAssetSkeleton } from "../components/MediaAssetSkeleton";
import { MediaPreviewModal } from "../components/MediaPreviewModal";
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

function useFilterLabelMap() {
  const { t } = useTranslation("pages");
  return useMemo(
    () => ({
      TYPE_OPTIONS: [
        { value: "", label: t("mediaLibrary.filters.allTypes") },
        { value: "video", label: t("mediaLibrary.types.video") },
        { value: "thumbnail", label: t("mediaLibrary.types.thumbnail") },
        { value: "image", label: t("mediaLibrary.types.image") },
        { value: "attachment", label: t("mediaLibrary.types.attachment") },
      ],
      STATUS_OPTIONS: [
        { value: "", label: t("mediaLibrary.filters.allStatuses") },
        { value: "active", label: t("mediaLibrary.statuses.active") },
        { value: "missing", label: t("mediaLibrary.statuses.missing") },
        { value: "deleted", label: t("mediaLibrary.statuses.deleted") },
      ],
      SORT_OPTIONS: [
        { value: "createdAt:desc", label: t("mediaLibrary.filters.newestFirst") },
        { value: "createdAt:asc", label: t("mediaLibrary.filters.oldestFirst") },
        { value: "fileSizeBytes:desc", label: t("mediaLibrary.filters.largestFirst") },
        { value: "fileSizeBytes:asc", label: t("mediaLibrary.filters.smallestFirst") },
      ],
    }),
    [t]
  );
}

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
  const { t } = useTranslation("pages");
  const { TYPE_OPTIONS, STATUS_OPTIONS, SORT_OPTIONS } = useFilterLabelMap();
  const sortValue = `${filters.sortBy}:${filters.sortOrder}`;
  const hasFilters = Boolean(filters.type || filters.status || filters.search);

  return (
    <Card padding="md">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label={t("mediaLibrary.filters.search")}
          placeholder={t("mediaLibrary.filters.searchPlaceholder")}
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
        <Select
          label={t("mediaLibrary.filters.type")}
          value={filters.type}
          onChange={(event) => onChange({ type: event.target.value })}
          options={TYPE_OPTIONS}
        />
        <Select
          label={t("mediaLibrary.filters.status")}
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value })}
          options={STATUS_OPTIONS}
        />
        <Select
          label={t("mediaLibrary.filters.sort")}
          value={sortValue}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(":");
            onChange({ sortBy, sortOrder });
          }}
          options={SORT_OPTIONS}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          {isFetching
            ? t("mediaLibrary.filters.refreshing")
            : t("mediaLibrary.filters.autoApply")}
        </p>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            {t("mediaLibrary.filters.clearFilters")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function Pagination({ meta, page, isFetching, onChange }) {
  const { t } = useTranslation("pages");
  const totalPages = Math.max(1, Number(meta.totalPages) || 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const total = Number(meta.total) || 0;
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted">
        {total === 0
          ? t("mediaLibrary.pagination.noResults")
          : t("mediaLibrary.pagination.showing", { start, end, total })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev || isFetching}
          onClick={() => onChange(page - 1)}
        >
          {t("mediaLibrary.pagination.previous")}
        </Button>
        <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-ink">
          {t("common:page")}{" "}
          <strong className="font-semibold">{page}</strong>{" "}
          <span className="text-muted">{t("common:of")}</span> {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext || isFetching}
          onClick={() => onChange(page + 1)}
        >
          {t("mediaLibrary.pagination.next")}
        </Button>
      </div>
    </div>
  );
}

export function MediaLibraryPage() {
  const { t } = useTranslation("pages");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [scanResult, setScanResult] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);

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
        eyebrow={t("mediaLibrary.eyebrow")}
        title={t("mediaLibrary.title")}
        subtitle={t("mediaLibrary.subtitle")}
        actions={
          <Button
            variant="outline"
            loading={scanMutation.isPending}
            onClick={() => scanMutation.mutate()}
          >
            {scanMutation.isPending
              ? t("mediaLibrary.actions.scanning")
              : t("mediaLibrary.actions.scanStorage")}
          </Button>
        }
      />

      {summaryQuery.isError ? (
        <ErrorBlock
          title={t("mediaLibrary.error.summaryTitle")}
          message={extractErrorMessage(summaryQuery.error, t("common:unexpectedError"))}
          onRetry={() => summaryQuery.refetch()}
        />
      ) : (
        <MediaStorageSummary
          summary={summaryQuery.data}
          isLoading={summaryQuery.isLoading}
        />
      )}

      {scanResult ? (
        <Card padding="md" className="border-amber-200/60 bg-amber-50/50">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-900">
            {t("mediaLibrary.scanResult.title")}
          </p>
          <p className="mt-2 text-sm text-ink">
            {t("mediaLibrary.scanResult.checked", {
              checked: scanResult.checkedDbMediaCount || 0,
              missing: scanResult.markedMissingCount || 0,
              restored: scanResult.restoredActiveCount || 0,
              orphans: scanResult.orphanFileCount || 0,
            })}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MediaAssetSkeleton count={6} />
        </div>
      ) : assetsQuery.isError ? (
        <ErrorBlock
          title={t("mediaLibrary.error.mediaTitle")}
          message={extractErrorMessage(assetsQuery.error, t("common:unexpectedError"))}
          onRetry={() => assetsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? t("mediaLibrary.empty.filteredTitle")
              : t("mediaLibrary.empty.noMedia")
          }
          description={
            hasFilters
              ? t("mediaLibrary.empty.filteredDescription")
              : t("mediaLibrary.empty.noMediaDescription")
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                {t("mediaLibrary.filters.clearFilters")}
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((asset) => (
              <MediaAssetCard
                key={asset.id}
                asset={asset}
                onPreview={setPreviewAsset}
              />
            ))}
          </div>
          <Pagination
            meta={meta}
            page={meta.page || filters.page}
            isFetching={assetsQuery.isFetching}
            onChange={(page) => updateFilter({ page })}
          />
        </>
      )}

      <MediaPreviewModal
        asset={previewAsset}
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
      />
    </div>
  );
}
