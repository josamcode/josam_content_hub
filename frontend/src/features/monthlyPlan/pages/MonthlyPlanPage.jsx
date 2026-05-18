import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { useCalendarSchedules } from "../../calendar/hooks/useCalendarSchedules";
import { useContentItems } from "../../content/hooks/useContentItems";
import { useDebouncedValue } from "../../content/hooks/useDebouncedValue";
import { MonthlyPlanContentCard } from "../components/MonthlyPlanContentCard";
import { MonthlyPlanFilters } from "../components/MonthlyPlanFilters";
import { MonthlyPlanHeader } from "../components/MonthlyPlanHeader";
import { MonthlyPlanSection } from "../components/MonthlyPlanSection";
import { MonthlyPlanSkeleton } from "../components/MonthlyPlanSkeleton";
import { MonthlyPlanStats } from "../components/MonthlyPlanStats";
import {
  addMonths,
  computeStats,
  filterGroupedItems,
  groupMonthlyItems,
  startOfMonth,
  endOfMonth,
  ymd,
} from "../lib/monthlyPlan";

const PAGE_LIMIT = 100;

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  category: "",
  platform: "",
};

function startOfTodayMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function ErrorState({ message, onRetry }) {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        {t("monthlyPlan.error.title", { ns: "pages" })}
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

export function MonthlyPlanPage() {
  const { t, i18n } = useTranslation(["common", "pages"]);
  const [monthDate, setMonthDate] = useState(() => startOfTodayMonth());
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const queryFilters = useMemo(
    () => ({
      page: 1,
      limit: PAGE_LIMIT,
      status: filters.status || undefined,
      category: filters.category || undefined,
      platform: filters.platform || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [filters.status, filters.category, filters.platform, debouncedSearch]
  );

  const calendarRange = useMemo(() => {
    const ms = startOfMonth(monthDate);
    const me = endOfMonth(monthDate);
    return { from: ymd(ms), to: ymd(me) };
  }, [monthDate]);

  const {
    data: contentData,
    isLoading: isContentLoading,
    isError: isContentError,
    error: contentError,
    isFetching: isContentFetching,
    refetch: refetchContent,
  } = useContentItems(queryFilters);

  const {
    data: calendarEvents,
    isLoading: isCalendarLoading,
    isFetching: isCalendarFetching,
  } = useCalendarSchedules({
    from: calendarRange.from,
    to: calendarRange.to,
  });

  const items = contentData?.items || [];
  const isLoading = isContentLoading || isCalendarLoading;
  const isFetching = isContentFetching || isCalendarFetching;

  const rawGroups = useMemo(
    () => groupMonthlyItems(items, monthDate, calendarEvents || []),
    [items, monthDate, calendarEvents]
  );

  const groups = useMemo(
    () => filterGroupedItems(rawGroups, filters),
    [rawGroups, filters]
  );

  const stats = useMemo(() => computeStats(groups), [groups]);

  const updateFilter = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const goToToday = () => setMonthDate(startOfTodayMonth());
  const goPrev = () => setMonthDate((d) => addMonths(d, -1));
  const goNext = () => setMonthDate((d) => addMonths(d, 1));

  const hasFilters = Boolean(
    filters.search || filters.status || filters.category || filters.platform
  );

  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("monthlyPlan.eyebrow", { ns: "pages" })}
        title={t("monthlyPlan.title", { ns: "pages" })}
        subtitle={t("monthlyPlan.subtitle", { ns: "pages" })}
      />

      <MonthlyPlanHeader
        monthDate={monthDate}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToToday}
        isFetching={isFetching && !isLoading}
        locale={locale}
      />

      <MonthlyPlanFilters
        search={filters.search}
        status={filters.status}
        category={filters.category}
        platform={filters.platform}
        onChange={updateFilter}
        onReset={resetFilters}
        isFetching={isFetching && !isLoading}
      />

      {isLoading ? (
        <MonthlyPlanSkeleton />
      ) : isContentError ? (
        <ErrorState
          message={extractErrorMessage(
            contentError,
            t("monthlyPlan.error.fallback", { ns: "pages" })
          )}
          onRetry={() => refetchContent()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? t("monthlyPlan.empty.filteredTitle", { ns: "pages" })
              : t("monthlyPlan.empty.noContentTitle", { ns: "pages" })
          }
          description={
            hasFilters
              ? t("monthlyPlan.empty.filteredDescription", { ns: "pages" })
              : t("monthlyPlan.empty.noContentDescription", { ns: "pages" })
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
          <MonthlyPlanStats stats={stats} />

          {groups.needsAttention.length > 0 && (
            <MonthlyPlanSection
              title={t("monthlyPlan.sections.needsAttention", { ns: "pages" })}
              count={groups.needsAttention.length}
              emptyMessage={t("monthlyPlan.empty.noAttention", { ns: "pages" })}
            >
              {groups.needsAttention.map((item) => (
                <MonthlyPlanContentCard key={item.id} item={item} />
              ))}
            </MonthlyPlanSection>
          )}

          <MonthlyPlanSection
            title={t("monthlyPlan.sections.unscheduled", { ns: "pages" })}
            count={groups.unscheduled.length}
            emptyMessage={t("monthlyPlan.empty.noUnscheduled", { ns: "pages" })}
          >
            {groups.unscheduled.map((item) => (
              <MonthlyPlanContentCard key={item.id} item={item} />
            ))}
          </MonthlyPlanSection>

          <MonthlyPlanSection
            title={t("monthlyPlan.sections.scheduled", { ns: "pages" })}
            count={groups.scheduledThisMonth.length}
            emptyMessage={t("monthlyPlan.empty.noScheduled", { ns: "pages" })}
          >
            {groups.scheduledThisMonth.map((item) => (
              <MonthlyPlanContentCard key={item.id} item={item} />
            ))}
          </MonthlyPlanSection>

          {groups.publishedThisMonth.length > 0 && (
            <MonthlyPlanSection
              title={t("monthlyPlan.sections.published", { ns: "pages" })}
              count={groups.publishedThisMonth.length}
              emptyMessage={t("monthlyPlan.empty.noPublished", { ns: "pages" })}
            >
              {groups.publishedThisMonth.map((item) => (
                <MonthlyPlanContentCard key={item.id} item={item} />
              ))}
            </MonthlyPlanSection>
          )}
        </>
      )}
    </div>
  );
}
