import { useMemo } from "react";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";
import { CalendarEvent } from "./CalendarEvent";
import {
  buildMonthGrid,
  dayKeyInTimezone,
  getWeekdayLabels,
  isSameDay,
  isSameMonth,
  ymd,
} from "../lib/calendarMath";

function groupEventsByDay(events) {
  const map = new Map();
  for (const event of events) {
    const key = dayKeyInTimezone(event.scheduledAt, event.timezone);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(event);
  }
  for (const [, list] of map) {
    list.sort((a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }
  return map;
}

export function CalendarGrid({ focused, events = [], locale, onEventClick }) {
  const days = useMemo(() => buildMonthGrid(focused), [focused]);
  const groups = useMemo(() => groupEventsByDay(events), [events]);
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);
  const today = new Date();

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-canvas/60">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, focused);
          const isToday = isSameDay(day, today);
          const key = ymd(day);
          const dayEvents = groups.get(key) || [];

          return (
            <div
              key={key}
              className={cn(
                "flex min-h-[7.5rem] flex-col gap-1 border-b border-e border-border p-2",
                !inMonth && "bg-canvas/40",
                isToday && "bg-accent-soft/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums",
                    inMonth ? "text-ink" : "text-muted/60",
                    isToday && "bg-ink text-canvas"
                  )}
                >
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {dayEvents.map((event) => (
                  <CalendarEvent
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
