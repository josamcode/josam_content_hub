import { useCallback, useMemo, useState } from "react";
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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Plan"
        title="Calendar"
        subtitle="Your scheduled content plan."
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            type="button"
          >
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              type="button"
              aria-label="Previous month"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goNext}
              type="button"
              aria-label="Next month"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl leading-none text-ink">
            {formatMonthLabel(focused)}
          </h2>
          {isFetching && !isLoading && (
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted">
              <Spinner size="sm" />
              Refreshing
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
            Couldn't load calendar
          </p>
          <p className="mt-2 text-sm text-ink">
            {extractErrorMessage(error, "We couldn't reach the API just now.")}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : events.length === 0 ? (
        <EmptyState
          title="No scheduled content for this month."
          description={
            hasFilters
              ? "Try clearing filters, or schedule a platform post from a content details page."
              : "Schedule a platform post from a content details page."
          }
          action={
            <Button as={Link} to="/content" variant="primary" size="md">
              Go to library
            </Button>
          }
        />
      ) : (
        <CalendarGrid
          focused={focused}
          events={events}
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
