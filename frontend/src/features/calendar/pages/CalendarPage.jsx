import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Spinner } from "../../../components/ui/Spinner";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { CalendarFilters } from "../components/CalendarFilters";
import { CalendarGrid } from "../components/CalendarGrid";
import { EventDetailsDrawer } from "../components/EventDetailsDrawer";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  formatMonthLabel,
  ymd,
} from "../lib/calendarMath";
import { useCalendarSchedules } from "../hooks/useCalendarSchedules";

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function startOfTodayMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function CalendarPage() {
  const { t, i18n } = useTranslation(["common", "pages"]);
  const [focused, setFocused] = useState(() => startOfTodayMonth());
  const [filters, setFilters] = useState({ platform: "", status: "" });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchRange = useMemo(() => {
    const grid = buildMonthGrid(focused);
    const first = grid[0];
    const last = grid[grid.length - 1];
    return {
      from: ymd(addDays(first, -1)),
      to: ymd(addDays(last, 1)),
    };
  }, [focused]);

  const queryParams = useMemo(
    () => ({
      from: fetchRange.from,
      to: fetchRange.to,
      platform: filters.platform || undefined,
      status: filters.status || undefined,
    }),
    [fetchRange, filters]
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useCalendarSchedules(queryParams);

  const events = data || [];

  const handleFilterChange = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const goToToday = () => setFocused(startOfTodayMonth());
  const goPrev = () => setFocused((d) => addMonths(d, -1));
  const goNext = () => setFocused((d) => addMonths(d, 1));

  const hasFilters = Boolean(filters.platform || filters.status);
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("calendar.eyebrow", { ns: "pages" })}
        title={t("calendar.title", { ns: "pages" })}
        subtitle={t("calendar.subtitle", { ns: "pages" })}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            type="button"
          >
            {t("calendar.actions.today", { ns: "pages" })}
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              type="button"
              aria-label={t("calendar.actions.previousMonth", { ns: "pages" })}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goNext}
              type="button"
              aria-label={t("calendar.actions.nextMonth", { ns: "pages" })}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl leading-none text-ink">
            {formatMonthLabel(focused, locale)}
          </h2>
          {isFetching && !isLoading && (
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted">
              <Spinner size="sm" />
              {t("refreshing", { ns: "common" })}
            </span>
          )}
        </div>
      </div>

      <CalendarFilters
        platform={filters.platform}
        status={filters.status}
        onChange={handleFilterChange}
        isFetching={isFetching && !isLoading}
      />

      {isLoading ? (
        <Card padding="lg" className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </Card>
      ) : isError ? (
        <Card padding="lg" className="border-danger/30 bg-danger/5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            {t("calendar.error.title", { ns: "pages" })}
          </p>
          <p className="mt-2 text-sm text-ink">
            {extractErrorMessage(
              error,
              t("calendar.error.fallback", { ns: "pages" })
            )}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t("tryAgain", { ns: "common" })}
            </Button>
          </div>
        </Card>
      ) : events.length === 0 ? (
        <EmptyState
          title={t("calendar.empty.title", { ns: "pages" })}
          description={
            hasFilters
              ? t("calendar.empty.filteredDescription", { ns: "pages" })
              : t("calendar.empty.description", { ns: "pages" })
          }
          action={
            <Button as={Link} to="/content" variant="primary" size="md">
              {t("calendar.actions.goToLibrary", { ns: "pages" })}
            </Button>
          }
        />
      ) : (
        <CalendarGrid
          focused={focused}
          events={events}
          locale={locale}
          onEventClick={(event) => setSelectedEvent(event)}
        />
      )}

      <EventDetailsDrawer
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
